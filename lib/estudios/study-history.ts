import 'server-only'

import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EstudioState } from '@/app/actions/estudio-interno'
import type { SavedStudyState } from './study-history-types'

export const STUDY_HISTORY_VERSION = 'estudio-fuentes-v1'
const MAX_BYTES = 512 * 1024

export function historyQueryKey(query: string, translationId = 'spa_r09') {
  // No quitar negación, tildes o puntuación: una similitud no certifica la misma pregunta.
  const normalized = query.normalize('NFC').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim()
  return createHash('sha256').update(`${translationId}\u0000${normalized}`).digest('hex')
}

export function canSaveStudy(value: unknown): value is SavedStudyState {
  if (!value || typeof value !== 'object') return false
  const state = value as SavedStudyState
  if (typeof state.query !== 'string') return false
  if (state.status === 'place') return Boolean(state.place && Array.isArray(state.place.references))
  if (state.status !== 'success') return false
  if (state.kind === 'study') return typeof state.pasaje === 'string' && Boolean(state.resultado && typeof state.resultado.explicacion === 'string')
  if (state.kind !== 'concordance' || !Array.isArray(state.results)) return false
  if (state.answer) return state.answer.status === 'answered' && Array.isArray(state.answer.paragraphs)
    && state.answer.paragraphs.length > 0 && Array.isArray(state.answer.sources)
  return state.results.length > 0
}

/** Guardado solo desde el resultado calculado en servidor, nunca un snapshot recibido del cliente. */
export async function reuseSavedStudy(db: SupabaseClient, ownerId: string, query: string, translationId: string) {
  const { data, error } = await db.from('estudio_historial_privado')
    .select('id,created_at,resultado').eq('profile_id', ownerId)
    .eq('consulta_key', historyQueryKey(query, translationId)).eq('version', STUDY_HISTORY_VERSION).maybeSingle()
  if (error) return { status: 'unavailable' as const }
  if (!data) return { status: 'missing' as const }
  const snapshot = data.resultado as EstudioState
  if (!snapshot || !canSaveStudy(snapshot)) return { status: 'unavailable' as const }
  return { status: 'found' as const, state: { ...snapshot, history: { id: String(data.id), createdAt: String(data.created_at), reused: true } } as EstudioState }
}

export async function saveStudy(db: SupabaseClient, ownerId: string, query: string, translationId: string, state: EstudioState): Promise<EstudioState> {
  if (!canSaveStudy(state)) return state
  const snapshot = { ...state }
  delete snapshot.history
  delete snapshot.historyWarning
  const payload = JSON.stringify(snapshot)
  if (Buffer.byteLength(payload, 'utf8') > MAX_BYTES) {
    return { ...state, historyWarning: 'La respuesta supera el tamaño permitido para el historial. Sigue visible, pero no se guardó.' }
  }
  const failure = { ...state, historyWarning: 'La respuesta está lista, pero no pudimos guardarla en tu historial. Conserva esta pantalla; volver a generarla puede consumir IA.' }
  try {
    const { data, error } = await db.from('estudio_historial_privado').upsert({
      profile_id: ownerId, consulta: query, consulta_key: historyQueryKey(query, translationId),
      version: STUDY_HISTORY_VERSION, tipo: state.status === 'place' ? 'place' : state.kind, resultado: snapshot,
    }, { onConflict: 'profile_id,consulta_key,version' }).select('id,created_at').single()
    if (error || !data) return failure
    return { ...state, history: { id: String(data.id), createdAt: String(data.created_at), reused: false } }
  } catch { return failure }
}
