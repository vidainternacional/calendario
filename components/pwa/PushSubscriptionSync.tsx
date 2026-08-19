'use client'

import { useEffect, useState } from 'react'
import { guardarSuscripcionPush } from '@/app/actions/push'
import { requestUnreadPublicationsRefresh } from '@/components/avisos/usePublicationReads'
import {
  VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY,
  VIDA_BIBLE_NOTES_OWNER_CLEAR_MESSAGE,
  VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE,
} from '@/components/biblia/OfflineNotesOwnerMarker'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'
import { createClient } from '@/lib/supabase/client'

const PUSH_REFRESH_COALESCE_MS = 180
const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OFFLINE_CACHE_ROUTE_MESSAGE = 'VIDA_OFFLINE_CACHE_ROUTE'

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

type VidaServiceWorkerMessage = {
  type: string
  userId?: string
  path?: string
}

function enviarMensajeServiceWorker(message: VidaServiceWorkerMessage) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.controller?.postMessage(message)
  void navigator.serviceWorker.ready
    .then((registration) => registration.active?.postMessage(message))
    .catch(() => undefined)
}

function enlaceInternoDesdeClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
  if (!target || target.target === '_blank' || target.hasAttribute('download')) return null

  const href = target.getAttribute('href') || ''
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null

  try {
    const url = new URL(href, window.location.href)
    return url.origin === window.location.origin ? url : null
  } catch {
    return null
  }
}

export default function PushSubscriptionSync() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const supabase = createClient()
    let cancelled = false

    const marcarUsuario = (userId: string) => {
      if (!OWNER_UUID_RE.test(userId)) return
      try { localStorage.setItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY, userId) } catch {}
      enviarMensajeServiceWorker({ type: VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE, userId })
    }

    const limpiarUsuario = () => {
      let previous = ''
      try {
        previous = localStorage.getItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY) || ''
        localStorage.removeItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY)
      } catch {}
      enviarMensajeServiceWorker({
        type: VIDA_BIBLE_NOTES_OWNER_CLEAR_MESSAGE,
        userId: OWNER_UUID_RE.test(previous) ? previous : undefined,
      })
    }

    const sincronizarUsuario = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session?.user?.id) marcarUsuario(session.user.id)
      } catch {}
    }

    void sincronizarUsuario()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        limpiarUsuario()
        return
      }
      if (session?.user?.id) marcarUsuario(session.user.id)
    })

    const handleOnline = () => void sincronizarUsuario()
    const handleControllerChange = () => void sincronizarUsuario()
    window.addEventListener('online', handleOnline)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  useEffect(() => {
    const actualizarEstado = () => setOffline(!navigator.onLine)
    actualizarEstado()

    const handleClick = (event: MouseEvent) => {
      const url = enlaceInternoDesdeClick(event)
      if (!url) return

      if (navigator.onLine) {
        enviarMensajeServiceWorker({
          type: OFFLINE_CACHE_ROUTE_MESSAGE,
          path: `${url.pathname}${url.search}`,
        })
        return
      }

      // Next.js usa peticiones RSC para navegación cliente. Sin red esas
      // peticiones no pueden reconstruir una ruta que no esté viva en memoria.
      // Forzamos navegación de documento para que el service worker entregue la
      // copia privada cacheada o, si nunca se abrió, el fallback offline legible.
      event.preventDefault()
      window.location.assign(url.href)
    }

    window.addEventListener('online', actualizarEstado)
    window.addEventListener('offline', actualizarEstado)
    document.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('online', actualizarEstado)
      window.removeEventListener('offline', actualizarEstado)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

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

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[115] -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-[0_6px_20px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    >
      Sin conexión · usando datos guardados
    </div>
  )
}
