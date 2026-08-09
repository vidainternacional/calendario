'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const PUBLICATION_READ_EVENT = 'vida-publicacion-leida'

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
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('get_unread_publications_count')
      if (error) {
        console.error('No se pudo cargar el contador de avisos no leídos', error)
        return
      }
      if (!cancelled) setCount(Math.max(0, Number(data || 0)))
    }

    const handleRead = () => void refresh()
    const handleFocus = () => void refresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener(PUBLICATION_READ_EVENT, handleRead)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener(PUBLICATION_READ_EVENT, handleRead)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return count
}
