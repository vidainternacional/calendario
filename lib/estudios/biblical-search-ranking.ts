export type WeightedBiblicalSearchValue = {
  value: string
  weight?: number
}

const STOP_WORDS = new Set([
  'a', 'al', 'algo', 'acerca', 'biblia', 'biblica', 'biblico', 'como', 'con', 'cual', 'cuando',
  'de', 'del', 'dice', 'decir', 'dios', 'donde', 'el', 'ella', 'en', 'es', 'esta', 'este', 'esto',
  'hacer', 'hay', 'la', 'las', 'lo', 'los', 'me', 'mi', 'para', 'por', 'porque', 'que', 'se', 'si',
  'sin', 'sobre', 'soy', 'su', 'sus', 'tener', 'tengo', 'un', 'una', 'versiculo', 'versiculos', 'y', 'yo',
])

const VERB_ENDINGS = [
  'ariamos', 'eriamos', 'iriamos', 'aremos', 'eremos', 'iremos', 'arian', 'erian', 'irian',
  'ando', 'iendo', 'yendo', 'ados', 'adas', 'idos', 'idas', 'aron', 'ieron', 'abas', 'aban',
  'arias', 'erias', 'irias', 'aria', 'eria', 'iria', 'aste', 'iste', 'ado', 'ada', 'ido', 'ida',
  'amos', 'emos', 'imos', 'an', 'en', 'as', 'es', 'ar', 'er', 'ir',
]

export function normalizeBiblicalSearchQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

export function tokenizeBiblicalSearchQuery(value: string) {
  return normalizeBiblicalSearchQuery(value)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token))
    .slice(0, 16)
}

function lexicalForms(token: string) {
  const forms = new Set<string>()
  const normalized = normalizeBiblicalSearchQuery(token)
  if (!normalized || normalized.includes(' ')) return forms
  forms.add(normalized)

  if (normalized.endsWith('ces') && normalized.length > 5) forms.add(`${normalized.slice(0, -3)}z`)
  if (normalized.endsWith('es') && normalized.length > 5) forms.add(normalized.slice(0, -2))
  if (normalized.endsWith('s') && normalized.length > 4) forms.add(normalized.slice(0, -1))

  for (const base of Array.from(forms)) {
    if ((base.endsWith('o') || base.endsWith('a')) && base.length >= 4) forms.add(base.slice(0, -1))
    for (const ending of VERB_ENDINGS) {
      if (base.endsWith(ending) && base.length - ending.length >= 3) forms.add(base.slice(0, -ending.length))
    }
  }

  return forms
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]
  }
  return previous[b.length]
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0
  return 1 - (levenshtein(a, b) / Math.max(a.length, b.length))
}

function tokensRelated(a: string, b: string) {
  if (a === b) return 1
  const aForms = lexicalForms(a)
  const bForms = lexicalForms(b)
  if (Array.from(aForms).some(form => bForms.has(form) && form.length >= 3)) return 0.92
  if ((a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 4) return 0.84
  const fuzzy = similarity(a, b)
  return fuzzy >= 0.78 ? fuzzy * 0.86 : 0
}

export function scoreBiblicalSearchCandidate(
  rawQuery: string,
  rawValues: Array<string | WeightedBiblicalSearchValue>
) {
  const query = normalizeBiblicalSearchQuery(rawQuery)
  if (!query) return 0
  const queryTokens = tokenizeBiblicalSearchQuery(query)
  let best = 0

  for (const entry of rawValues) {
    const rawValue = typeof entry === 'string' ? entry : entry.value
    const weight = typeof entry === 'string' ? 1 : Math.min(Math.max(entry.weight ?? 1, 0), 1)
    const value = normalizeBiblicalSearchQuery(rawValue)
    if (!value) continue

    if (value === query) best = Math.max(best, 1 * weight)
    else if (value.includes(query) || query.includes(value)) best = Math.max(best, 0.95 * weight)

    const valueTokens = tokenizeBiblicalSearchQuery(value)
    if (!queryTokens.length || !valueTokens.length) {
      best = Math.max(best, similarity(query, value) * 0.72 * weight)
      continue
    }

    let matched = 0
    let tokenBest = 0
    for (const queryToken of queryTokens) {
      let local = 0
      for (const valueToken of valueTokens) local = Math.max(local, tokensRelated(queryToken, valueToken))
      if (local >= 0.67) matched += 1
      tokenBest = Math.max(tokenBest, local)
    }

    const coverage = matched / queryTokens.length
    if (coverage === 1) best = Math.max(best, 0.9 * weight)
    else if (coverage >= 0.5) best = Math.max(best, (0.72 + coverage * 0.12) * weight)
    best = Math.max(best, tokenBest * 0.88 * weight)
  }

  return Math.min(best, 1)
}
