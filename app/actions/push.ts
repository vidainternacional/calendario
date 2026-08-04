'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { composePushBody, notifyUser } from '@/lib/webpush'

export async function guardarSuscripcionPush(subscriptionJson: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  let sub: PushSubscriptionJSON
  try {
    sub = JSON.parse(subscriptionJson)
  } catch {
    return { error: 'Suscripción inválida' }
  }

  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: 'Suscripción incompleta' }
  }

  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .upsert(
      {
        profile_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      { onConflict: 'endpoint' },
    )

  if (error) {
    console.error('[push] Error guardando suscripción:', error)
    return { error: 'No se pudo guardar la suscripción' }
  }

  return { success: true }
}

export async function eliminarSuscripcionPush(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await (supabase as any)
    .from('push_subscriptions')
    .delete()
    .eq('profile_id', user.id)
    .eq('endpoint', endpoint)

  return { success: true }
}

export async function enviarNotificacionPrueba(profileId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const targetId = profileId || user.id

  if (targetId !== user.id) {
    const { data: caller } = await (supabase as any)
      .from('profiles')
      .select('rol, es_pastor_general')
      .eq('id', user.id)
      .single()

    if (!['pastor', 'administrador'].includes(caller?.rol) && !caller?.es_pastor_general) {
      return { error: 'No tienes permiso para enviar una prueba a otra persona.' }
    }
  }

  const service = createServiceClient()
  const enviadas = await notifyUser(service, targetId, {
    title: 'Prueba de notificación',
    body: composePushBody('Sistema de avisos', 'Las notificaciones están conectadas correctamente.'),
    url: '/perfil',
    tag: `prueba-${targetId}-${Date.now()}`,
    renotify: true,
  })

  if (enviadas === 0) {
    return {
      error: 'No encontramos un dispositivo activo. Abre VIDA desde el icono de inicio y vuelve a activar las notificaciones.',
      enviadas: 0,
    }
  }

  return { success: true, enviadas }
}
