import webpush from 'web-push'

// Configure VAPID keys once at module level
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

/**
 * Sends a push notification to a single subscription endpoint.
 * Returns true on success, false on invalid subscription (should be cleaned up).
 */
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
    // 410 Gone = subscription expired/unsubscribed, clean it up
    const expired = err?.statusCode === 410 || err?.statusCode === 404
    console.error('[webpush] ERROR sending notification:')
    console.error(`- Status Code: ${err?.statusCode}`)
    console.error(`- Error Body: ${err?.body}`)
    console.error(`- Error Message: ${err?.message}`)
    console.error(`- Endpoint: ${sub.endpoint.substring(0, 50)}...`)
    return { success: false, expired }
  }
}

/**
 * Sends a push notification to all subscriptions of a given profile.
 * Removes expired subscriptions automatically.
 */
export async function notifyUser(
  supabase: any,
  profileId: string,
  payload: PushPayload
): Promise<void> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId)

  console.log(`[webpush] notifyUser: found ${subs?.length || 0} subscriptions for user ${profileId}`)

  if (!subs?.length) return

  const expiredIds: string[] = []

  await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.expired) expiredIds.push(sub.id)
    })
  )

  // Clean up expired/unsubscribed endpoints
  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }
}

/**
 * Sends a push notification to multiple subscriptions in parallel.
 */
export async function notifyMultipleUsers(
  supabase: any,
  profileIds: string[],
  payload: PushPayload
): Promise<void> {
  if (!profileIds.length) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('profile_id', profileIds)

  if (!subs?.length) return

  const expiredIds: string[] = []

  await Promise.all(
    subs.map(async (sub: any) => {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
      if (result.expired) expiredIds.push(sub.id)
    })
  )

  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }
}
