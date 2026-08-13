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
    const refresh = () => setRefreshKey((current) => current + 1)

    window.addEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(PUBLICATIONS_CONTENT_REFRESH_EVENT, refresh)
  }, [])

  return <AvisosClient key={refreshKey} userId={userId} />
}
