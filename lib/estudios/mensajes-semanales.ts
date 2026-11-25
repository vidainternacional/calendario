import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { mensajeDesdeFila, type MensajeSemanal } from './youtube-link'

const CAMPOS = 'id,profile_id,titulo,descripcion_publica,instrucciones,publicado,published_at,updated_at,audiencia,bosquejo_id,coleccion_id,recurso_ids,vida_audiencia'
const POR_PAGINA = 12
export type MensajeVisible = MensajeSemanal & { autor: string }

/** Solo los materiales publicados que el RPC vigente autoriza pueden leerse aquí. */
export async function cargarMensajesSemanales(pagina = 1) {
  const client = await createClient()
  const db = client as unknown as SupabaseClient
  const { data: { user } } = await client.auth.getUser()
  const vacio = { mensajes: [] as MensajeVisible[], propios: [] as MensajeSemanal[], puedePublicar: false, haySiguiente: false }
  if (!user) return { ...vacio, autenticado: false, error: null }
  const { data: perfil, error: perfilError } = await db.from('profiles')
    .select('rol,estado_cuenta,nombre_completo').eq('id', user.id).single()
  if (perfilError || perfil?.estado_cuenta !== 'activo') {
    return { ...vacio, autenticado: true, error: 'Se requiere una cuenta activa para consultar los mensajes.' }
  }
  const puedePublicar = ['pastor', 'administrador'].includes(perfil.rol)
  const page = Math.min(100, Math.max(1, Math.floor(pagina) || 1))
  const limite = page * POR_PAGINA + 1
  try {
    const { data, error } = await db.rpc('vida_mensajes_legado_visibles', { p_tope: limite })
    if (error || !Array.isArray(data)) throw new Error('Respuesta de permisos inválida')
    const filas = data as Record<string, unknown>[]
    const mensajes = filas.slice((page - 1) * POR_PAGINA, page * POR_PAGINA).map(row => ({
      ...mensajeDesdeFila(row)!, autor: String(row.autor || 'Pastor de VIDA'),
    })).filter(row => Boolean(row.id))
    return { mensajes, propios: puedePublicar ? await cargarPropios(db, user.id) : [], puedePublicar, haySiguiente: filas.length > page * POR_PAGINA, autenticado: true, error: null }
  } catch {
    return { ...vacio, autenticado: true, error: 'No se pudieron cargar los mensajes. Intenta de nuevo en unos momentos.' }
  }
}

async function cargarPropios(db: SupabaseClient, userId: string): Promise<MensajeSemanal[]> {
  const { data, error } = await db.from('pastoral_paquetes').select(CAMPOS)
    .eq('profile_id', userId).eq('audiencia', 'iglesia').is('bosquejo_id', null).is('coleccion_id', null)
    .eq('recurso_ids', '{}').like('instrucciones', 'https://www.youtube.com/watch?v=%')
    .order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => mensajeDesdeFila(row)).filter((m: MensajeSemanal | null): m is MensajeSemanal => Boolean(m))
}

/** Carga únicamente mensajes propios para la gestión dentro del Centro Pastoral. */
export async function cargarMisMensajesSemanales() {
  const client = await createClient()
  const db = client as unknown as SupabaseClient
  const { data: { user } } = await client.auth.getUser()
  const base = { propios: [] as MensajeSemanal[], puedeGestionar: false, error: null as string | null }
  if (!user) return { ...base, autenticado: false }
  const { data: perfil, error } = await db.from('profiles')
    .select('rol,estado_cuenta').eq('id', user.id).single()
  if (error || perfil?.estado_cuenta !== 'activo' || !['pastor', 'administrador'].includes(perfil.rol)) {
    return { ...base, autenticado: true }
  }
  try {
    return { propios: await cargarPropios(db, user.id), puedeGestionar: true, autenticado: true, error: null }
  } catch {
    return { ...base, puedeGestionar: true, autenticado: true, error: 'No fue posible cargar tus mensajes.' }
  }
}
