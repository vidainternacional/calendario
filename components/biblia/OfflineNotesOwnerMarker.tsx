'use client'

import { useEffect } from 'react'

export const VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY = 'vida-biblia-notas-active-owner-v1'

export default function OfflineNotesOwnerMarker({ userId }: { userId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY, userId)
    } catch {}
  }, [userId])

  return null
}
