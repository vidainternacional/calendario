'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function BibleNotesPrefetch() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/biblia') router.prefetch('/biblia/notas')
  }, [pathname, router])

  return null
}
