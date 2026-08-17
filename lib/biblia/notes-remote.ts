'use client'

import { createClient } from '@/lib/supabase/client'
import {
  leerOperacionesNotasPendientes,
  type OperacionNotaBiblicaPendiente,
} from '@/lib/biblia/notes-queue'
import type { ContextoNotaBiblica, NotaBiblicaLocal, TipoNotaBiblica } from '@/lib/biblia/notes-local'

export type NotaBiblicaRemota = {
  id: string
  nota: string | null
  titulo: string | null
  tipo: string | null
  referencia: string | null
  paquete_id: string | null
  origen: string | null
  origen_key: string | null
  pasaje_normalizado: string | null
  numero_predicacion: number | null
  fecha_predicacion: string | null
  serie: string | null
  lugar: string | null
  predicador: string | null
  estado_predicacion: string | null
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

function contextoValido(contexto: unknown): ContextoNotaBiblica {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return {}
  return contexto as ContextoNotaBiblica
}

function paqueteDesdeContexto(contexto: unknown) {
  const normalizado = contextoValido(contexto)
  const paquete = normalizado.paquete
  return typeof paquete === 'string' ? paquete : ''
}

function numeroPredicacionValido(value: number | null) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function tituloDesdeFila(row: NotaBiblicaRemota) {
  const explicito = row.titulo?.trim()
  if (explicito) return explicito

  const referencia = row.referencia?.trim()
  if (row.origen === 'estudio_profundo' && referencia) return `Estudio: ${referencia}`

  return 'Sin título'
}

function mapearNotaRemota(row: NotaBiblicaRemota): NotaBiblicaLocal {
  const creadaEn = row.created_at ?? row.updated_at ?? new Date(0).toISOString()
  const actualizadaEn = row.updated_at ?? creadaEn

  return {
    id: row.id,
    titulo: tituloDesdeFila(row),
    contenido: row.nota ?? '',
    tipo: esTipoNota(row.tipo) ? row.tipo : 'personal',
    referencia: row.referencia ?? '',
    paqueteId: row.paquete_id ?? '',
    paquete: paqueteDesdeContexto(row.contexto),
    origen: row.origen ?? 'biblia_notas',
    origenKey: row.origen_key ?? '',
    pasajeNormalizado: row.pasaje_normalizado ?? '',
    contexto: contextoValido(row.contexto),
    numeroPredicacion: numeroPredicacionValido(row.numero_predicacion),
    fechaPredicacion: row.fecha_predicacion ?? '',
    serie: row.serie ?? '',
    lugar: row.lugar ?? '',
    predicador: row.predicador ?? '',
    estadoPredicacion: row.estado_predicacion ?? '',
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
    .select('id,nota,titulo,tipo,referencia,paquete_id,origen,origen_key,pasaje_normalizado,numero_predicacion,fecha_predicacion,serie,lugar,predicador,estado_predicacion,contexto,estado,created_at,updated_at')
    .eq('profile_id', ownerId)
    .in('origen', ['biblia_notas', 'estudio_profundo'])
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
