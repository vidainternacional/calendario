import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type ConcordanciaResultado = {
  termId: string
  term: string
  description: string | null
  score: number
  matches: Array<{
    reference: string
    bookCode: string
    chapter: number
    verse: number
    excerpt: string | null
    relevance: number
    relationKind: 'direct' | 'conceptual' | 'cross_reference' | 'original_language'
  }>
}

const STOP_WORDS = new Set([
  'a', 'al', 'algo', 'como', 'con', 'cual', 'cuando', 'de', 'del', 'dios', 'donde',
  'el', 'ella', 'en', 'es', 'esta', 'este', 'esto', 'hay', 'la', 'las', 'lo', 'los',
  'me', 'mi', 'para', 'por', 'porque', 'que', 'se', 'si', 'sin', 'sobre', 'soy',
  'su', 'sus', 'tener', 'tengo', 'un', 'una', 'y', 'yo',
])

function normalizeQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

function tokenize(value: string) {
  return normalizeQuery(value)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token))
    .slice(0, 12)
}

function scoreCandidate(query: string, tokens: string[], values: string[]) {
  let score = 0

  for (const rawValue of values) {
    const value = normalizeQuery(rawValue)
    if (!value) continue

    if (value === query) score = Math.max(score, 140)
    else if (value.startsWith(query) || query.startsWith(value)) score = Math.max(score, 115)
    else if (value.includes(query) || query.includes(value)) score = Math.max(score, 95)

    const valueTokens = new Set(tokenize(value))
    const matchedTokens = tokens.filter(token => value.includes(token) || valueTokens.has(token))
    const tokenScore = matchedTokens.reduce((total, token) => {
      if (value === token) return total + 35
      if (value.startsWith(token)) return total + 25
      return total + 16
    }, 0)

    score = Math.max(score, tokenScore)
  }

  return score
}

export async function listarTemasConcordancia(limit = 60): Promise<Array<{
  id: string
  term: string
  description: string | null
}>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase as any)
    .from('biblical_concordance_terms')
    .select('id, canonical_term, description')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('canonical_term')
    .limit(Math.min(Math.max(limit, 1), 100))

  if (error) {
    console.error('[biblical-concordance] No se pudieron listar temas:', error)
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    term: row.canonical_term,
    description: row.description,
  }))
}

