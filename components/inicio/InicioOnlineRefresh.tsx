'use client'

import { useEffect, useState } from 'react'
import { PUBLICATIONS_CONTENT_REFRESH_EVENT } from '@/components/avisos/usePublicationReads'
import InicioClient from '@/components/inicio/InicioClient'

type InicioOnlineRefreshProps = {
  userId: string
  email?: string | null
}

export default function InicioOnlineRefresh({ userId, email }: InicioOnlineRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let retryTimer: number | null = null
    const refresh = () => setRefreshKey((current) => current + 1)
    const handleOnline = () => {
      refresh()
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

  return <InicioClient key={refreshKey} userId={userId} email={email} />
}
