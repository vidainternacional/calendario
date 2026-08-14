'use client'

import {
  VIDA_BIBLE_NOTES_SYNC_EVENT,
  encolarDeleteNotaBiblica,
  encolarUpsertNotaBiblica,
} from '@/lib/biblia/notes-queue'
import {
  resolverUsuarioActualNotas,
  sincronizarNotasBiblicasPendientes,
} from '@/lib/biblia/notes-sync'

export type TipoNotaBiblica = 'versiculo' | 'estudio' | 'predicacion' | 'personal'

export type NotaBiblicaLocal = {
  id: string
  titulo: string
  contenido: string
  tipo: TipoNotaBiblica
  referencia: string
  paqueteId: string
  paquete: string
  creadaEn: string
  actualizadaEn: string
}

export const VIDA_BIBLE_NOTES_STORAGE_KEY = 'vida-biblia-notas-v2'

let syncTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalados = false
let colaEncolado: Promise<void> = Promise.resolve()

function ahoraIso() {
  return new Date().toISOString()
}

function normalizarNota(nota: Partial<NotaBiblicaLocal>): NotaBiblicaLocal {
  const ahora = ahoraIso()
  return {
    id: nota.id ?? crypto.randomUUID(),
    titulo: nota.titulo ?? 'Sin título',
    contenido: nota.contenido ?? '',
    tipo: nota.tipo ?? 'personal',
    referencia: nota.referencia ?? '',
    paqueteId: nota.paqueteId ?? '',
    paquete: nota.paquete ?? '',
    creadaEn: nota.creadaEn ?? ahora,
    actualizadaEn: nota.actualizadaEn ?? nota.creadaEn ?? ahora,
  }
}

function programarSincronizacion(delay = 700) {
  if (typeof window === 'undefined') return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void sincronizarNotasBiblicasPendientes()
  }, delay)
}

function instalarListenersSincronizacion() {
  if (typeof window === 'undefined' || listenersInstalados) return
  listenersInstalados = true

  window.addEventListener(VIDA_BIBLE_NOTES_SYNC_EVENT, () => programarSincronizacion())
  window.addEventListener('online', () => programarSincronizacion(0))
  window.addEventListener('focus', () => programarSincronizacion(0))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') programarSincronizacion(0)
  })

  programarSincronizacion(0)
}

function encolarCambiosTrasResolverUsuario(
  anteriores: NotaBiblicaLocal[],
  siguientes: NotaBiblicaLocal[]
) {
  colaEncolado = colaEncolado.then(async () => {
    const ownerId = await resolverUsuarioActualNotas()
    if (!ownerId) return

    const anterioresPorId = new Map(anteriores.map((nota) => [nota.id, nota]))
    const siguientesPorId = new Map(siguientes.map((nota) => [nota.id, nota]))

    for (const nota of siguientes) {
      const anterior = anterioresPorId.get(nota.id)
      if (!anterior || JSON.stringify(anterior) !== JSON.stringify(nota)) {
        encolarUpsertNotaBiblica(nota, ownerId)
      }
    }

    for (const anterior of anteriores) {
      if (!siguientesPorId.has(anterior.id)) encolarDeleteNotaBiblica(anterior.id, ownerId)
    }
  }).catch(() => {})
}

export function leerNotasBiblicasLocales(): NotaBiblicaLocal[] {
  if (typeof window === 'undefined') return []
  instalarListenersSincronizacion()
  try {
    const raw = localStorage.getItem(VIDA_BIBLE_NOTES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const normalizadas = parsed.map((nota) => normalizarNota(nota as Partial<NotaBiblicaLocal>))
    const normalizadasRaw = JSON.stringify(normalizadas)
    if (normalizadasRaw !== raw) {
      localStorage.setItem(VIDA_BIBLE_NOTES_STORAGE_KEY, normalizadasRaw)
    }
    return normalizadas
  } catch {
    return []
  }
}

export function guardarNotasBiblicasLocales(notas: NotaBiblicaLocal[]) {
  if (typeof window === 'undefined') return false
  instalarListenersSincronizacion()
  try {
    const anteriores = leerNotasBiblicasLocales()
    localStorage.setItem(VIDA_BIBLE_NOTES_STORAGE_KEY, JSON.stringify(notas))
    encolarCambiosTrasResolverUsuario(anteriores, notas)
    return true
  } catch {
    return false
  }
}

export function crearNotaBiblicaLocal(cambios: Partial<NotaBiblicaLocal> = {}): NotaBiblicaLocal {
  const ahora = ahoraIso()
  return normalizarNota({
    id: crypto.randomUUID(),
    titulo: 'Nueva nota',
    contenido: '',
    tipo: 'personal',
    referencia: '',
    paqueteId: '',
    paquete: '',
    creadaEn: ahora,
    actualizadaEn: ahora,
    ...cambios,
  })
}

export function agregarNotaBiblicaLocal(cambios: Partial<NotaBiblicaLocal>): NotaBiblicaLocal {
  const nota = crearNotaBiblicaLocal(cambios)
  const actuales = leerNotasBiblicasLocales().filter((item) => item.id !== nota.id)
  guardarNotasBiblicasLocales([nota, ...actuales])
  return nota
}
