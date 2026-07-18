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
    // Check if push is supported
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PermissionState)

    // Check if there's an existing subscription
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
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <BellOff className="w-4 h-4" />
        <span>Tu navegador no soporta notificaciones</span>
      </div>
    )
  }

  const isActive = permission === 'granted' && !!currentEndpoint

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isActive
          ? <Bell className="w-4 h-4 text-indigo-500" />
          : <BellOff className="w-4 h-4 text-gray-400" />
        }
        <div>
          <p className="text-sm font-medium text-[#171923]">
            {isActive ? 'Notificaciones activas' : 'Notificaciones desactivadas'}
          </p>
          {permission === 'denied' && (
            <p className="text-xs text-rose-500 mt-0.5">
              Permiso bloqueado en el navegador. Ve a Configuración para habilitarlo.
            </p>
          )}
        </div>
      </div>

      {permission !== 'denied' && (
        <button
          id="push-toggle-btn"
          onClick={isActive ? desactivarNotificaciones : activarNotificaciones}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            isActive ? 'bg-indigo-500' : 'bg-slate-200'
          }`}
          aria-label={isActive ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 text-white absolute left-1/2 -translate-x-1/2 animate-spin" />
          ) : (
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          )}
        </button>
      )}
    </div>
  )
}
