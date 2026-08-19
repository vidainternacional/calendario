'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { composePushBody, notifyUsersOnceByReference } from '@/lib/webpush'

async function notificarGestoresSolicitudIngreso(ministerioId: string, solicitudId: string, requesterId: string) {
  const service = createServiceClient() as any
  const [
    { data: lideres, error: lideresError },
    { data: gestoresGlobales, error: gestoresError },
    { data: ministerio },
    { data: preferencias },
  ] = await Promise.all([
    service.from('ministerio_miembros').select('profile_id').eq('ministerio_id', ministerioId).eq('es_lider', true),
    service
      .from('profiles')
      .select('id,rol,activo,estado_cuenta')
      .eq('activo', true)
      .eq('estado_cuenta', 'activo'),
    service.from('ministerios').select('nombre').eq('id', ministerioId).single(),
    service.from('notificaciones_preferencias').select('profile_id').eq('ministerio_id', ministerioId).eq('activo', false),
  ])

  if (lideresError) throw lideresError
  if (gestoresError) throw gestoresError

  const disabledIds = new Set<string>((preferencias || []).map((item: any) => String(item.profile_id)))
  const liderIds = (lideres || []).map((item: any) => String(item.profile_id || ''))
  const gestorIds = (gestoresGlobales || [])
    .filter((item: any) => item.rol === 'administrador')
    .map((item: any) => String(item.id || ''))

  const destinatarios: string[] = Array.from(new Set<string>([...liderIds, ...gestorIds]))
    .filter((profileId: string) => profileId && profileId !== requesterId && !disabledIds.has(profileId))

  if (!destinatarios.length) return

  await notifyUsersOnceByReference(destinatarios, {
    title: (ministerio as any)?.nombre || 'Ministerio',
    body: composePushBody('Nueva solicitud de ingreso', 'Hay una solicitud pendiente de revisión.'),
    url: `/ministerios/${ministerioId}/solicitudes-ingreso?origen=push`,
    tag: `solicitud-ingreso-${solicitudId}`,
    renotify: true,
  }, { tipo: 'solicitud_ingreso', referenciaId: solicitudId })
}

async function notificarResultadoSolicitudIngreso(
  ministerioId: string,
  solicitudId: string,
  profileId: string,
  estado: 'aprobada' | 'rechazada',
) {
  const service = createServiceClient() as any
  const { data: ministerio } = await service.from('ministerios').select('nombre').eq('id', ministerioId).maybeSingle()
  const nombreMinisterio = String((ministerio as any)?.nombre || 'el ministerio')
  const fueAprobada = estado === 'aprobada'

  await notifyUsersOnceByReference([profileId], {
    title: 'VIDA Internacional',
    body: fueAprobada
      ? `¡Bienvenido a ${nombreMinisterio}! Tu solicitud fue aprobada. Ya puedes usar el dashboard del ministerio.`
      : `Tu solicitud de ingreso a ${nombreMinisterio} fue rechazada.`,
    url: fueAprobada
      ? `/ministerios/${ministerioId}?bienvenida=1&origen=push`
      : `/ministerios/${ministerioId}?origen=push`,
    tag: `solicitud-ingreso-resultado-${solicitudId}`,
    renotify: true,
  }, { tipo: 'solicitud_ingreso_resultado', referenciaId: solicitudId })
}

async function obtenerContextoGestionIngreso(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, service: null, error: 'No autorizado' }

  const [{ data: profile }, { data: membresia }] = await Promise.all([
    supabase.from('profiles').select('rol').eq('id', user.id).single(),
    supabase
      .from('ministerio_miembros')
      .select('es_lider')
      .eq('profile_id', user.id)
      .eq('ministerio_id', ministerioId)
      .maybeSingle(),
  ])

  const esAdministrador = (profile as any)?.rol === 'administrador'
  const esLiderMinisterio = (membresia as any)?.es_lider === true
  if (!esAdministrador && !esLiderMinisterio) {
    return { user, service: null, error: 'Solo un administrador o líder de este ministerio puede resolver solicitudes.' }
  }

  return { user, service: createServiceClient() as any, error: null }
}

