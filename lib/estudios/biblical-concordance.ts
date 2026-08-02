import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type ConcordanciaResultado = {
  termId: string
  term: string
  description: string | null
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

function normalizeQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

export async function buscarConcordanciasBiblicas(
  rawQuery: string,
  limit = 30
): Promise<{ query: string; results: ConcordanciaResultado[] }> {
  const query = normalizeQuery(rawQuery)
  if (!query) return { query: '', results: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { query, results: [] }

  const safeLimit = Math.min(Math.max(limit, 1), 50)

  const { data: directTerms, error: directError } = await (supabase as any)
    .from('biblical_concordance_terms')
    .select('id, canonical_term, description')
    .or(`normalized_term.ilike.%${query}%,canonical_term.ilike.%${rawQuery.trim()}%`)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .limit(12)

  if (directError) {
    console.error('[biblical-concordance] No se pudieron buscar términos:', directError)
  }

  const { data: aliasRows, error: aliasError } = await (supabase as any)
    .from('biblical_concordance_aliases')
    .select('term_id, term:biblical_concordance_terms!inner(id, canonical_term, description)')
    .ilike('normalized_alias', `%${query}%`)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .limit(20)

  if (aliasError) {
    console.error('[biblical-concordance] No se pudieron buscar alias:', aliasError)
  }

  const termMap = new Map<string, { id: string; canonical_term: string; description: string | null }>()

  for (const term of directTerms ?? []) {
    termMap.set(term.id, term)
  }

  for (const row of aliasRows ?? []) {
    const term = Array.isArray(row.term) ? row.term[0] : row.term
    if (term?.id) termMap.set(term.id, term)
  }

  const termIds = Array.from(termMap.keys())
  if (termIds.length === 0) return { query, results: [] }

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

  for (const id of termIds) {
    const term = termMap.get(id)
    if (!term) continue
    grouped.set(id, {
      termId: id,
      term: term.canonical_term,
      description: term.description,
      matches: [],
    })
  }

  for (const occurrence of occurrences ?? []) {
    const group = grouped.get(occurrence.term_id)
    if (!group) continue
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
    results: Array.from(grouped.values()).filter(result => result.matches.length > 0),
  }
}
