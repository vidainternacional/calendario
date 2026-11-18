'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { PUSH_REMINDER_SNOOZE_MS, PUSH_SUBSCRIPTION_CHANGED, pushReminderKind, pushReminderStorageKey, type PushReminderKind } from '@/lib/pwa/push-reminder'

/** Recordatorio local; no solicita permisos ni envía notificaciones por su cuenta. */
export default function PushReminder({ userId }: { userId: string }) {
  const [kind, setKind] = useState<PushReminderKind>(null)
  const storageKey = pushReminderStorageKey(userId)

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const inspect = async () => {
      const current = ++revision
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      let dismissedUntil = 0
      try { dismissedUntil = Number(localStorage.getItem(storageKey)) || 0 } catch { /* El recordatorio funciona sin persistencia. */ }
      try {
        const registration = supported ? await navigator.serviceWorker.getRegistration() : undefined
        const subscription = await registration?.pushManager.getSubscription()
        if (!cancelled && current === revision) setKind(pushReminderKind({ supported, ios, standalone,
          permission: 'Notification' in window ? Notification.permission : 'unsupported',
          subscribed: Boolean(subscription), dismissedUntil, now: Date.now() }))
      } catch {
        // Un error de consulta no permite afirmar que las notificaciones estén desactivadas.
        if (!cancelled && current === revision) setKind(null)
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void inspect() }
    void inspect()
    window.addEventListener('focus', onVisible)
    window.addEventListener(PUSH_SUBSCRIPTION_CHANGED, onVisible)
    window.addEventListener('storage', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onVisible)
      window.removeEventListener(PUSH_SUBSCRIPTION_CHANGED, onVisible)
      window.removeEventListener('storage', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [storageKey])

  if (!kind) return null

  const text = kind === 'install'
    ? 'Para recibir avisos en iPhone, agrega VIDA a la pantalla de inicio y ábrela desde allí.'
    : kind === 'blocked'
      ? 'Tu navegador tiene bloqueadas las notificaciones de VIDA. Puedes habilitarlas en sus ajustes.'
      : 'Activa las notificaciones de VIDA para enterarte de avisos y actividades.'

  return <aside aria-label="Recordatorio de notificaciones" className="mb-5 flex items-start gap-3 border-y border-slate-200 py-4">
    <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#C0392B]" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-sm leading-6 text-slate-700"><span className="mr-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-[#C0392B]">Pendiente</span>{text}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-5">
        <Link href="/perfil#notificaciones" className="inline-flex min-h-11 items-center text-sm font-bold text-[#C0392B]">{kind === 'install' ? 'Ver ajustes' : kind === 'blocked' ? 'Revisar notificaciones' : 'Activar notificaciones'}</Link>
        <button type="button" className="min-h-11 text-sm font-semibold text-slate-500" onClick={() => {
          try { localStorage.setItem(storageKey, String(Date.now() + PUSH_REMINDER_SNOOZE_MS)) } catch { /* Se oculta durante esta visita. */ }
          setKind(null)
        }}>Recordarme en una semana</button>
      </div>
    </div>
  </aside>
}
