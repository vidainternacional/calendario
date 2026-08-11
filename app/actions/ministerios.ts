'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { composePushBody, notifyUsersOnceByReference } from '@/lib/webpush'

async function notificarLideresSolicitudIngreso(ministerioId: string, solicitudId: string, requesterId: string) {
  const service = createServiceClient() as any
  const [{ data: lideres, error: lideresError }, { data: ministerio }, { data: preferencias }] = await Promise.all([
    service
      .from('ministerio_miembros')
      .select('profile_id')
      .eq('ministerio_id', ministerioId)
      .eq('es_lider', true),
    service
      .from('ministerios')
      .select('nombre')
      .eq('id', ministerioId)
      .single(),
    service
      .from('notificaciones_preferencias')
      .select('profile_id')
      .eq('ministerio_id', ministerioId)
      .eq('activo', false),
  ])

  if (lideresError) throw lideresError

  const disabledIds = new Set<string>((preferencias || []).map((item: any) => String(item.profile_id)))
  const destinatarios: string[] = Array.from(
    new Set<string>(
      (lideres || [])
        .map((item: any) => String(item.profile_id || ''))
        .filter((profileId: string) => profileId && profileId !== requesterId && !disabledIds.has(profileId)),
    ),
  )

  if (!destinatarios.length) return

  await notifyUsersOnceByReference(
    destinatarios,
    {
      title: (ministerio as any)?.nombre || 'Ministerio',
      body: composePushBody('Nueva solicitud de ingreso', 'Hay una solicitud pendiente de revisión.'),
      url: `/ministerios/${ministerioId}/solicitudes-ingreso`,
      tag: `solicitud-ingreso-${solicitudId}`,
      renotify: true,
    },
    { tipo: 'solicitud_ingreso', referenciaId: solicitudId },
  )
}

async function notificarResultadoSolicitudIngreso(
  ministerioId: string,
  solicitudId: string,
  profileId: string,
  estado: 'aprobada' | 'rechazada',
) {
  const service = createServiceClient() as any
  const { data: ministerio } = await service
    .from('ministerios')
    .select('nombre')
    .eq('id', ministerioId)
    .maybeSingle()

  const nombreMinisterio = String((ministerio as any)?.nombre || 'el ministerio')
  const fueAprobada = estado === 'aprobada'

  await notifyUsersOnceByReference(
    [profileId],
    {
      title: 'VIDA Internacional',
      body: fueAprobada
        ? `Tu solicitud de ingreso a ${nombreMinisterio} fue aprobada.`
        : `Tu solicitud de ingreso a ${nombreMinisterio} fue rechazada.`,
      url: `/ministerios/${ministerioId}`,
      tag: `solicitud-ingreso-resultado-${solicitudId}`,
      renotify: true,
    },
    { tipo: 'solicitud_ingreso_resultado', referenciaId: solicitudId },
  )
}

export async function solicitarIngreso(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: solicitud, error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .insert({
      profile_id: user.id,
      ministerio_id: ministerioId,
      estado: 'pendiente'
    })
    .select('id')
    .single()

  if (error || !solicitud) {
    console.error('Error al solicitar ingreso:', error)
    if (error?.code === '23505') {
      return { success: false, error: 'Ya tienes una solicitud pendiente para este ministerio.' }
    }
    return { success: false, error: 'Error al enviar solicitud.' }
  }

  try {
    await notificarLideresSolicitudIngreso(ministerioId, String(solicitud.id), user.id)
  } catch (pushError) {
    console.error('[ministerios] Solicitud creada, pero falló la notificación a líderes:', pushError)
  }

  revalidatePath('/ministerios')
  revalidatePath('/inicio')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}

export async function aprobarSolicitudIngreso(solicitudId: string, profileId: string, ministerioId: string) {
  const supabase = await createClient()
  const { error: e1 } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'aprobada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)
  
  if (e1) return { success: false, error: e1.message }

  const { error: e2 } = await (supabase as any)
    .from('ministerio_miembros')
    .insert({
      profile_id: profileId,
      ministerio_id: ministerioId,
      es_lider: false
    })
  
  if (e2 && e2.code !== '23505') {
    return { success: false, error: e2.message }
  }

  try {
    await notificarResultadoSolicitudIngreso(ministerioId, solicitudId, profileId, 'aprobada')
  } catch (pushError) {
    console.error('[ministerios] Solicitud aprobada, pero falló la notificación al solicitante:', pushError)
  }

  revalidatePath('/ministerios')
  revalidatePath('/inicio')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}

export async function rechazarSolicitudIngreso(solicitudId: string, ministerioId: string) {
  const supabase = await createClient()
  const { data: solicitud, error: solicitudError } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('profile_id')
    .eq('id', solicitudId)
    .single()

  if (solicitudError || !solicitud?.profile_id) {
    return { success: false, error: solicitudError?.message || 'Solicitud no encontrada.' }
  }

  const { error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'rechazada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)

  if (error) return { success: false, error: error.message }

  try {
    await notificarResultadoSolicitudIngreso(ministerioId, solicitudId, String(solicitud.profile_id), 'rechazada')
  } catch (pushError) {
    console.error('[ministerios] Solicitud rechazada, pero falló la notificación al solicitante:', pushError)
  }

  revalidatePath('/inicio')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}
