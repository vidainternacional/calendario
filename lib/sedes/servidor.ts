import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarAudiencia, type AudienciaSedes } from './audiencias'

export async function sesionSedes() {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Tu sesión expiró.')
  const db = client as unknown as SupabaseClient
  const { data: perfil, error: perfilError } = await db.from('profiles').select('activo,estado_cuenta,rol,es_pastor_general').eq('id', user.id).single()
  if (perfilError || !perfil?.activo || perfil.estado_cuenta !== 'activo') throw new Error('Tu cuenta no está activa.')
  return { db, user, perfil }
}
export async function validarAudienciaSedes(db: SupabaseClient, value: unknown): Promise<AudienciaSedes> {
  const audiencia = normalizarAudiencia(value)
  const { data, error } = await db.rpc('vida_validar_audiencia', { p_audiencia: audiencia })
  if (error || data !== true) throw new Error('La selección contiene sedes o destinatarios fuera de tu responsabilidad. Revisa tus permisos con Administración.')
  return audiencia
}
export async function destinatariosSedes(tipo: 'aviso' | 'devocional' | 'paquete', id: string) {
  const { db } = await sesionSedes()
  const ids = new Set<string>()
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await db.rpc('vida_destinatarios_contenido', { p_tipo: tipo, p_id: id }).range(from, from + 999)
    if (error || !data) throw new Error('No se pudieron comprobar los destinatarios actuales.')
    for (const row of data as { profile_id: string }[]) ids.add(row.profile_id)
    if (data.length < 1000) return [...ids]
  }
  throw new Error('La audiencia excede el límite de envío.')
}
