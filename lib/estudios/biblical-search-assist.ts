import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type AsistenciaTemaBiblico =
  | { kind: 'resolved'; label: string; query: string; score: number }
  | { kind: 'suggestions'; suggestions: Array<{ label: string; query: string; detail: string; score: number }> }
  | null

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - (levenshtein(a, b) / longest)
}

function scoreQuery(query: string, values: string[]) {
  const normalizedQuery = normalize(query)
  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  let score = 0

  for (const rawValue of values) {
    const value = normalize(rawValue)
    if (!value) continue
    if (value === normalizedQuery) return 1
    if (value.includes(normalizedQuery) || normalizedQuery.includes(value)) score = Math.max(score, 0.95)
    score = Math.max(score, similarity(normalizedQuery, value))

    const valueTokens = value.split(' ').filter(Boolean)
    for (const queryToken of queryTokens) {
      if (queryToken.length < 4) continue
      for (const valueToken of valueTokens) {
        if (valueToken.length < 4) continue
        score = Math.max(score, similarity(queryToken, valueToken))
      }
    }
  }

  return score
}

export async function asistirTemaBiblico(rawQuery: string): Promise<AsistenciaTemaBiblico> {
  const query = rawQuery.trim()
  const normalizedQuery = normalize(query)
  if (!normalizedQuery || normalizedQuery.length < 4 || normalizedQuery.length > 180) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: terms, error: termError }, { data: aliases, error: aliasError }] = await Promise.all([
    (supabase as any)
      .from('biblical_concordance_terms')
      .select('id, canonical_term, normalized_term')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(500),
    (supabase as any)
      .from('biblical_concordance_aliases')
      .select('term_id, alias, normalized_alias')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(2500),
  ])

  if (termError || aliasError) {
    console.error('[biblical-search-assist] No se pudo cargar el índice:', termError ?? aliasError)
    return null
  }

  const aliasesByTerm = new Map<string, string[]>()
  for (const alias of aliases ?? []) {
    const values = aliasesByTerm.get(alias.term_id) ?? []
    values.push(alias.alias, alias.normalized_alias)
    aliasesByTerm.set(alias.term_id, values)
  }

  const ranked = (terms ?? [])
    .map((term: any) => ({
      id: term.id,
      label: term.canonical_term as string,
      query: term.canonical_term as string,
      score: scoreQuery(query, [
        term.canonical_term,
        term.normalized_term,
        ...(aliasesByTerm.get(term.id) ?? []),
      ]),
    }))
    .filter((candidate: any) => candidate.score >= 0.68)
    .sort((a: any, b: any) => b.score - a.score || a.label.localeCompare(b.label, 'es'))
    .slice(0, 5)

  if (ranked.length === 0) return null

  const best = ranked[0]
  const runnerUp = ranked[1]
  const shortQuery = normalizedQuery.split(' ').length <= 3
  const confident = shortQuery && best.score >= 0.82 && (best.score >= 0.94 || !runnerUp || best.score - runnerUp.score >= 0.07)

  if (confident) {
    return { kind: 'resolved', label: best.label, query: best.query, score: best.score }
  }

  return {
    kind: 'suggestions',
    suggestions: ranked.slice(0, 4).map((candidate: any) => ({
      label: candidate.label,
      query: candidate.query,
      detail: 'Tema bíblico relacionado',
      score: candidate.score,
    })),
  }
}
