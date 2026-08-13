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
    const refresh = () => setRefreshKey((current) => current + 1)

    window.addEventListener('online', refresh)
    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    }
  }, [])

  return <InicioClient key={refreshKey} userId={userId} email={email} />
}