export async function solicitarIngreso(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: solicitud, error } = await (supabase as any).from('ministerio_solicitudes_ingreso').insert({
    profile_id: user.id,
    ministerio_id: ministerioId,
    estado: 'pendiente'
  }).select('id').single()

  if (error || !solicitud) {
    console.error('Error al solicitar ingreso:', error)
    if (error?.code === '23505') return { success: false, error: 'Ya tienes una solicitud pendiente para este ministerio.' }
    return { success: false, error: 'Error al enviar solicitud.' }
  }

  try {
    await notificarGestoresSolicitudIngreso(ministerioId, String(solicitud.id), user.id)
  } catch (pushError) {
    console.error('[ministerios] Solicitud creada, pero falló la notificación a gestores:', pushError)
  }

  revalidatePath('/ministerios')
  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/admin/solicitudes-ministerios')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}

export async function aprobarSolicitudIngreso(solicitudId: string, profileId: string, ministerioId: string) {
  const contexto = await obtenerContextoGestionIngreso(ministerioId)
  if (contexto.error || !contexto.user || !contexto.service) {
    return { success: false, error: contexto.error || 'No autorizado' }
  }

  const service = contexto.service
  const { data: solicitud, error: lookupError } = await service
    .from('ministerio_solicitudes_ingreso')
    .select('profile_id,estado')
    .eq('id', solicitudId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()

  if (lookupError || !solicitud) return { success: false, error: lookupError?.message || 'Solicitud no encontrada.' }
  if (String(solicitud.profile_id) !== profileId) return { success: false, error: 'La solicitud no corresponde a ese usuario.' }
  if (solicitud.estado !== 'pendiente') return { success: false, error: 'La solicitud ya fue resuelta.' }

  const { error: e1 } = await service
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'aprobada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')
  if (e1) return { success: false, error: e1.message }

  const { error: e2 } = await service.from('ministerio_miembros').upsert({
    profile_id: profileId,
    ministerio_id: ministerioId,
    es_lider: false,
  }, { onConflict: 'profile_id,ministerio_id', ignoreDuplicates: true })
  if (e2) return { success: false, error: e2.message }

  try {
    await notificarResultadoSolicitudIngreso(ministerioId, solicitudId, profileId, 'aprobada')
  } catch (pushError) {
    console.error('[ministerios] Solicitud aprobada, pero falló la notificación al solicitante:', pushError)
  }

  revalidatePath('/ministerios')
  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/admin/solicitudes-ministerios')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}

export async function rechazarSolicitudIngreso(solicitudId: string, ministerioId: string) {
  const contexto = await obtenerContextoGestionIngreso(ministerioId)
  if (contexto.error || !contexto.user || !contexto.service) {
    return { success: false, error: contexto.error || 'No autorizado' }
  }

  const service = contexto.service
  const { data: solicitud, error: solicitudError } = await service
    .from('ministerio_solicitudes_ingreso')
    .select('profile_id,estado')
    .eq('id', solicitudId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()
  if (solicitudError || !solicitud?.profile_id) {
    return { success: false, error: solicitudError?.message || 'Solicitud no encontrada.' }
  }
  if (solicitud.estado !== 'pendiente') return { success: false, error: 'La solicitud ya fue resuelta.' }

  const { error } = await service
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'rechazada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')
  if (error) return { success: false, error: error.message }

  try {
    await notificarResultadoSolicitudIngreso(ministerioId, solicitudId, String(solicitud.profile_id), 'rechazada')
  } catch (pushError) {
    console.error('[ministerios] Solicitud rechazada, pero falló la notificación al solicitante:', pushError)
  }

  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/admin/solicitudes-ministerios')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}
