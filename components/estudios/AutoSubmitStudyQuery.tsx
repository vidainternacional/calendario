'use client'

import { useEffect, useRef } from 'react'

export default function AutoSubmitStudyQuery({
  query,
  enabled,
}: {
  query: string
  enabled: boolean
}) {
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!enabled || submittedRef.current || !query.trim()) return
    submittedRef.current = true

    let cancelled = false
    let attempts = 0

    const submitQuery = () => {
      if (cancelled) return

      const form = document.getElementById('estudio-form') as HTMLFormElement | null
      const input = form?.elements.namedItem('pasaje') as HTMLInputElement | null

      if (!form || !input) {
        attempts += 1
        if (attempts <= 10) window.setTimeout(submitQuery, 30)
        return
      }

      input.value = query
      form.requestSubmit()
    }

    submitQuery()

    return () => {
      cancelled = true
    }
  }, [enabled, query])

  return null
}
