'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { contextoPastoral } from '@/lib/auth/permisos'
import { esMensajeSemanal, youtubeVideo } from '@/lib/estudios/youtube-link'

type Resultado = { success: boolean; error?: string }
const uuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

async function contexto() {
  const ctx = await contextoPastoral('No tienes permiso para publicar mensajes.')
  if (ctx.error || !ctx.user) return { db: null, user: null }
  const db = ctx.supabase as unknown as SupabaseClient
  const { data, error } = await db.from('profiles').select('rol,estado_cuenta').eq('id', ctx.user.id).single()
  if (error || data?.estado_cuenta !== 'activo' || !['pastor', 'administrador'].includes(data.rol)) return { db: null, user: null }
  return { db, user: ctx.user }
}

function refrescar(id?: string) {
  for (const path of ['/estudios/mensajes', '/inicio', '/paquetes-recibidos', '/pastoral/paquetes']) revalidatePath(path)
  if (id) {
    revalidatePath(`/estudios/mensajes/${id}`)
    revalidatePath(`/materiales/${id}`)
    revalidatePath(`/pastoral/paquetes/${id}`)
  }
}

export async function guardarMensajeSemanal(form: FormData): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user) return { success: false, error: 'Solo un pastor o administrador con cuenta activa puede guardar mensajes.' }
  const id = String(form.get('id') || '')
  const revision = String(form.get('revision') || '')
  const titulo = String(form.get('titulo') || '').trim()
  const descripcion = String(form.get('descripcion') || '').trim()
  const video = youtubeVideo(String(form.get('video_url') || ''))
  if (!titulo || titulo.length > 140) return { success: false, error: 'Escribe un título de hasta 140 caracteres.' }
  if (descripcion.length > 2000) return { success: false, error: 'La descripción debe tener hasta 2000 caracteres.' }
  if (!video) return { success: false, error: 'Pega un enlace HTTPS válido de un video de YouTube.' }
  if (id && (!uuid(id) || !revision)) return { success: false, error: 'Actualiza la página antes de editar este mensaje.' }

  const publicar = form.get('publicar') === 'on'
  let anterior: Record<string, unknown> | null = null
  if (id) {
    const { data, error } = await db.from('pastoral_paquetes').select('id,audiencia,instrucciones,bosquejo_id,coleccion_id,recurso_ids,publicado,published_at,updated_at')
      .eq('id', id).eq('profile_id', user.id).maybeSingle()
    if (error || !data || !esMensajeSemanal(data)) return { success: false, error: 'No puedes editar este mensaje.' }
    if (data.updated_at !== revision) return { success: false, error: 'El mensaje cambió. Recarga la página antes de guardar.' }
    anterior = data
  }
  const campos = {
    titulo, descripcion_publica: descripcion, instrucciones: video.url, audiencia: 'iglesia',
    publicado: publicar, estado: publicar ? 'compartido' : 'borrador',
    published_at: publicar ? (anterior?.published_at || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }
  const result = id
    ? await db.from('pastoral_paquetes').update(campos).eq('id', id).eq('profile_id', user.id).eq('updated_at', revision).select('id')
    : await db.from('pastoral_paquetes').insert({ ...campos, profile_id: user.id, recurso_ids: [], bosquejo_id: null, coleccion_id: null }).select('id')
  if (result.error || !result.data?.length) return { success: false, error: 'No se pudo guardar. Recarga la página e intenta nuevamente.' }
  refrescar(result.data[0].id)
  return { success: true }
}

export async function cambiarPublicacionMensaje(id: string, revision: string, publicar: boolean): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user || !uuid(id) || !revision || typeof publicar !== 'boolean') return { success: false, error: 'No autorizado.' }
  const { data, error } = await db.from('pastoral_paquetes').select('id,audiencia,instrucciones,bosquejo_id,coleccion_id,recurso_ids,published_at,updated_at')
    .eq('id', id).eq('profile_id', user.id).maybeSingle()
  if (error || !data || !esMensajeSemanal(data)) return { success: false, error: 'No puedes modificar este mensaje.' }
  if (data.updated_at !== revision) return { success: false, error: 'El mensaje cambió. Recarga la página.' }
  const { data: guardados, error: updateError } = await db.from('pastoral_paquetes').update({
    publicado: publicar, estado: publicar ? 'compartido' : 'borrador',
    published_at: publicar ? (data.published_at || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('profile_id', user.id).eq('updated_at', revision).select('id')
  if (updateError || !guardados?.length) return { success: false, error: 'No se pudo cambiar la publicación. Actualiza la página.' }
  refrescar(id)
  return { success: true }
}
