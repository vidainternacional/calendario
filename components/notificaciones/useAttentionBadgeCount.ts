'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

type BadgeCounts = {
  unreadAvisos: number
  pendingMinisterioIngresos: number
  pendingServicios: number
  pendingSolicitudesGestionables: number
  pendingContactos: number
  pendingPreguntasPastorales: number
  pendingAyudaSolidaria: number
}

type BadgeKey = keyof BadgeCounts

const EMPTY_COUNTS: BadgeCounts = {
  unreadAvisos: 0,
  pendingMinisterioIngresos: 0,
  pendingServicios: 0,
  pendingSolicitudesGestionables: 0,
  pendingContactos: 0,
  pendingPreguntasPastorales: 0,
  pendingAyudaSolidaria: 0,
}

const STORAGE_PREFIX = 'vida-attention-badges:v1:'
const KEYS = Object.keys(EMPTY_COUNTS) as BadgeKey[]

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function readSeen(userId: string): BadgeCounts {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { ...EMPTY_COUNTS }
    const parsed = JSON.parse(raw) as Partial<BadgeCounts>
    return KEYS.reduce((acc, key) => {
      acc[key] = Math.max(0, Number(parsed[key] || 0))
      return acc
    }, { ...EMPTY_COUNTS })
  } catch {
    return { ...EMPTY_COUNTS }
  }
}

function writeSeen(userId: string, value: BadgeCounts) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(value))
  } catch {}
}

function destinationFor(pathname: string): BadgeKey | null {
  if (pathname === '/avisos' || pathname.startsWith('/avisos/')) return 'unreadAvisos'
  if (pathname === '/contactos' || pathname.startsWith('/contactos/')) return 'pendingContactos'
  if (pathname === '/solicitudes' || pathname.startsWith('/solicitudes/')) return 'pendingSolicitudesGestionables'
  if (pathname === '/pastoral/preguntas' || pathname.startsWith('/pastoral/preguntas/')) return 'pendingPreguntasPastorales'
  if (
    pathname === '/ayuda-solidaria'
    || pathname.startsWith('/ayuda-solidaria/')
    || pathname === '/pastoral/ayuda-solidaria'
    || pathname.startsWith('/pastoral/ayuda-solidaria/')
  ) return 'pendingAyudaSolidaria'
  if (
    pathname === '/admin/solicitudes-ministerios'
    || pathname.startsWith('/admin/solicitudes-ministerios/')
    || pathname === '/ministerios'
    || pathname.startsWith('/ministerios/')
  ) return 'pendingMinisterioIngresos'
  if (pathname.startsWith('/eventos/')) return 'pendingServicios'
  return null
}

function sameCounts(a: BadgeCounts, b: BadgeCounts) {
  return KEYS.every((key) => a[key] === b[key])
}

function applyBadge(total: number) {
  if (typeof navigator === 'undefined') return
  const badgeNavigator = navigator as Navigator & {
    setAppBadge?: (value?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  if (total > 0 && badgeNavigator.setAppBadge) {
    void badgeNavigator.setAppBadge(total).catch(() => undefined)
  } else if (total === 0 && badgeNavigator.clearAppBadge) {
    void badgeNavigator.clearAppBadge().catch(() => undefined)
  }
}

export function useAttentionBadgeCount() {
  const pathname = usePathname()
  const {
    unreadAvisos,
    pendingMinisterioIngresos,
    pendingServicios,
    pendingSolicitudesGestionables,
    pendingContactos,
    pendingPreguntasPastorales,
    pendingAyudaSolidaria,
  } = usePendingIndicators()

  const rawCounts = useMemo<BadgeCounts>(() => ({
    unreadAvisos: Math.max(0, unreadAvisos),
    pendingMinisterioIngresos: Math.max(0, pendingMinisterioIngresos),
    pendingServicios: Math.max(0, pendingServicios),
    pendingSolicitudesGestionables: Math.max(0, pendingSolicitudesGestionables),
    pendingContactos: Math.max(0, pendingContactos),
    pendingPreguntasPastorales: Math.max(0, pendingPreguntasPastorales),
    pendingAyudaSolidaria: Math.max(0, pendingAyudaSolidaria),
  }), [
    pendingAyudaSolidaria,
    pendingContactos,
    pendingMinisterioIngresos,
    pendingPreguntasPastorales,
    pendingServicios,
    pendingSolicitudesGestionables,
    unreadAvisos,
  ])

  const [userId, setUserId] = useState<string | null>(null)
  const [seen, setSeen] = useState<BadgeCounts>({ ...EMPTY_COUNTS })

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUserId(data.session?.user?.id || null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUserId(session?.user?.id || null)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setSeen({ ...EMPTY_COUNTS })
      return
    }
    setSeen(readSeen(userId))
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const destination = destinationFor(pathname)
    setSeen((current) => {
      const next = { ...current }

      for (const key of KEYS) {
        if (next[key] > rawCounts[key]) next[key] = rawCounts[key]
      }

      if (destination) next[destination] = rawCounts[destination]

      if (sameCounts(current, next)) return current
      writeSeen(userId, next)
      return next
    })
  }, [pathname, rawCounts, userId])

  const total = useMemo(() => {
    if (!userId) return KEYS.reduce((sum, key) => sum + rawCounts[key], 0)
    return KEYS.reduce((sum, key) => sum + Math.max(0, rawCounts[key] - seen[key]), 0)
  }, [rawCounts, seen, userId])

  useEffect(() => {
    applyBadge(total)
  }, [total])

  return total
}
