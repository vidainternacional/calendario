'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { PilotContext } from '@/lib/pilot/types'

const SESSION_KEY = 'vida-pilot-session-id'
const SESSION_STARTED_KEY = 'vida-pilot-session-started-v2'

function sessionId() {
  try {
    let value = sessionStorage.getItem(SESSION_KEY)
    if (!value) {
      value = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, value)
    }
    return value
  } catch {
    return crypto.randomUUID()
  }
}

async function sendTelemetry(eventName: 'session_started' | 'page_view', route: string | null) {
  try {
    const response = await fetch('/api/pilot/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        eventName,
        route,
        sessionId: sessionId(),
        standalone: window.matchMedia('(display-mode: standalone)').matches,
      }),
    })

    if (!response.ok && process.env.NODE_ENV !== 'production') {
      console.warn('No se pudo registrar telemetría del piloto', response.status)
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Error enviando telemetría del piloto', error)
    }
  }
}

export default function PilotTelemetry({ context }: { context: PilotContext | null }) {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!context?.active) return

    let started = false
    try {
      started = sessionStorage.getItem(SESSION_STARTED_KEY) === '1'
      if (!started) sessionStorage.setItem(SESSION_STARTED_KEY, '1')
    } catch {
      started = false
    }

    if (!started) void sendTelemetry('session_started', pathname || null)
  }, [context, pathname])

  useEffect(() => {
    if (!context?.active || !pathname || lastPath.current === pathname) return
    lastPath.current = pathname
    void sendTelemetry('page_view', pathname)
  }, [context, pathname])

  return null
}
