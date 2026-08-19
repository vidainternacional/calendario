import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type HebrewLearningWord = {
  lexicalId: string
  strongNumber: string | null
  lemma: string
  transliteration: string | null
  partOfSpeech: string | null
  sourceGloss: string | null
  displayGlossEs: string | null
  sourceLocator: string
  providerVersion: string | null
  contentHash: string | null
}

export type HebrewWordCatalogPage = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  items: HebrewLearningWord[]
}

export type HebrewWordCatalogRequest = {
  page?: number
  pageSize?: number
  search?: string
}

type HebrewLexicalRow = {
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  source_gloss: string | null
  display_gloss_es: string | null
  source_locator: string
  provider_version: string | null
  content_hash: string | null
}

const SELECT_CATALOG = `
  lexical_id,
  strong_number,
  lemma,
  transliteration,
  part_of_speech,
  source_gloss,
  display_gloss_es,
  source_locator,
  provider_version,
  content_hash
`

const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value as number : 1
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value)) return 24
  return Math.min(Math.max(value as number, 12), 60)
}

function normalizeSearch(value: string | undefined) {
  return (value ?? '').replace(/[,%_()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function hebrewSearchPattern(value: string) {
  const consonants = value.normalize('NFD').replace(HEBREW_MARKS, '').replace(/\s+/g, '')
  return consonants ? `%${Array.from(consonants).join('%')}%` : '%'
}

function mapRow(row: HebrewLexicalRow): HebrewLearningWord {
  return {
    lexicalId: row.lexical_id,
    strongNumber: row.strong_number,
    lemma: row.lemma,
    transliteration: row.transliteration,
    partOfSpeech: row.part_of_speech,
    sourceGloss: row.source_gloss,
    displayGlossEs: row.display_gloss_es,
    sourceLocator: row.source_locator,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
  }
}

export async function listarCatalogoHebreoParaAprendizaje(
  request: HebrewWordCatalogRequest = {}
): Promise<HebrewWordCatalogPage> {
  const page = normalizePage(request.page)
  const pageSize = normalizePageSize(request.pageSize)
  const search = normalizeSearch(request.search)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'sin-sesion', page, pageSize, total: 0, totalPages: 0, search, items: [] }
  }

  const offset = (page - 1) * pageSize
  let query = (supabase as any)
    .from('biblical_lexical_entries')
    .select(SELECT_CATALOG, { count: 'exact' })
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (search) {
    if (/\p{Script=Hebrew}/u.test(search)) {
      query = query.ilike('lemma', hebrewSearchPattern(search))
    } else if (/^H?\d+[A-Z]?$/i.test(search)) {
      const normalizedStrong = search.toUpperCase().startsWith('H') ? search.toUpperCase() : `H${search.toUpperCase()}`
      query = query.or(`lexical_id.ilike.%${normalizedStrong}%,strong_number.ilike.%${normalizedStrong}%`)
    } else {
      query = query.ilike('source_gloss', `%${search}%`)
    }
  }

  const { data, error, count } = await query
    .order('lexical_id', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[hebrew-word-catalog] No se pudo cargar el catálogo:', error)
    return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, items: [] }
  }

  const total = count ?? 0
  return {
    status: 'ok',
    page,
    pageSize,
    total,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    search,
    items: ((data ?? []) as HebrewLexicalRow[]).map(mapRow),
  }
}
