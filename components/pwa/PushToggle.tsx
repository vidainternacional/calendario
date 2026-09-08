'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { guardarSuscripcionPush, eliminarSuscripcionPush } from '@/app/actions/push'

const PREVIEW_PUSH_OPT_IN_KEY = 'vida-preview-push-opt-in'
const SERVICE_WORKER_READY_TIMEOUT_MS = 12000

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      value => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      error => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

async function obtenerRegistroPush() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing?.active) return existing

  const registration = existing ?? await navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  })

  if (registration.active) return registration

  return withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_READY_TIMEOUT_MS,
    'El service worker no quedó listo a tiempo.',
  )
}

function guardarOptInPreview(active: boolean) {
  if (!window.location.hostname.endsWith('.vercel.app')) return
  try {
    if (active) localStorage.setItem(PREVIEW_PUSH_OPT_IN_KEY, 'true')
    else localStorage.removeItem(PREVIEW_PUSH_OPT_IN_KEY)
  } catch {}
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export default function PushToggle() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [loading, setLoading] = useState(false)
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    let cancelled = false
    setPermission(Notification.permission as PermissionState)

    void navigator.serviceWorker.getRegistration()
      .then(registration => registration?.pushManager.getSubscription() ?? null)
      .then(subscription => {
        if (!cancelled) setCurrentEndpoint(subscription?.endpoint ?? null)
      })
      .catch(error => console.error('[push] No se pudo leer la suscripción actual:', error))

    return () => {
      cancelled = true
    }
  }, [])

  const activarNotificaciones = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // El permiso debe pedirse directamente desde el gesto del usuario. Esperar
      // antes a serviceWorker.ready puede perder ese gesto (especialmente en iOS)
      // y, si no hay registro activo, dejar el control cargando indefinidamente.
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission as PermissionState)

      if (nextPermission !== 'granted') return

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('Falta la clave pública VAPID.')

      const registration = await obtenerRegistroPush()
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      const result = await guardarSuscripcionPush(JSON.stringify(subscription.toJSON()))
      if (result?.error) throw new Error(result.error)

      setCurrentEndpoint(subscription.endpoint)
      guardarOptInPreview(true)
    } catch (error) {
      console.error('[push] Subscription error:', error)
      setCurrentEndpoint(null)
      setErrorMessage('No pudimos activar las notificaciones. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  const desactivarNotificaciones = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()

      if (subscription) {
        const result = await eliminarSuscripcionPush(subscription.endpoint)
        if (result?.error) throw new Error(result.error)
        await subscription.unsubscribe()
      }

      setCurrentEndpoint(null)
      setPermission(Notification.permission as PermissionState)
      guardarOptInPreview(false)
    } catch (error) {
      console.error('[push] Unsubscribe error:', error)
      setErrorMessage('No pudimos desactivar las notificaciones. Inténtalo de nuevo.')
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
          {errorMessage && permission !== 'denied' && (
            <p className="mt-0.5 break-words text-xs text-rose-500">{errorMessage}</p>
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
              <Loader2 className="absolute left-1/2 h-3 w-3 -translate-x-1/2 animate-spin text-slate-50" aria-hidden="true" />
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
