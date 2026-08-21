export type HebrewTranslationDirection = {
  source: 'es' | 'he'
  target: 'es' | 'he'
}

const HEBREW_RE = /[\u0590-\u05FF]/u

export function hasHebrew(text: string) {
  return HEBREW_RE.test(text)
}

export function detectHebrewTranslationDirection(text: string): HebrewTranslationDirection {
  return hasHebrew(text)
    ? { source: 'he', target: 'es' }
    : { source: 'es', target: 'he' }
}

export function isSingleWord(text: string) {
  const value = text.trim()
  if (!value) return false
  return !/\s/u.test(value)
}

export function normalizeTranslatorInput(value: unknown, maxLength = 1000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export function buildAzureTranslatorUrl(endpoint: string, direction: HebrewTranslationDirection) {
  const base = endpoint.replace(/\/$/u, '')
  const params = new URLSearchParams({
    'api-version': '3.0',
    from: direction.source,
    to: direction.target,
  })
  return `${base}/translate?${params.toString()}`
}
