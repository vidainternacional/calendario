'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { notifyMultipleUsers } from '@/lib/webpush'

export type AvisoState = {
  error?: string
  success?: boolean
  pendiente?: boolean
  notificados?: number
  mensaje?: string
} | undefined

export async function crearAviso(
  ministerioId: string,
  _state: AvisoState,
  formData: FormData
): Promise<AvisoState> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  const minIdForm = (formData.get('ministerio_id') as string) ?? ministerioId

  if (!titulo || !cuerpo) return { error: 'Por favor completa todos los campos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const isGlobal = !minIdForm || minIdForm === ''
  let estado = 'aprobado'

  if (isGlobal) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, es_pastor_general')
      .eq('id', user.id)
      .single()

    const p = profile as any
    const puedePublicarDirecto = p?.rol === 'administrador' || p?.es_pastor_general
    if (!puedePublicarDirecto) estado = 'pendiente'
  }

  const { error } = await (supabase as any).from('publicaciones').insert({
    ministerio_id: minIdForm === '' ? null : minIdForm,
    autor_id: user.id,
    tipo: 'aviso',
    titulo,
    cuerpo,
    estado,
  })

  if (error) return { error: error.message }

  let notificados = 0
  let mensaje = estado === 'pendiente'
    ? 'El aviso fue enviado a revisión.'
    : 'El aviso fue publicado correctamente.'

  if (estado === 'aprobado') {
    try {
      notificados = await _enviarNotificacionAviso(minIdForm || '', titulo, cuerpo)
      mensaje = notificados > 0
        ? `Aviso publicado y enviado a ${notificados} dispositivo${notificados === 1 ? '' : 's'}.`
        : 'Aviso publicado. No había dispositivos habilitados para recibir esta notificación.'
    } catch (pushError) {
      console.error('[avisos] El aviso se publicó, pero falló el reparto push:', pushError)
      mensaje = 'El aviso fue publicado, pero no se pudo completar el envío de notificaciones.'
    }
  }

  revalidatePath('/avisos')
  revalidatePath('/inicio')
  return { success: true, pendiente: estado === 'pendiente', notificados, mensaje }
}

async function _enviarNotificacionAviso(
  minIdForm: string,
  titulo: string,
  cuerpo: string
): Promise<number> {
  const service = createServiceClient()

  let targetUserIds: string[] = []
  if (!minIdForm) {
    const { data: allUsers, error: usersError } = await service
      .from('profiles')
      .select('id')
      .eq('activo', true)

    if (usersError) throw usersError
    targetUserIds = (allUsers || []).map((u: any) => u.id)
  } else {
    const { data: miembros, error: miembrosError } = await service
      .from('ministerio_miembros')
      .select('profile_id')
      .eq('ministerio_id', minIdForm)

    if (miembrosError) throw miembrosError
    targetUserIds = (miembros || []).map((m: any) => m.profile_id)
  }

  targetUserIds = [...new Set(targetUserIds)]

  if (targetUserIds.length === 0) {
    console.log('[avisos] Sin destinatarios para notificación', { minIdForm })
    return 0
  }

  const preferenciasQuery = service
    .from('notificaciones_preferencias')
    .select('profile_id')
    .eq('activo', false)

  const { data: prefData, error: preferenciasError } = minIdForm
    ? await preferenciasQuery.eq('ministerio_id', minIdForm)
    : await preferenciasQuery.is('ministerio_id', null)

  if (preferenciasError) {
    console.warn('[avisos] No se pudieron leer preferencias; se continúa con destinatarios activos:', preferenciasError)
  }

  const disabledIds = new Set((prefData || []).map((p: any) => p.profile_id))
  const finalUserIds = targetUserIds.filter((id) => !disabledIds.has(id))

  if (finalUserIds.length === 0) {
    console.log('[avisos] Todos los destinatarios desactivaron esta categoría')
    return 0
  }

  const enviados = await notifyMultipleUsers(service, finalUserIds, {
    title: titulo,
    body: cuerpo,
    url: minIdForm ? `/ministerios/${minIdForm}/avisos` : '/avisos',
    tag: minIdForm ? `aviso_${minIdForm}` : 'aviso_general',
  })

  console.log('[avisos] Reparto push completado', {
    ministerioId: minIdForm || null,
    destinatarios: finalUserIds.length,
    dispositivos: enviados,
  })

  return enviados
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

  const p = profile as any
  if (p?.rol !== 'administrador' && !p?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos para aprobar avisos.' }
  }

  const { data: aviso } = await (supabase as any)
    .from('publicaciones')
    .select('titulo, cuerpo, ministerio_id')
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
      notificados = await _enviarNotificacionAviso(
        aviso.ministerio_id || '',
        aviso.titulo,
        aviso.cuerpo
      )
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

  const p = profile as any
  if (p?.rol !== 'administrador' && !p?.es_pastor_general) {
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
