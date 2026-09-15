'use client'

import { useEffect, useState } from 'react'
import AvisosClient from '@/components/avisos/AvisosClient'
import { PUBLICATIONS_CONTENT_REFRESH_EVENT } from '@/components/avisos/usePublicationReads'

type AvisosContentRefreshProps = {
  userId: string
}

const RESUME_COALESCE_MS = 180

export default function AvisosContentRefresh({ userId }: AvisosContentRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let resumeTimer: number | null = null
    const refresh = () => setRefreshKey((current) => current + 1)
    const scheduleResumeRefresh = () => {
      if (resumeTimer !== null) window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        resumeTimer = null
        refresh()
      }, RESUME_COALESCE_MS)
    }
    const handleOnline = () => refresh()
    const handleFocus = () => scheduleResumeRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleResumeRefresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    return () => {
      if (resumeTimer !== null) window.clearTimeout(resumeTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    }
  }, [])

  return <AvisosClient key={refreshKey} userId={userId} />
}
