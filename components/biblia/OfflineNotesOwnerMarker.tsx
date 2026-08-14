'use client'

import { useLayoutEffect } from 'react'

export const VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY = 'vida-biblia-notas-active-owner-v1'
export const VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE = 'VIDA_NOTES_OWNER_SET'
export const VIDA_BIBLE_NOTES_OWNER_CLEAR_MESSAGE = 'VIDA_NOTES_OWNER_CLEAR'

export default function OfflineNotesOwnerMarker({ userId }: { userId: string }) {
  useLayoutEffect(() => {
    try {
      localStorage.setItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY, userId)
    } catch {}

    if (!('serviceWorker' in navigator)) return

    const enviarMarcador = () => {
      const mensaje = { type: VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE, userId }
      navigator.serviceWorker.controller?.postMessage(mensaje)
      void navigator.serviceWorker.ready
        .then((registration) => registration.active?.postMessage(mensaje))
        .catch(() => undefined)
    }

    enviarMarcador()
    navigator.serviceWorker.addEventListener('controllerchange', enviarMarcador)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', enviarMarcador)
  }, [userId])

  return null
}
