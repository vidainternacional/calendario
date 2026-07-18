'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/webpush'
import { revalidatePath } from 'next/cache'

/**
 * Saves or updates a push subscription for the current user.
 * Called from the client after Notification.requestPermission() + pushManager.subscribe().
 */
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
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('[push] Error saving subscription:', error)
    return { error: 'No se pudo guardar la suscripción' }
  }

  return { success: true }
}

/**
 * Removes the current push subscription (e.g. when user revokes permission).
 */
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

/**
 * TEST ACTION: Sends a test push notification to the current user.
 * Only accessible to pastors/admins.
 */
export async function enviarNotificacionPrueba(profileId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify the caller is pastor/admin
  const { data: caller } = await (supabase as any)
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const targetId = profileId || user.id

  await notifyUser(supabase, targetId, {
    title: '🔔 Centro Cristiano Vida',
    body: '¡Las notificaciones push están funcionando correctamente!',
    url: '/inicio',
    tag: 'test',
  })

  return { success: true }
}
