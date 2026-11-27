'use server'

import { createClient } from '@/lib/supabase/server'
import { canSaveStudy } from '@/lib/estudios/study-history'
import type { EstudioState } from './estudio-interno'
import type { StudyHistoryItem, StudyHistoryPage } from '@/lib/estudios/study-history-types'
import type { SupabaseClient } from '@supabase/supabase-js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function listarEstudiosHistorial(offset = 0): Promise<StudyHistoryPage> {
  if (!Number.isSafeInteger(offset) || offset < 0) return { success: false, error: 'Página de historial inválida.' }
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { success: false, error: 'Inicia sesión para consultar tu historial.' }
  const { data, error, count } = await db.from('estudio_historial_privado')
    .select('id,consulta,created_at,tipo', { count: 'exact' }).eq('profile_id', user.id)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 25)
  if (error) return { success: false, error: 'Tu historial no está disponible en este momento.' }
  return { success: true, items: (data ?? []).slice(0, 25) as StudyHistoryItem[], hasMore: (data ?? []).length > 25, total: count ?? 0 }
}

export async function abrirEstudioHistorial(id: string): Promise<EstudioState> {
  if (!UUID.test(id)) return { status: 'error', error: 'La respuesta guardada no es válida.' }
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { status: 'error', error: 'Inicia sesión para abrir tu respuesta.' }
  const { data, error } = await db.from('estudio_historial_privado')
    .select('id,created_at,resultado').eq('id', id).eq('profile_id', user.id).maybeSingle()
  if (error || !data || !canSaveStudy(data.resultado)) return { status: 'error', error: 'No pudimos abrir esa respuesta de tu historial.' }
  return { ...data.resultado, history: { id: data.id, createdAt: data.created_at, reused: true } }
}

export async function eliminarEstudioHistorial(id: string) {
  if (!UUID.test(id)) return { success: false, error: 'La respuesta guardada no es válida.' }
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { success: false, error: 'Inicia sesión para administrar tu historial.' }
  const { error } = await db.from('estudio_historial_privado').delete().eq('id', id).eq('profile_id', user.id)
  return error ? { success: false, error: 'No pudimos eliminar esa respuesta.' } : { success: true }
}
