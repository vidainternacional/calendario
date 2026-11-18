'use client'

import { useEffect } from 'react'
import { useVideosMinisteriales } from './useVideosMinisteriales'
import { usePendingIndicators } from './usePendingIndicators'

function applyBadge(total: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  const operacion = total > 0 ? nav.setAppBadge?.(total) : nav.clearAppBadge?.()
  void operacion?.catch(() => undefined)
}
export function useAttentionBadges() {
  const pendientes = usePendingIndicators()
  const { pendientes: videos } = useVideosMinisteriales()
  const total = pendientes.total + videos.length
  useEffect(() => { applyBadge(total) }, [total])
  return { ...pendientes, unreadVideos: videos.length, total }
}
export function useAttentionBadgeCount() { return useAttentionBadges().total }
