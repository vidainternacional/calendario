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
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; expired: boolean }> {
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
    tag: payload.tag ?? 'default',
  })

  try {
    console.log(`[webpush] Sending notification to: ${sub.endpoint.substring(0, 50)}...`)
    const response = await webpush.sendNotification(sub, body)
    console.log(`[webpush] SUCCESS. Status code: ${response.statusCode}`)
    return { success: true, expired: false }
  } catch (err: any) {
    const expired = err?.statusCode === 410 || err?.statusCode === 404
    console.error('[webpush] ERROR sending notification:')
    console.error(`- Status Code: ${err?.statusCode}`)
    console.error(`- Error Body: ${err?.body}`)
    console.error(`- Error Message: ${err?.message}`)
    console.error(`- Endpoint: ${sub.endpoint.substring(0, 50)}...`)
    return { success: false, expired }
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
    console.error('[webpush] Error reading user subscriptions:', error)
    return 0
  }

  console.log(`[webpush] notifyUser: found ${subs?.length || 0} subscriptions for user ${profileId}`)
  if (!subs?.length) return 0

  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.success) sent += 1
      if (result.expired) expiredIds.push(sub.id)
    })
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return sent
}

export async function notifyMultipleUsers(
  supabase: any,
  profileIds: string[],
  payload: PushPayload
): Promise<number> {
  if (!profileIds.length) return 0

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('profile_id', profileIds)

  if (error) {
    console.error('[webpush] Error reading subscriptions:', error)
    return 0
  }

  console.log(`[webpush] notifyMultipleUsers: found ${subs?.length || 0} subscriptions for ${profileIds.length} users`)
  if (!subs?.length) return 0

  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.success) sent += 1
      if (result.expired) expiredIds.push(sub.id)
    })
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return sent
}
