'use client'

import { useEffect, useRef } from 'react'
import { registrarEventoAnaliticaEstudio } from '@/app/actions/estudio-analytics'

type PendingQuery = {
  query: string
  startedAt: number
}

function exactText(selector: string, value: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector))
    .find((element) => element.textContent?.trim() === value) ?? null
}

function bookFromReference(reference: string | null) {
  if (!reference) return null
  const match = reference.match(/^(.+?)\s+\d/)
  return match?.[1]?.trim() || null
}

function detectStudyResult(query: string) {
  const studyLabel = exactText('p', 'Estudio bíblico')
  if (studyLabel) {
    const reference = studyLabel.parentElement?.querySelector('h2')?.textContent?.trim() || null
    return {
      queryKind: 'pasaje',
      resolvedReference: reference,
      resolvedBook: bookFromReference(reference),
      resolvedTopic: null,
      resultStatus: 'success_study',
    }
  }

  const concordanceLabel = exactText('p', 'Concordancias internas')
  if (concordanceLabel) {
    const section = concordanceLabel.closest('section')
    const topic = section?.querySelector('article h3')?.textContent?.trim() || null
    return {
      queryKind: 'tema',
      resolvedReference: null,
      resolvedBook: null,
      resolvedTopic: topic,
      resultStatus: 'success_concordance',
    }
  }

  const placeLabel = exactText('p', 'Lugar bíblico')
  if (placeLabel) {
    const place = placeLabel.parentElement?.querySelector('h2')?.textContent?.trim() || null
    return {
      queryKind: 'lugar',
      resolvedReference: null,
      resolvedBook: null,
      resolvedTopic: place,
      resultStatus: 'place',
    }
  }

  const suggestionLabel = exactText('p', 'Ayuda de búsqueda')
  if (suggestionLabel) {
    const section = suggestionLabel.closest('section')
    const suggestion = section?.querySelector('button span')?.textContent?.trim() || null
    return {
      queryKind: 'sugerencia',
      resolvedReference: null,
      resolvedBook: null,
      resolvedTopic: suggestion,
      resultStatus: 'suggestions',
    }
  }

  const error = document.querySelector<HTMLElement>('#estudio-form p.border-amber-200')
  if (error) {
    return {
      queryKind: 'sin_resultado',
      resolvedReference: null,
      resolvedBook: null,
      resolvedTopic: null,
      resultStatus: 'error',
    }
  }

  return null
}

function currentStudyReference() {
  const studyLabel = exactText('p', 'Estudio bíblico')
  return studyLabel?.parentElement?.querySelector('h2')?.textContent?.trim() || null
}

export default function StudyAnalyticsTracker() {
  const pendingRef = useRef<PendingQuery | null>(null)
  const lastQueryKeyRef = useRef('')

  useEffect(() => {
    const form = document.getElementById('estudio-form') as HTMLFormElement | null
    if (!form) return

    const onSubmit = () => {
      const input = form.elements.namedItem('pasaje') as HTMLInputElement | null
      const query = input?.value?.trim() || ''
      if (!query) return
      pendingRef.current = { query, startedAt: Date.now() }
      lastQueryKeyRef.current = ''
    }

    const tryRecordQuery = () => {
      const pending = pendingRef.current
      if (!pending) return

      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')
      if (submit?.disabled || submit?.textContent?.includes('Buscando')) return

      const result = detectStudyResult(pending.query)
      if (!result) return

      const key = `${pending.query}|${result.resultStatus}|${result.resolvedReference ?? ''}|${result.resolvedTopic ?? ''}`
      if (lastQueryKeyRef.current === key) return
      lastQueryKeyRef.current = key
      pendingRef.current = null

      void registrarEventoAnaliticaEstudio({
        eventType: 'query',
        queryText: pending.query,
        queryKind: result.queryKind,
        resolvedReference: result.resolvedReference,
        resolvedBook: result.resolvedBook,
        resolvedTopic: result.resolvedTopic,
        resultStatus: result.resultStatus,
        durationMs: Date.now() - pending.startedAt,
      })
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const button = target?.closest<HTMLButtonElement>('button[aria-expanded]')
      if (!button || button.getAttribute('aria-expanded') === 'true') return
      if (!document.getElementById('estudio-form')?.parentElement?.contains(button)) return

      const sectionKey = button.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100)
      if (!sectionKey) return
      const reference = currentStudyReference()

      void registrarEventoAnaliticaEstudio({
        eventType: 'section',
        queryKind: reference ? 'pasaje' : null,
        resolvedReference: reference,
        resolvedBook: bookFromReference(reference),
        resultStatus: 'used',
        sectionKey,
      })
    }

    form.addEventListener('submit', onSubmit)
    document.addEventListener('click', onClick, true)
    const observer = new MutationObserver(tryRecordQuery)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      form.removeEventListener('submit', onSubmit)
      document.removeEventListener('click', onClick, true)
      observer.disconnect()
    }
  }, [])

  return null
}
