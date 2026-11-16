import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { mensajeDesdeFila, type MensajeSemanal } from './youtube-link'

const CAMPOS = 'id,profile_id,titulo,descripcion_publica,instrucciones,publicado,published_at,updated_at,audiencia,bosquejo_id,coleccion_id,recurso_ids'
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
    const ids = new Set<string>()
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await db.rpc('get_received_pastoral_packages').select('id').range(offset, offset + 99)
      if (error) throw error
      if (data !== null && !Array.isArray(data)) throw new Error('Respuesta de permisos inválida')
      const recibidos = (data ?? []) as Array<{ id?: unknown }>
      for (const row of recibidos) if (typeof row.id === 'string') ids.add(row.id)
      if (recibidos.length < 100) break
    }

    let filas: Record<string, unknown>[] = []
    // El cliente administrativo solo recibe IDs autorizados por el RPC del usuario.
    if (ids.size > 0) {
      const service = createServiceClient() as unknown as SupabaseClient
      const lista = [...ids]
      for (let offset = 0; offset < lista.length; offset += 400) {
        const lotes = []
        for (let start = offset; start < Math.min(offset + 400, lista.length); start += 100) lotes.push(lista.slice(start, start + 100))
        const resultados = await Promise.all(lotes.map(idsDelLote => service.from('pastoral_paquetes').select(CAMPOS)
          .in('id', idsDelLote).eq('publicado', true).eq('audiencia', 'iglesia')
          .is('bosquejo_id', null).is('coleccion_id', null).eq('recurso_ids', '{}')
          .like('instrucciones', 'https://www.youtube.com/watch?v=%')
          .order('published_at', { ascending: false }).order('id').limit(limite)))
        for (const { data, error } of resultados) {
          if (error) throw error
          filas.push(...(data ?? []))
        }
      }
      filas = filas.filter(row => ids.has(String(row.id)) && row.publicado === true && mensajeDesdeFila(row)).sort((a, b) =>
        String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')) || String(a.id).localeCompare(String(b.id)))
      const autores = [...new Set(filas.slice((page - 1) * POR_PAGINA, page * POR_PAGINA).map(row => String(row.profile_id)))]
      const nombres = new Map<string, string>()
      if (autores.length) {
        const { data, error } = await service.from('profiles').select('id,nombre_completo').in('id', autores)
        if (error) throw error
        for (const row of data ?? []) nombres.set(row.id, row.nombre_completo || 'Pastor de VIDA')
      }
      const mensajes = filas.slice((page - 1) * POR_PAGINA, page * POR_PAGINA).map(row => ({
        ...mensajeDesdeFila(row)!, autor: nombres.get(String(row.profile_id)) || 'Pastor de VIDA',
      }))
      const propios = puedePublicar ? await cargarPropios(db, user.id) : []
      return { mensajes, propios, puedePublicar, haySiguiente: filas.length > page * POR_PAGINA, autenticado: true, error: null }
    }
    return { ...vacio, propios: puedePublicar ? await cargarPropios(db, user.id) : [], puedePublicar, autenticado: true, error: null }
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
