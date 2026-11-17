'use server'

import { revalidatePath } from 'next/cache'
import { notificarMensajeDirigido } from '@/lib/estudios/notificar-mensaje-dirigido'
import type { SupabaseClient } from '@supabase/supabase-js'
import { contextoPastoral } from '@/lib/auth/permisos'
import { youtubeVideo } from '@/lib/estudios/youtube-link'
import { ROL_DESTINO_IDS, TIPO_DEVOCIONAL_IDS, type RolDestino, type TipoDevocional } from '@/lib/estudios/mensajes-dirigidos-tipos'

type Resultado = { success: boolean; error?: string; aviso?: string }
const uuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

async function contexto() {
  const ctx = await contextoPastoral('No tienes permiso para publicar mensajes.')
  if (ctx.error || !ctx.user) return { db: null, user: null }
  const db = ctx.supabase as unknown as SupabaseClient
  const { data, error } = await db.from('profiles')
    .select('rol,estado_cuenta,activo').eq('id', ctx.user.id).single()
  if (error || !data?.activo || data.estado_cuenta !== 'activo' ||
      !['pastor','administrador'].includes(data.rol)) return { db: null, user: null }
  return { db, user: ctx.user }
}

function refrescar(id: string) {
  revalidatePath('/pastoral/mensajes')
  revalidatePath('/estudios/mensajes')
  revalidatePath('/inicio')
  revalidatePath('/paquetes-recibidos')
  revalidatePath('/estudios/mensajes/' + id)
}

function destinatarios(form: FormData): {
  error?: string
  iglesia: boolean
  roles: RolDestino[]
  ministerios: string[]
  lideres: boolean
} {
  const iglesia = form.get('audiencia_iglesia') === 'on'
  const lideres = form.get('lideres_ministerio') === 'on'
  const rolesCrudos = form.getAll('rol_destino').map(v => String(v))
  const ministeriosCrudos = form.getAll('ministerio_destino').map(v => String(v))
  if (rolesCrudos.some(v => !ROL_DESTINO_IDS.has(v as RolDestino)) ||
      ministeriosCrudos.some(v => !uuid(v)) || ministeriosCrudos.length > 40) {
    return { error: 'La selección de destinatarios no es válida.', iglesia, lideres, roles: [], ministerios: [] }
  }
  return { iglesia, lideres, roles: [...new Set(rolesCrudos)] as RolDestino[],
    ministerios: [...new Set(ministeriosCrudos)] }
}

export async function guardarMensajeDirigido(form: FormData): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user) return { success: false, error: 'Solo pastores y administradores activos pueden publicar.' }
  const id = String(form.get('id') ?? '')
  const revision = String(form.get('revision') ?? '')
  const titulo = String(form.get('titulo') ?? '').trim()
  const descripcion = String(form.get('descripcion') ?? '').trim()
  const video = youtubeVideo(String(form.get('video_url') ?? ''))
  const tipo = String(form.get('tipo') || 'mensaje') as TipoDevocional
  const serieTitulo = String(form.get('serie_titulo') || '').trim()
  const episodioTexto = String(form.get('serie_episodio') || '').trim()
  const serieEpisodio = Number(episodioTexto)
  const publicar = form.get('publicar') === 'on'
  const audiencia = destinatarios(form)

  if (!titulo || titulo.length > 140) return { success: false, error: 'Escribí un título de hasta 140 caracteres.' }
  if (descripcion.length > 2000) return { success: false, error: 'La descripción no puede superar los 2000 caracteres.' }
  if (!video) return { success: false, error: 'Pegá un enlace HTTPS válido de un video de YouTube.' }
  if (!TIPO_DEVOCIONAL_IDS.has(tipo)) return { success: false, error: 'La categoría no es válida.' }
  if (tipo === 'serie' && (!serieTitulo || serieTitulo.length > 100 || !/^[1-9][0-9]{0,2}$/.test(episodioTexto) || serieEpisodio > 999)) {
    return { success: false, error: 'Para una serie indicá el nombre (máximo 100 caracteres) y un episodio entre 1 y 999.' }
  }
  if (audiencia.error) return { success: false, error: audiencia.error }
  if (publicar && !audiencia.iglesia && !audiencia.lideres &&
      !audiencia.roles.length && !audiencia.ministerios.length) {
    return { success: false, error: 'Elegí al menos un grupo o ministerio antes de publicar.' }
  }
  if (id && (!uuid(id) || !revision)) return { success: false, error: 'Actualizá la página antes de editar.' }

  if (audiencia.ministerios.length) {
    const { data: activos, error } = await db.from('ministerios')
      .select('id').in('id', audiencia.ministerios).eq('activo', true)
    if (error || !activos || activos.length !== audiencia.ministerios.length) {
      return { success: false, error: 'Uno de los ministerios ya no está disponible. Revisá la selección.' }
    }
  }

  let anterior: { published_at: string | null; updated_at: string } | null = null
  if (id) {
    const { data, error } = await db.from('vida_devocionales')
      .select('updated_at,published_at').eq('id', id).eq('autor_id', user.id).maybeSingle()
    if (error || !data) return { success: false, error: 'No podés editar este mensaje.' }
    if (data.updated_at !== revision) return { success: false, error: 'El mensaje cambió. Actualizá la página antes de guardar.' }
    anterior = data
  }

  const campos = {
    titulo, descripcion, video_url: video.url, tipo,
    serie_titulo: tipo === 'serie' ? serieTitulo : null,
    serie_episodio: tipo === 'serie' ? serieEpisodio : null,
    publicado: publicar,
    audiencia_iglesia: audiencia.iglesia,
    roles_destino: audiencia.roles,
    ministerios_destino: audiencia.ministerios,
    lideres_ministerio: audiencia.lideres,
    published_at: publicar ? (anterior?.published_at || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }
  const resultado = id
    ? await db.from('vida_devocionales').update(campos)
      .eq('id', id).eq('autor_id', user.id).eq('updated_at', revision).select('id')
    : await db.from('vida_devocionales').insert({ ...campos, autor_id: user.id }).select('id')
  if (resultado.error || !resultado.data?.length) {
    if (resultado.error?.code === '23505') return { success: false, error: 'Ese número de episodio ya existe en esta serie. Elegí otro.' }
    return { success: false, error: 'No se pudo guardar el mensaje. Comprobá tu conexión e intentá nuevamente.' }
  }
  const guardadoId = String(resultado.data[0].id)
  refrescar(guardadoId)
  const aviso = publicar && !anterior?.published_at ? await notificarMensajeDirigido(guardadoId, user.id) : undefined
  return { success: true, aviso }
}

