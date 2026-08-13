'use client'

import { useEffect, useState } from 'react'
import AvisosClient from '@/components/avisos/AvisosClient'
import { PUBLICATIONS_CONTENT_REFRESH_EVENT } from '@/components/avisos/usePublicationReads'

type AvisosContentRefreshProps = {
  userId: string
}

const RESUME_RETRY_MS = 2000

export default function AvisosContentRefresh({ userId }: AvisosContentRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let retryTimer: number | null = null
    const refresh = () => setRefreshKey((current) => current + 1)
    const scheduleResumeRefresh = () => {
      refresh()
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(refresh, RESUME_RETRY_MS)
    }
    const handleOnline = () => scheduleResumeRefresh()
    const handleFocus = () => scheduleResumeRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleResumeRefresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    return () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    }
  }, [])

  return <AvisosClient key={refreshKey} userId={userId} />
}
