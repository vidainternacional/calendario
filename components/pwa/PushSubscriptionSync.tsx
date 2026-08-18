'use client'

import { useEffect } from 'react'
import { guardarSuscripcionPush } from '@/app/actions/push'
import { requestUnreadPublicationsRefresh } from '@/components/avisos/usePublicationReads'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

const PUSH_REFRESH_COALESCE_MS = 180

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

type VidaPushMessage = {
  type?: string
  tag?: string
  url?: string
}

export default function PushSubscriptionSync() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let pushRefreshTimer: number | null = null

    const schedulePushRefresh = () => {
      if (pushRefreshTimer !== null) window.clearTimeout(pushRefreshTimer)
      pushRefreshTimer = window.setTimeout(() => {
        pushRefreshTimer = null
        // Un push puede representar un aviso o cualquier acción dirigida al usuario.
        // Refrescamos ambos almacenes compartidos para que badges, "Para ti" y Avisos
        // no tengan que esperar al polling, a un cambio de pestaña o a volver del fondo.
        requestPendingIndicatorsRefresh()
        requestUnreadPublicationsRefresh()
      }, PUSH_REFRESH_COALESCE_MS)
    }

    const handleServiceWorkerMessage = (event: MessageEvent<VidaPushMessage>) => {
      if (event.data?.type === 'VIDA_PUSH_RECEIVED') schedulePushRefresh()
    }

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    if (
      !('Notification' in window) ||
      !('PushManager' in window) ||
      Notification.permission !== 'granted'
    ) {
      return () => {
        if (pushRefreshTimer !== null) window.clearTimeout(pushRefreshTimer)
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
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

    const handleOnline = () => void sincronizar()

    window.addEventListener('online', handleOnline)
    void sincronizar()
    return () => {
      cancelled = true
      if (pushRefreshTimer !== null) window.clearTimeout(pushRefreshTimer)
      window.removeEventListener('online', handleOnline)
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [])

  return null
}
