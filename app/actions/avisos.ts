'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { composePushBody, notifyUsersOnceByReference } from '@/lib/webpush'

export type AvisoState = {
  error?: string
  success?: boolean
  pendiente?: boolean
  notificados?: number
  mensaje?: string
} | undefined

type AvisoPushInput = {
  id: string
  ministerioId: string | null
  autorId: string | null
  titulo: string
  cuerpo: string
}

async function resolverOrigenAviso(
  service: ReturnType<typeof createServiceClient>,
  ministerioId: string | null,
  autorId: string | null,
) {
  if (ministerioId) {
    const { data: ministerio } = await service
      .from('ministerios')
      .select('nombre')
      .eq('id', ministerioId)
      .single()

    return (ministerio as any)?.nombre || 'Ministerio'
  }

  if (autorId) {
    const { data: autor } = await service
      .from('profiles')
      .select('rol, es_pastor_general')
      .eq('id', autorId)
      .single()

    const perfil = autor as any
    if (perfil?.rol === 'pastor' || perfil?.es_pastor_general) {
      return 'Mensaje pastoral'
    }
  }

  return 'Anuncio general'
}

async function enviarNotificacionAviso(input: AvisoPushInput): Promise<number> {
  const service = createServiceClient()
  let targetUserIds: string[] = []

  if (!input.ministerioId) {
    const { data: allUsers, error: usersError } = await service
      .from('profiles')
      .select('id')
      .eq('activo', true)

    if (usersError) throw usersError
    targetUserIds = (allUsers || []).map((user: any) => user.id)
  } else {
    const { data: miembros, error: miembrosError } = await service
      .from('ministerio_miembros')
      .select('profile_id')
      .eq('ministerio_id', input.ministerioId)

    if (miembrosError) throw miembrosError
    targetUserIds = (miembros || []).map((miembro: any) => miembro.profile_id)
  }

  targetUserIds = [...new Set(targetUserIds)]
  if (targetUserIds.length === 0) return 0

  const preferenciasQuery = service
    .from('notificaciones_preferencias')
    .select('profile_id')
    .eq('activo', false)

  const { data: preferencias, error: preferenciasError } = input.ministerioId
    ? await preferenciasQuery.eq('ministerio_id', input.ministerioId)
    : await preferenciasQuery.is('ministerio_id', null)

  if (preferenciasError) {
    console.warn('[avisos] No se pudieron leer las preferencias:', preferenciasError)
  }

  const disabledIds = new Set((preferencias || []).map((item: any) => item.profile_id))
  const finalUserIds = targetUserIds.filter((profileId) => !disabledIds.has(profileId))
  if (finalUserIds.length === 0) return 0

  const origen = await resolverOrigenAviso(service, input.ministerioId, input.autorId)
  const result = await notifyUsersOnceByReference(
    finalUserIds,
    {
      title: origen,
      body: composePushBody(input.titulo, input.cuerpo),
      url: `/avisos/${input.id}`,
      tag: `aviso-${input.id}`,
      renotify: true,
    },
    { tipo: 'aviso', referenciaId: input.id },
  )

  console.log('[avisos] Reparto push completado', {
    avisoId: input.id,
    ministerioId: input.ministerioId,
    destinatarios: finalUserIds.length,
    usuariosNotificados: result.users,
    dispositivos: result.devices,
  })

  return result.devices
}

export async function crearAviso(
  ministerioId: string,
  _state: AvisoState,
  formData: FormData,
): Promise<AvisoState> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  const minIdForm = ((formData.get('ministerio_id') as string) ?? ministerioId).trim()

  if (!titulo || !cuerpo) return { error: 'Por favor completa todos los campos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const isGlobal = !minIdForm
  let estado = 'aprobado'

  if (isGlobal) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, es_pastor_general')
      .eq('id', user.id)
      .single()

    const perfil = profile as any
    const puedePublicarDirecto = perfil?.rol === 'administrador' || perfil?.es_pastor_general
    if (!puedePublicarDirecto) estado = 'pendiente'
  }

  const { data: aviso, error } = await (supabase as any)
    .from('publicaciones')
    .insert({
      ministerio_id: minIdForm || null,
      autor_id: user.id,
      tipo: 'aviso',
      titulo,
      cuerpo,
      estado,
    })
    .select('id')
    .single()

  if (error || !aviso) return { error: error?.message || 'No se pudo publicar el aviso.' }

  let notificados = 0
  let mensaje = estado === 'pendiente'
    ? 'El aviso fue enviado a revisión.'
    : 'El aviso fue publicado correctamente.'

  if (estado === 'aprobado') {
    try {
      notificados = await enviarNotificacionAviso({
        id: aviso.id,
        ministerioId: minIdForm || null,
        autorId: user.id,
        titulo,
        cuerpo,
      })
      mensaje = notificados > 0
        ? `Aviso publicado y enviado a ${notificados} dispositivo${notificados === 1 ? '' : 's'}.`
        : 'Aviso publicado. Los dispositivos se reconectarán al abrir VIDA.'
    } catch (pushError) {
      console.error('[avisos] El aviso se publicó, pero falló el reparto push:', pushError)
      mensaje = 'El aviso fue publicado, pero no se pudo completar el envío de notificaciones.'
    }
  }

  revalidatePath('/avisos')
  revalidatePath('/inicio')
  if (minIdForm) revalidatePath(`/ministerios/${minIdForm}/avisos`)

  return { success: true, pendiente: estado === 'pendiente', notificados, mensaje }
}

export async function aprobarAviso(avisoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const perfil = profile as any
  if (perfil?.rol !== 'administrador' && !perfil?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos para aprobar avisos.' }
  }

  const { data: aviso } = await (supabase as any)
    .from('publicaciones')
    .select('id, titulo, cuerpo, ministerio_id, autor_id')
    .eq('id', avisoId)
    .single()

  const { error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'aprobado' })
    .eq('id', avisoId)

  if (error) return { success: false, error: error.message }

  let notificados = 0
  if (aviso) {
    try {
      notificados = await enviarNotificacionAviso({
        id: aviso.id,
        ministerioId: aviso.ministerio_id || null,
        autorId: aviso.autor_id || null,
        titulo: aviso.titulo,
        cuerpo: aviso.cuerpo,
      })
    } catch (pushError) {
      console.error('[avisos] Aviso aprobado, pero falló el reparto push:', pushError)
    }
  }

  revalidatePath('/avisos/pendientes-aprobacion')
  revalidatePath('/avisos')
  revalidatePath('/inicio')
  return { success: true, notificados }
}

export async function rechazarAviso(avisoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const perfil = profile as any
  if (perfil?.rol !== 'administrador' && !perfil?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos para rechazar avisos.' }
  }

  const { error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'rechazado' })
    .eq('id', avisoId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/avisos/pendientes-aprobacion')
  return { success: true }
}
