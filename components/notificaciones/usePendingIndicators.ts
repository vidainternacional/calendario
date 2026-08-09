'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUnreadPublicationsCount } from '@/components/avisos/usePublicationReads'

export const PENDING_INDICATORS_EVENT = 'vida-pending-indicators-refresh'

export function requestPendingIndicatorsRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PENDING_INDICATORS_EVENT))
}

export function usePendingIndicators() {
  const unreadAvisos = useUnreadPublicationsCount()
  const [pendingMinisterioIngresos, setPendingMinisterioIngresos] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function refreshLeadershipPending() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setPendingMinisterioIngresos(0)
        return
      }

      const { data, error } = await (supabase as any)
        .from('ministerio_solicitudes_ingreso')
        .select('id, profile_id')
        .eq('estado', 'pendiente')

      if (error) {
        console.error('No se pudieron cargar los pendientes de liderazgo', error)
        return
      }

      // RLS devuelve la solicitud propia de un usuario normal y, adicionalmente,
      // las solicitudes que puede gestionar por liderazgo/pastoral/administración.
      // La solicitud propia no es un pendiente de gestión y no debe sumarse al badge.
      const manageable = (data || []).filter(
        (row: any) => String(row.profile_id || '') !== user.id,
      ).length

      if (!cancelled) setPendingMinisterioIngresos(manageable)
    }

    const handleFocus = () => void refreshLeadershipPending()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshLeadershipPending()
    }
    const handleExplicitRefresh = () => void refreshLeadershipPending()

    void refreshLeadershipPending()
    const interval = window.setInterval(refreshLeadershipPending, 45_000)
    window.addEventListener('focus', handleFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const total = useMemo(
    () => Math.max(0, unreadAvisos) + Math.max(0, pendingMinisterioIngresos),
    [pendingMinisterioIngresos, unreadAvisos],
  )

  useEffect(() => {
    const badgeNavigator = navigator as Navigator & {
      setAppBadge?: (value?: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }

    if (total > 0 && badgeNavigator.setAppBadge) {
      void badgeNavigator.setAppBadge(total).catch(() => undefined)
    } else if (total === 0 && badgeNavigator.clearAppBadge) {
      void badgeNavigator.clearAppBadge().catch(() => undefined)
    }
  }, [total])

  return {
    unreadAvisos,
    pendingMinisterioIngresos,
    total,
  }
}
