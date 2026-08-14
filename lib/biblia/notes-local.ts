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

/**
 * Clave histórica. Se conserva intacta para no perder notas locales previas a
 * FASE F. Las notas canónicas nuevas usan una clave separada por usuario.
 */
export const VIDA_BIBLE_NOTES_STORAGE_KEY = 'vida-biblia-notas-v2'
export const VIDA_BIBLE_NOTES_USER_STORAGE_PREFIX = 'vida-biblia-notas-v3'

let syncTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalados = false
let colaEncolado: Promise<void> = Promise.resolve()

function ahoraIso() {
  return new Date().toISOString()
}

function claveNotas(ownerId?: string | null) {
  return ownerId
    ? `${VIDA_BIBLE_NOTES_USER_STORAGE_PREFIX}:${ownerId}`
    : VIDA_BIBLE_NOTES_STORAGE_KEY
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

function leerNotasDesdeClave(storageKey: string): NotaBiblicaLocal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const normalizadas = parsed.map((nota) => normalizarNota(nota as Partial<NotaBiblicaLocal>))
    const normalizadasRaw = JSON.stringify(normalizadas)
    if (normalizadasRaw !== raw) localStorage.setItem(storageKey, normalizadasRaw)
    return normalizadas
  } catch {
    return []
  }
}

function escribirNotasEnClave(storageKey: string, notas: NotaBiblicaLocal[]) {
  localStorage.setItem(storageKey, JSON.stringify(notas))
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

function encolarCambiosConUsuario(
  anteriores: NotaBiblicaLocal[],
  siguientes: NotaBiblicaLocal[],
  ownerId: string
) {
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
}

function encolarCambiosTrasResolverUsuario(
  anteriores: NotaBiblicaLocal[],
  siguientes: NotaBiblicaLocal[]
) {
  colaEncolado = colaEncolado.then(async () => {
    const ownerId = await resolverUsuarioActualNotas()
    if (!ownerId) return
    encolarCambiosConUsuario(anteriores, siguientes, ownerId)
  }).catch(() => {})
}

export function leerNotasBiblicasLocales(ownerId?: string | null): NotaBiblicaLocal[] {
  if (typeof window === 'undefined') return []
  instalarListenersSincronizacion()
  return leerNotasDesdeClave(claveNotas(ownerId))
}

export function leerNotasBiblicasLegadas(): NotaBiblicaLocal[] {
  return leerNotasBiblicasLocales(null)
}

export function guardarNotasBiblicasLocales(
  notas: NotaBiblicaLocal[],
  ownerId?: string | null
) {
  if (typeof window === 'undefined') return false
  instalarListenersSincronizacion()
  try {
    const storageKey = claveNotas(ownerId)
    const anteriores = leerNotasDesdeClave(storageKey)
    escribirNotasEnClave(storageKey, notas)

    if (ownerId) encolarCambiosConUsuario(anteriores, notas, ownerId)
    else encolarCambiosTrasResolverUsuario(anteriores, notas)

    return true
  } catch {
    return false
  }
}

/**
 * Reemplaza la caché canónica de un usuario con datos ya reconciliados desde
 * Supabase. No genera operaciones de salida, para evitar bucles de sync.
 */
export function reemplazarNotasBiblicasLocalesDesdeServidor(
  notas: NotaBiblicaLocal[],
  ownerId: string
) {
  if (typeof window === 'undefined') return false
  try {
    escribirNotasEnClave(claveNotas(ownerId), notas)
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

export function agregarNotaBiblicaLocal(
  cambios: Partial<NotaBiblicaLocal>,
  ownerId?: string | null
): NotaBiblicaLocal {
  const nota = crearNotaBiblicaLocal(cambios)
  const actuales = leerNotasBiblicasLocales(ownerId).filter((item) => item.id !== nota.id)
  guardarNotasBiblicasLocales([nota, ...actuales], ownerId)
  return nota
}

export async function agregarNotaBiblicaDelUsuario(
  cambios: Partial<NotaBiblicaLocal>
): Promise<NotaBiblicaLocal> {
  const ownerId = await resolverUsuarioActualNotas()
  return agregarNotaBiblicaLocal(cambios, ownerId)
}
