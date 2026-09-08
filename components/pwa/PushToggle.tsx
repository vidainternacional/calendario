'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { guardarSuscripcionPush, eliminarSuscripcionPush } from '@/app/actions/push'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return buffer
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export default function PushToggle() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [loading, setLoading] = useState(false)
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PermissionState)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setCurrentEndpoint(sub.endpoint)
      })
    })
  }, [])

  const activarNotificaciones = useCallback(async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setPermission('denied')
        setLoading(false)
        return
      }

      setPermission('granted')

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      setCurrentEndpoint(sub.endpoint)
      const result = await guardarSuscripcionPush(JSON.stringify(sub.toJSON()))
      if (result?.error) console.error('[push] Save error:', result.error)
    } catch (err) {
      console.error('[push] Subscription error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const desactivarNotificaciones = useCallback(async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await eliminarSuscripcionPush(sub.endpoint)
        await sub.unsubscribe()
        setCurrentEndpoint(null)
        setPermission('default')
      }
    } catch (err) {
      console.error('[push] Unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  if (permission === 'unsupported') {
    return (
      <div className="flex min-w-0 items-start gap-2 text-sm text-gray-400">
        <BellOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">Tu navegador no soporta notificaciones</span>
      </div>
    )
  }

  const isActive = permission === 'granted' && !!currentEndpoint

  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {isActive
          ? <Bell className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" />
          : <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        }
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-[#171923]">
            {isActive ? 'Notificaciones activas' : 'Notificaciones desactivadas'}
          </p>
          {permission === 'denied' && (
            <p className="mt-0.5 break-words text-xs text-rose-500">
              Permiso bloqueado en el navegador. Ve a Configuración para habilitarlo.
            </p>
          )}
        </div>
      </div>

      {permission !== 'denied' && (
        <button
          id="push-toggle-btn"
          type="button"
          onClick={isActive ? desactivarNotificaciones : activarNotificaciones}
          disabled={loading}
          className="inline-flex min-h-11 min-w-12 shrink-0 items-center justify-center rounded-xl transition-colors focus:outline-none disabled:opacity-50"
          aria-label={isActive ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
          aria-pressed={isActive}
        >
          <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? 'bg-indigo-500' : 'bg-slate-200'
          }`}>
            {loading ? (
              <Loader2 className="absolute left-1/2 h-3 w-3 -translate-x-1/2 animate-spin text-white" aria-hidden="true" />
            ) : (
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            )}
          </span>
        </button>
      )}
    </div>
  )
}
