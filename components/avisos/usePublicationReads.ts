'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const PUBLICATION_READ_EVENT = 'vida-publicacion-leida'
export const PUBLICATIONS_CONTENT_REFRESH_EVENT = 'vida-avisos-contenido-actualizar'

const UNREAD_REFRESH_INTERVAL_MS = 60_000
const UNREAD_REFRESH_DEDUPE_MS = 1_500

type UnreadCountListener = (count: number) => void

const unreadCountListeners = new Set<UnreadCountListener>()
let unreadCountGeneration = 0
let unreadCountUser: string | null = null
let unreadCountValue = 0
let unreadCountLoaded = false
let unreadCountLastFetchAt = 0
let unreadCountInFlight: Promise<number> | null = null
let unreadCountForceRefreshQueued = false
let unreadCountStopGlobalListeners: (() => void) | null = null

function publishUnreadCount(nextValue: number) {
  const previousValue = unreadCountValue
  const wasLoaded = unreadCountLoaded

  unreadCountValue = Math.max(0, Number(nextValue || 0))
  unreadCountLoaded = true
  unreadCountListeners.forEach((listener) => listener(unreadCountValue))

  if (wasLoaded && unreadCountValue > previousValue) {
    requestPublicationsContentRefresh()
  }
}

async function refreshUnreadCount(options: { force?: boolean } = {}) {
  const now = Date.now()

  if (unreadCountInFlight) {
    if (options.force) unreadCountForceRefreshQueued = true
    return unreadCountInFlight
  }

  if (!options.force && unreadCountLoaded && now - unreadCountLastFetchAt < UNREAD_REFRESH_DEDUPE_MS) {
    return unreadCountValue
  }

  unreadCountLastFetchAt = now
  const request = (async () => {
    const generation = unreadCountGeneration
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getSession()
    if (generation !== unreadCountGeneration) return unreadCountValue
    const usuario = auth.session?.user.id || null
    if (unreadCountUser !== usuario) { unreadCountUser = usuario; publishUnreadCount(0) }
    if (!usuario) { publishUnreadCount(0); return 0 }
    const { data, error } = await (supabase as any).rpc('get_unread_publications_count')

    if (generation !== unreadCountGeneration || unreadCountUser !== usuario) return unreadCountValue
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

    if (unreadCountForceRefreshQueued) {
      unreadCountForceRefreshQueued = false
      void refreshUnreadCount({ force: true })
    }
  }
}

function startUnreadCountGlobalListeners() {
  if (typeof window === 'undefined' || unreadCountStopGlobalListeners) return

  const { data: auth } = createClient().auth.onAuthStateChange((_evento, session) => {
    const usuario = session?.user.id || null
    if (unreadCountUser !== usuario) {
      unreadCountGeneration++; unreadCountUser = usuario; unreadCountLastFetchAt = 0; publishUnreadCount(0)
      Promise.resolve().then(() => void refreshUnreadCount({ force: true }))
    }
  })
  const handleRead = () => void refreshUnreadCount({ force: true })
  const handleFocus = () => void refreshUnreadCount()
  const handleOnline = () => void refreshUnreadCount({ force: true })
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void refreshUnreadCount()
  }
  const interval = window.setInterval(() => void refreshUnreadCount(), UNREAD_REFRESH_INTERVAL_MS)

  window.addEventListener(PUBLICATION_READ_EVENT, handleRead)
  window.addEventListener('focus', handleFocus)
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibility)

  unreadCountStopGlobalListeners = () => {
    auth.subscription.unsubscribe()
    window.clearInterval(interval)
    window.removeEventListener(PUBLICATION_READ_EVENT, handleRead)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('online', handleOnline)
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
    if (unreadCountListeners.size === 0) { unreadCountStopGlobalListeners?.(); unreadCountGeneration++; unreadCountUser = null; unreadCountLoaded = false; unreadCountLastFetchAt = 0; publishUnreadCount(0) }
  }
}

export function requestUnreadPublicationsRefresh() {
  if (typeof window === 'undefined') return
  void refreshUnreadCount({ force: true })
  requestPublicationsContentRefresh()
}

export function requestPublicationsContentRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PUBLICATIONS_CONTENT_REFRESH_EVENT))
}

export async function markPublicationRead(publicationId: string): Promise<{ success: boolean; error?: string }> {
  if (!publicationId) return { success: false, error: 'No se identificó el aviso.' }
  const generacion = unreadCountGeneration
  try {
    const supabase = createClient()
    const { error } = await (supabase as any).rpc('mark_publication_read', { p_publicacion_id: publicationId })
    if (generacion !== unreadCountGeneration) return { success: false, error: 'La sesión cambió. Vuelve a abrir el aviso.' }
    if (error) throw error
    window.dispatchEvent(new CustomEvent(PUBLICATION_READ_EVENT, { detail: { publicationId } }))
    return { success: true }
  } catch (error) {
    console.error('No se pudo registrar la lectura de la publicación', error)
    return { success: false, error: 'No se pudo guardar la lectura. Revisa la conexión y vuelve a intentarlo.' }
  }
}

export function useUnreadPublicationIds(publicationIds: string[]) {
  const idsKey = publicationIds.filter(Boolean).join('|')
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    let generacion = 0
    const leidosDuranteConsulta = new Set<string>()
    const ids = idsKey ? idsKey.split('|') : []

    async function refresh() {
      const actual = generacion
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

      if (!cancelled && actual === generacion) {
        setUnreadIds(new Set<string>((data || []).map((item: { publicacion_id: string }) => String(item.publicacion_id)).filter((id: string) => !leidosDuranteConsulta.has(id))))
      }
    }

    const handleRead = (event: Event) => {
      const publicationId = (event as CustomEvent<{ publicationId?: string }>).detail?.publicationId
      if (!publicationId) return
      leidosDuranteConsulta.add(publicationId)
      setUnreadIds((current) => {
        if (!current.has(publicationId)) return current
        const next = new Set(current)
        next.delete(publicationId)
        return next
      })
    }

    const { data: auth } = createClient().auth.onAuthStateChange(() => {
      generacion++; leidosDuranteConsulta.clear(); setUnreadIds(new Set())
      Promise.resolve().then(() => { if (!cancelled) void refresh() })
    })
    void refresh()
    window.addEventListener(PUBLICATION_READ_EVENT, handleRead)
    return () => {
      cancelled = true
      auth.subscription.unsubscribe()
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
