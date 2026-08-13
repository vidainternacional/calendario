'use client'

import { useEffect, useState } from 'react'
import { PUBLICATIONS_CONTENT_REFRESH_EVENT } from '@/components/avisos/usePublicationReads'
import InicioClient from '@/components/inicio/InicioClient'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'

type InicioOnlineRefreshProps = {
  userId: string
  email?: string | null
}

type CachedInicioData = {
  profile: any | null
  membresias: any[]
  publicaciones: any[]
  [key: string]: any
}

const CACHE_SCOPE = 'inicio:v7'
const CACHE_TTL = 10 * 60 * 1000
const RESUME_RETRY_MS = 2000

export default function InicioOnlineRefresh({ userId, email }: InicioOnlineRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    let retryTimer: number | null = null
    let refreshInFlight = false
    let refreshQueued = false

    async function refreshPublicaciones() {
      if (refreshInFlight) {
        refreshQueued = true
        return
      }

      refreshInFlight = true
      try {
        const cached = readUserCache<CachedInicioData>(userId, CACHE_SCOPE)
        if (!cached) {
          if (!cancelled) setRefreshKey((current) => current + 1)
          return
        }

        const role = cached.profile?.rol as string | undefined
        const ministerioIds = (cached.membresias || []).map((item: any) => item.ministerio_id).filter(Boolean)
        const puedeVerTodoAvisos = role === 'pastor' || role === 'administrador'
        const supabase = createClient()

        let query = supabase
          .from('publicaciones')
          .select(`
            id,
            titulo,
            cuerpo,
            tipo,
            created_at,
            profiles!autor_id (nombre_completo, avatar_url)
          `)
          .eq('estado', 'aprobado')
          .order('created_at', { ascending: false })
          .limit(100)

        if (!puedeVerTodoAvisos) {
          query = query.or(
            `ministerio_id.is.null,ministerio_id.in.(${ministerioIds.length > 0 ? ministerioIds.join(',') : '00000000-0000-0000-0000-000000000000'})`,
          )
        }

        const { data: publicaciones, error } = await query
        if (error) {
          console.error('No se pudieron refrescar los Avisos de Inicio', error)
          return
        }

        if (!cancelled) {
          const nextData: CachedInicioData = {
            ...cached,
            publicaciones: publicaciones || [],
          }
          writeUserCache(userId, CACHE_SCOPE, nextData, CACHE_TTL)
          setRefreshKey((current) => current + 1)
        }
      } finally {
        refreshInFlight = false
        if (refreshQueued && !cancelled) {
          refreshQueued = false
          void refreshPublicaciones()
        }
      }
    }

    const scheduleResumeRefresh = () => {
      void refreshPublicaciones()
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => void refreshPublicaciones(), RESUME_RETRY_MS)
    }
    const handleContentRefresh = () => void refreshPublicaciones()
    const handleOnline = () => scheduleResumeRefresh()
    const handleFocus = () => scheduleResumeRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleResumeRefresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, handleContentRefresh)
    return () => {
      cancelled = true
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, handleContentRefresh)
    }
  }, [userId])

  return <InicioClient key={refreshKey} userId={userId} email={email} />
}
