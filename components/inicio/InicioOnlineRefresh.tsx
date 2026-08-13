'use client'

import { useEffect, useState } from 'react'
import InicioClient from '@/components/inicio/InicioClient'

type InicioOnlineRefreshProps = {
  userId: string
  email?: string | null
}

export default function InicioOnlineRefresh({ userId, email }: InicioOnlineRefreshProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handleOnline = () => setRefreshKey((current) => current + 1)

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return <InicioClient key={refreshKey} userId={userId} email={email} />
}
