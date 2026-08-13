'use client'

import { useEffect } from 'react'
import { guardarSuscripcionPush } from '@/app/actions/push'
import { requestUnreadPublicationsRefresh } from '@/components/avisos/usePublicationReads'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }

  return output.buffer
}

export default function PushSubscriptionSync() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleServiceWorkerMessage = (event: MessageEvent<{ type?: string; url?: string }>) => {
      if (event.data?.type === 'VIDA_PUSH_RECEIVED') {
        requestPendingIndicatorsRefresh()
        if (event.data.url?.startsWith('/avisos')) {
          requestUnreadPublicationsRefresh()
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    if (
      !('Notification' in window) ||
      !('PushManager' in window) ||
      Notification.permission !== 'granted'
    ) {
      return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
    }

    let cancelled = false

    async function sincronizar() {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.update().catch(() => undefined)

        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!vapidKey) return

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
        }

        if (!cancelled && subscription) {
          const result = await guardarSuscripcionPush(JSON.stringify(subscription.toJSON()))
          if (result?.error) console.error('[push-sync]', result.error)
        }
      } catch (error) {
        console.error('[push-sync] No se pudo reparar la suscripción:', error)
      }
    }

    void sincronizar()
    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [])

  return null
}
