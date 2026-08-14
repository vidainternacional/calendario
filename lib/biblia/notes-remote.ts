'use client'

import { createClient } from '@/lib/supabase/client'
import {
  leerOperacionesNotasPendientes,
  type OperacionNotaBiblicaPendiente,
} from '@/lib/biblia/notes-queue'
import type { NotaBiblicaLocal, TipoNotaBiblica } from '@/lib/biblia/notes-local'

export type NotaBiblicaRemota = {
  id: string
  nota: string | null
  titulo: string | null
  tipo: string | null
  referencia: string | null
  paquete_id: string | null
  contexto: unknown
  estado: string | null
  created_at: string | null
  updated_at: string | null
}

export type ResultadoNotasRemotas = {
  notas: NotaBiblicaLocal[]
  actualizadas: boolean
  error?: string
}

function esTipoNota(value: string | null): value is TipoNotaBiblica {
  return value === 'versiculo' || value === 'estudio' || value === 'predicacion' || value === 'personal'
}

function fechaMs(value: string | null | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function paqueteDesdeContexto(contexto: unknown) {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return ''
  const paquete = (contexto as Record<string, unknown>).paquete
  return typeof paquete === 'string' ? paquete : ''
}

function mapearNotaRemota(row: NotaBiblicaRemota): NotaBiblicaLocal {
  const creadaEn = row.created_at ?? row.updated_at ?? new Date(0).toISOString()
  const actualizadaEn = row.updated_at ?? creadaEn

  return {
    id: row.id,
    titulo: row.titulo ?? 'Sin título',
    contenido: row.nota ?? '',
    tipo: esTipoNota(row.tipo) ? row.tipo : 'personal',
    referencia: row.referencia ?? '',
    paqueteId: row.paquete_id ?? '',
    paquete: paqueteDesdeContexto(row.contexto),
    creadaEn,
    actualizadaEn,
  }
}

/**
 * Mezcla determinista para sincronización bidireccional:
 * - una operación local pendiente siempre gana;
 * - sin operación pendiente, gana la versión con updated_at más reciente;
 * - un tombstone remoto elimina solo si no existe una edición local más nueva.
 */
export function mezclarNotasBiblicasRemotas(
  locales: NotaBiblicaLocal[],
  remotas: NotaBiblicaRemota[],
  pendientes: OperacionNotaBiblicaPendiente[],
  ownerId: string
): NotaBiblicaLocal[] {
  const resultado = new Map(locales.map((nota) => [nota.id, nota]))
  const pendientesUsuario = pendientes.filter((operacion) => operacion.ownerId === ownerId)
  const pendientePorId = new Map(pendientesUsuario.map((operacion) => [operacion.id, operacion]))

  // El estado que el usuario aún no ha logrado subir tiene prioridad absoluta.
  for (const operacion of pendientesUsuario) {
    if (operacion.tipo === 'upsert') resultado.set(operacion.id, operacion.nota)
    else resultado.delete(operacion.id)
  }

  for (const row of remotas) {
    if (pendientePorId.has(row.id)) continue

    const local = resultado.get(row.id)
    const remotaActualizada = fechaMs(row.updated_at)
    const localActualizada = fechaMs(local?.actualizadaEn)

    if (row.estado === 'eliminado') {
      if (!local || remotaActualizada >= localActualizada) resultado.delete(row.id)
      continue
    }

    const remota = mapearNotaRemota(row)
    if (!local || remotaActualizada >= localActualizada) resultado.set(row.id, remota)
  }

  return [...resultado.values()].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
}

export async function obtenerNotasBiblicasRemotasMezcladas(
  ownerId: string,
  locales: NotaBiblicaLocal[]
): Promise<ResultadoNotasRemotas> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { notas: locales, actualizadas: false }
  }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user || session.user.id !== ownerId) {
    return { notas: locales, actualizadas: false, error: 'Sesión no disponible para sincronizar notas.' }
  }

  const { data, error } = await (supabase as any)
    .from('notas_estudio')
    .select('id,nota,titulo,tipo,referencia,paquete_id,contexto,estado,created_at,updated_at')
    .eq('profile_id', ownerId)
    .eq('origen', 'biblia_notas')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[notas-remote] No se pudieron descargar notas:', error)
    return { notas: locales, actualizadas: false, error: 'No se pudieron descargar las notas.' }
  }

  const remotas = (Array.isArray(data) ? data : []) as NotaBiblicaRemota[]
  const pendientes = leerOperacionesNotasPendientes()
  const mezcladas = mezclarNotasBiblicasRemotas(locales, remotas, pendientes, ownerId)

  return {
    notas: mezcladas,
    actualizadas: JSON.stringify(mezcladas) !== JSON.stringify(locales),
  }
}
