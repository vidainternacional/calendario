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
  const [pendingServicios, setPendingServicios] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function refreshPending() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setPendingMinisterioIngresos(0)
          setPendingServicios(0)
        }
        return
      }

      const [leadershipReq, serviciosReq] = await Promise.all([
        (supabase as any)
          .from('ministerio_solicitudes_ingreso')
          .select('id, profile_id')
          .eq('estado', 'pendiente'),
        (supabase as any)
          .from('evento_asignaciones')
          .select('evento_id, estado, eventos!inner(fecha_inicio)')
          .eq('profile_id', user.id)
          .in('estado', ['asignado', 'pendiente'])
          .gte('eventos.fecha_inicio', new Date().toISOString()),
      ])

      if (leadershipReq.error) {
        console.error('No se pudieron cargar los pendientes de liderazgo', leadershipReq.error)
      } else {
        const manageable = (leadershipReq.data || []).filter(
          (row: any) => String(row.profile_id || '') !== user.id,
        ).length
        if (!cancelled) setPendingMinisterioIngresos(manageable)
      }

      if (serviciosReq.error) {
        console.error('No se pudieron cargar los servicios pendientes', serviciosReq.error)
      } else {
        const eventosPendientes = new Set(
          (serviciosReq.data || [])
            .map((row: any) => String(row.evento_id || ''))
            .filter(Boolean),
        )
        if (!cancelled) setPendingServicios(eventosPendientes.size)
      }
    }

    const handleFocus = () => void refreshPending()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshPending()
    }
    const handleExplicitRefresh = () => void refreshPending()

    void refreshPending()
    const interval = window.setInterval(refreshPending, 30_000)
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
    () => Math.max(0, unreadAvisos) + Math.max(0, pendingMinisterioIngresos) + Math.max(0, pendingServicios),
    [pendingMinisterioIngresos, pendingServicios, unreadAvisos],
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
    pendingServicios,
    total,
  }
}