export async function cambiarPublicacionDirigida(id: string, revision: string, publicar: boolean): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user || !uuid(id) || !revision || typeof publicar !== 'boolean') {
    return { success: false, error: 'No autorizado.' }
  }
  const { data, error } = await db.from('vida_devocionales')
    .select('audiencia_iglesia,roles_destino,ministerios_destino,lideres_ministerio,published_at,updated_at')
    .eq('id', id).eq('autor_id', user.id).maybeSingle()
  if (error || !data) return { success: false, error: 'No podés modificar este mensaje.' }
  if (data.updated_at !== revision) return { success: false, error: 'El mensaje cambió. Actualizá la página.' }
  if (publicar && !data.audiencia_iglesia && !data.lideres_ministerio &&
      !(data.roles_destino?.length) && !(data.ministerios_destino?.length)) {
    return { success: false, error: 'Elegí primero los destinatarios dentro de Editar.' }
  }
  const { data: guardados, error: updateError } = await db.from('vida_devocionales')
    .update({ publicado: publicar,
      published_at: publicar ? (data.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString() })
    .eq('id', id).eq('autor_id', user.id).eq('updated_at', revision).select('id')
  if (updateError || !guardados?.length) return { success: false, error: 'No se pudo actualizar. Recargá la página.' }
  refrescar(id)
  const aviso = publicar && !data.published_at ? await notificarMensajeDirigido(id, user.id) : undefined
  return { success: true, aviso }
}


// Reintento explícito del autor: nunca cambia publicación, contenido ni destinatarios.
export async function avisarMensajeDirigido(id: string): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user || !uuid(id)) return { success: false, error: 'No autorizado.' }
  const { data, error } = await db.from('vida_devocionales').select('id,publicado')
    .eq('id', id).eq('autor_id', user.id).eq('publicado', true).maybeSingle()
  if (error || !data || !data.publicado) return { success: false, error: 'Solo el autor puede avisar sobre su mensaje publicado.' }
  return { success: true, aviso: await notificarMensajeDirigido(id, user.id) }
}

/** Eliminación explícita del autor; la política RLS debe permitirla por separado. */
export async function eliminarMensajeDirigido(id: string, revision: string): Promise<Resultado> {
  const { db, user } = await contexto()
  if (!db || !user || !uuid(id) || !revision) return { success: false, error: 'No autorizado.' }
  const { data, error } = await db.from('vida_devocionales').delete()
    .eq('id', id).eq('autor_id', user.id).eq('updated_at', revision).select('id')
  if (error || !data?.length) return { success: false, error: 'No se pudo eliminar el mensaje. Actualizá la página; si continúa, consultá al administrador.' }
  refrescar(id)
  return { success: true }
}
