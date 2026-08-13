'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const PUBLICATION_READ_EVENT = 'vida-publicacion-leida'

const UNREAD_REFRESH_INTERVAL_MS = 60_000
const UNREAD_REFRESH_DEDUPE_MS = 1_500

type UnreadCountListener = (count: number) => void

const unreadCountListeners = new Set<UnreadCountListener>()
let unreadCountValue = 0
let unreadCountLoaded = false
let unreadCountLastFetchAt = 0
let unreadCountInFlight: Promise<number> | null = null
let unreadCountStopGlobalListeners: (() => void) | null = null

function publishUnreadCount(nextValue: number) {
  unreadCountValue = Math.max(0, Number(nextValue || 0))
  unreadCountLoaded = true
  unreadCountListeners.forEach((listener) => listener(unreadCountValue))
}

async function refreshUnreadCount(options: { force?: boolean } = {}) {
  const now = Date.now()

  if (unreadCountInFlight) return unreadCountInFlight
  if (!options.force && unreadCountLoaded && now - unreadCountLastFetchAt < UNREAD_REFRESH_DEDUPE_MS) {
    return unreadCountValue
  }

  unreadCountLastFetchAt = now
  const request = (async () => {
    const supabase = createClient()
    const { data, error } = await (supabase as any).rpc('get_unread_publications_count')

    if (error) {
      console.error('No se pudo cargar el contador de avisos no leídos', error)
      return unreadCountValue
    }

    const nextValue = Math.max(0, Number(data || 0))
    publishUnreadCount(nextValue)
    return nextValue
  })()

  unreadCountInFlight = request
  try {
    return await request
  } finally {
    if (unreadCountInFlight === request) unreadCountInFlight = null
  }
}

function startUnreadCountGlobalListeners() {
  if (typeof window === 'undefined' || unreadCountStopGlobalListeners) return

  const handleRead = () => void refreshUnreadCount({ force: true })
  const handleFocus = () => void refreshUnreadCount()
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void refreshUnreadCount()
  }
  const interval = window.setInterval(() => void refreshUnreadCount(), UNREAD_REFRESH_INTERVAL_MS)

  window.addEventListener(PUBLICATION_READ_EVENT, handleRead)
  window.addEventListener('focus', handleFocus)
  document.addEventListener('visibilitychange', handleVisibility)

  unreadCountStopGlobalListeners = () => {
    window.clearInterval(interval)
    window.removeEventListener(PUBLICATION_READ_EVENT, handleRead)
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibility)
    unreadCountStopGlobalListeners = null
  }
}

function subscribeUnreadCount(listener: UnreadCountListener) {
  unreadCountListeners.add(listener)
  listener(unreadCountValue)

  if (unreadCountListeners.size === 1) startUnreadCountGlobalListeners()
  void refreshUnreadCount()

  return () => {
    unreadCountListeners.delete(listener)
    if (unreadCountListeners.size === 0) unreadCountStopGlobalListeners?.()
  }
}

export function requestUnreadPublicationsRefresh() {
  if (typeof window === 'undefined') return
  void refreshUnreadCount({ force: true })
}

export async function markPublicationRead(publicationId: string) {
  if (!publicationId) return

  const supabase = createClient()
  const { error } = await (supabase as any).rpc('mark_publication_read', {
    p_publicacion_id: publicationId,
  })

  if (error) {
    console.error('No se pudo registrar la lectura de la publicación', error)
    return
  }

  window.dispatchEvent(
    new CustomEvent(PUBLICATION_READ_EVENT, {
      detail: { publicationId },
    }),
  )
}

export function useUnreadPublicationIds(publicationIds: string[]) {
  const idsKey = publicationIds.filter(Boolean).join('|')
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    const ids = idsKey ? idsKey.split('|') : []

    async function refresh() {
      if (ids.length === 0) {
        if (!cancelled) setUnreadIds(new Set())
        return
      }

      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('get_unread_publication_ids', {
        p_publication_ids: ids,
      })

      if (error) {
        console.error('No se pudo cargar el estado de lectura de las publicaciones', error)
        return
      }

      if (!cancelled) {
        setUnreadIds(new Set((data || []).map((item: any) => String(item.publicacion_id))))
      }
    }

    const handleRead = (event: Event) => {
      const publicationId = (event as CustomEvent<{ publicationId?: string }>).detail?.publicationId
      if (!publicationId) return
      setUnreadIds((current) => {
        if (!current.has(publicationId)) return current
        const next = new Set(current)
        next.delete(publicationId)
        return next
      })
    }

    void refresh()
    window.addEventListener(PUBLICATION_READ_EVENT, handleRead)
    return () => {
      cancelled = true
      window.removeEventListener(PUBLICATION_READ_EVENT, handleRead)
    }
  }, [idsKey])

  return unreadIds
}

export function useUnreadPublicationsCount() {
  const [count, setCount] = useState(unreadCountValue)

  useEffect(() => subscribeUnreadCount(setCount), [])

  return count
}
