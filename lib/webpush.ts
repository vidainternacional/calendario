import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  renotify?: boolean
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export function composePushBody(subject: string, message: string, maxLength = 300) {
  const cleanSubject = subject.trim()
  const cleanMessage = message.trim().slice(0, maxLength)
  return cleanSubject ? `${cleanSubject}\n${cleanMessage}` : cleanMessage
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; expired: boolean; statusCode?: number }> {
  const sub: webpush.PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192.png',
    badge: payload.badge ?? '/icons/icon-maskable-192.png',
    url: payload.url ?? '/inicio',
    tag: payload.tag ?? `vida-${Date.now()}`,
    renotify: payload.renotify ?? true,
  })

  try {
    const response = await webpush.sendNotification(sub, body, {
      TTL: 24 * 60 * 60,
      urgency: 'high',
    })
    console.log('[webpush] Entrega aceptada', {
      statusCode: response.statusCode,
      endpoint: sub.endpoint.substring(0, 50),
    })
    return { success: true, expired: false, statusCode: response.statusCode }
  } catch (err: any) {
    const expired = err?.statusCode === 410 || err?.statusCode === 404
    console.error('[webpush] Error de entrega', {
      statusCode: err?.statusCode,
      body: err?.body,
      message: err?.message,
      endpoint: sub.endpoint.substring(0, 50),
    })
    return { success: false, expired, statusCode: err?.statusCode }
  }
}

export async function notifyUser(
  supabase: any,
  profileId: string,
  payload: PushPayload
): Promise<number> {
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId)

  if (error) {
    console.error('[webpush] Error leyendo suscripciones del usuario:', error)
    return 0
  }

  if (!subs?.length) return 0

  const expiredIds: string[] = []
  const results = await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.expired) expiredIds.push(sub.id)
      return result.success ? 1 : 0
    })
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return results.reduce((total, value) => total + value, 0)
}

export async function notifyMultipleUsers(
  supabase: any,
  profileIds: string[],
  payload: PushPayload
): Promise<number> {
  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))]
  if (!uniqueProfileIds.length) return 0

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('profile_id', uniqueProfileIds)

  if (error) {
    console.error('[webpush] Error leyendo suscripciones:', error)
    return 0
  }

  if (!subs?.length) return 0

  const expiredIds: string[] = []
  const results = await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.expired) expiredIds.push(sub.id)
      return result.success ? 1 : 0
    })
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return results.reduce((total, value) => total + value, 0)
}
