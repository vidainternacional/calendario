'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PilotContext } from '@/lib/pilot/types'

const SESSION_KEY = 'vida-pilot-session-id'
const SESSION_STARTED_KEY = 'vida-pilot-session-started'

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY)
  if (!value) {
    value = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, value)
  }
  return value
}

export default function PilotTelemetry({ context }: { context: PilotContext | null }) {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!context?.active) return
    const supabase = createClient()
    const id = sessionId()

    if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
      sessionStorage.setItem(SESSION_STARTED_KEY, '1')
      void (supabase as any).from('pilot_usage_events').insert({
        profile_id: context.profileId,
        event_name: 'session_started',
        route: pathname,
        session_id: id,
        metadata: {
          role: context.role,
          standalone: window.matchMedia('(display-mode: standalone)').matches,
        },
      })
    }
  }, [context, pathname])

  useEffect(() => {
    if (!context?.active || !pathname || lastPath.current === pathname) return
    lastPath.current = pathname
    const supabase = createClient()

    void (supabase as any).from('pilot_usage_events').insert({
      profile_id: context.profileId,
      event_name: 'page_view',
      route: pathname,
      session_id: sessionId(),
      metadata: { role: context.role },
    })
  }, [context, pathname])

  return null
}