export async function buscarConcordanciasBiblicas(
  rawQuery: string,
  limit = 60
): Promise<{ query: string; results: ConcordanciaResultado[] }> {
  const query = normalizeQuery(rawQuery)
  if (!query) return { query: '', results: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { query, results: [] }

  const tokens = tokenize(query)
  const safeLimit = Math.min(Math.max(limit, 1), 100)

  const [{ data: terms, error: termError }, { data: aliases, error: aliasError }] = await Promise.all([
    (supabase as any)
      .from('biblical_concordance_terms')
      .select('id, canonical_term, normalized_term, description')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(500),
    (supabase as any)
      .from('biblical_concordance_aliases')
      .select('term_id, alias, normalized_alias, alias_kind')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(2500),
  ])

  if (termError || aliasError) {
    console.error('[biblical-concordance] No se pudo cargar el índice:', termError ?? aliasError)
    return { query, results: [] }
  }

  const aliasesByTerm = new Map<string, string[]>()
  for (const row of aliases ?? []) {
    const values = aliasesByTerm.get(row.term_id) ?? []
    values.push(row.alias, row.normalized_alias)
    aliasesByTerm.set(row.term_id, values)
  }

  const rankedTerms = (terms ?? [])
    .map((term: any) => ({
      id: term.id,
      canonical_term: term.canonical_term,
      description: term.description as string | null,
      score: scoreCandidate(query, tokens, [
        term.canonical_term,
        term.normalized_term,
        ...(aliasesByTerm.get(term.id) ?? []),
      ]),
    }))
    .filter((term: any) => term.score >= 16)
    .sort((a: any, b: any) => b.score - a.score || a.canonical_term.localeCompare(b.canonical_term, 'es'))
    .slice(0, 8)

  if (rankedTerms.length === 0) return { query, results: [] }

  const termIds = rankedTerms.map((term: any) => term.id)
  const { data: occurrences, error: occurrenceError } = await (supabase as any)
    .from('biblical_concordance_occurrences')
    .select('term_id, book_code, chapter, verse, reference_label, verse_excerpt, relevance, relation_kind')
    .in('term_id', termIds)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('relevance', { ascending: false })
    .limit(safeLimit)

  if (occurrenceError) {
    console.error('[biblical-concordance] No se pudieron cargar referencias:', occurrenceError)
    return { query, results: [] }
  }

  const grouped = new Map<string, ConcordanciaResultado>()
  for (const term of rankedTerms) {
    grouped.set(term.id, {
      termId: term.id,
      term: term.canonical_term,
      description: term.description,
      score: term.score,
      matches: [],
    })
  }

  for (const occurrence of occurrences ?? []) {
    const group = grouped.get(occurrence.term_id)
    if (!group || group.matches.length >= 12) continue
    group.matches.push({
      reference: occurrence.reference_label,
      bookCode: occurrence.book_code,
      chapter: occurrence.chapter,
      verse: occurrence.verse,
      excerpt: occurrence.verse_excerpt,
      relevance: occurrence.relevance,
      relationKind: occurrence.relation_kind,
    })
  }

  return {
    query,
    results: Array.from(grouped.values())
      .filter(result => result.matches.length > 0)
      .sort((a, b) => b.score - a.score),
  }
}

export async function buscarConcordanciasParaReferencia({
  bookCode,
  chapter,
  verse,
  limit = 80,
}: {
  bookCode: string
  chapter: number
  verse?: number | null
  limit?: number
}): Promise<ConcordanciaResultado[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const safeLimit = Math.min(Math.max(limit, 1), 100)
  let anchorQuery = (supabase as any)
    .from('biblical_concordance_occurrences')
    .select('term_id, relevance')
    .eq('book_code', bookCode)
    .eq('chapter', chapter)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('relevance', { ascending: false })
    .limit(24)

  if (verse) anchorQuery = anchorQuery.eq('verse', verse)

  const { data: anchors, error: anchorError } = await anchorQuery
  if (anchorError || !anchors?.length) {
    if (anchorError) console.error('[biblical-concordance] No se pudieron cargar concordancias de referencia:', anchorError)
    return []
  }

  const anchorRelevance = new Map<string, number>()
  for (const row of anchors) {
    anchorRelevance.set(row.term_id, Math.max(anchorRelevance.get(row.term_id) ?? 0, Number(row.relevance) || 0))
  }
  const termIds = Array.from(anchorRelevance.keys()).slice(0, 8)

  const [{ data: terms, error: termError }, { data: occurrences, error: occurrenceError }] = await Promise.all([
    (supabase as any)
      .from('biblical_concordance_terms')
      .select('id, canonical_term, description')
      .in('id', termIds)
      .eq('enabled', true)
      .eq('review_status', 'approved'),
    (supabase as any)
      .from('biblical_concordance_occurrences')
      .select('term_id, book_code, chapter, verse, reference_label, verse_excerpt, relevance, relation_kind')
      .in('term_id', termIds)
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .order('relevance', { ascending: false })
      .limit(safeLimit),
  ])

  if (termError || occurrenceError) {
    console.error('[biblical-concordance] No se pudieron resolver concordancias relacionadas:', termError ?? occurrenceError)
    return []
  }

  const grouped = new Map<string, ConcordanciaResultado>()
  for (const term of terms ?? []) {
    grouped.set(term.id, {
      termId: term.id,
      term: term.canonical_term,
      description: term.description,
      score: anchorRelevance.get(term.id) ?? 0,
      matches: [],
    })
  }

  for (const occurrence of occurrences ?? []) {
    const group = grouped.get(occurrence.term_id)
    if (!group || group.matches.length >= 12) continue
    group.matches.push({
      reference: occurrence.reference_label,
      bookCode: occurrence.book_code,
      chapter: occurrence.chapter,
      verse: occurrence.verse,
      excerpt: occurrence.verse_excerpt,
      relevance: occurrence.relevance,
      relationKind: occurrence.relation_kind,
    })
  }

  return Array.from(grouped.values())
    .filter(result => result.matches.length > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term, 'es'))
}
