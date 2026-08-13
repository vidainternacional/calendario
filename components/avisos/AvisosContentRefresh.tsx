'use client'

import { useEffect, useState } from 'react'
import AvisosClient from '@/components/avisos/AvisosClient'
import { PUBLICATIONS_CONTENT_REFRESH_EVENT } from '@/components/avisos/usePublicationReads'

type AvisosContentRefreshProps = {
  userId: string
}

export default function AvisosContentRefresh({ userId }: AvisosContentRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let retryTimer: number | null = null
    const refresh = () => setRefreshKey((current) => current + 1)
    const handleOnline = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(refresh, 2000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    return () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    }
  }, [])

  return <AvisosClient key={refreshKey} userId={userId} />
}
