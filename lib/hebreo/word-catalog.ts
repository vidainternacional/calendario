import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  lexicalIdsForLearningGroup,
  lexicalIdsForSpanishSearch,
  normalizeLearningGroup,
  pedagogicalWordForId,
  type HebrewLearningGroupId,
} from '@/lib/hebreo/word-learning'

export type HebrewLearningWord = {
  lexicalId: string
  strongNumber: string | null
  lemma: string
  partOfSpeech: string | null
  spanish: string | null
  pronunciation: string | null
  meaningNoteEs: string | null
}

export type HebrewWordCatalogPage = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewLearningGroupId
  items: HebrewLearningWord[]
}

export type HebrewWordCatalogRequest = {
  page?: number
  pageSize?: number
  search?: string
  group?: string
}

type HebrewLexicalRow = {
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  display_gloss_es: string | null
}

const SELECT_CATALOG = `
  lexical_id,
  strong_number,
  lemma,
  transliteration,
  part_of_speech,
  display_gloss_es
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
  const pedagogical = pedagogicalWordForId(row.lexical_id)
  return {
    lexicalId: row.lexical_id,
    strongNumber: row.strong_number,
    lemma: row.lemma,
    partOfSpeech: row.part_of_speech,
    spanish: row.display_gloss_es ?? pedagogical?.spanish ?? null,
    pronunciation: row.transliteration ?? pedagogical?.pronunciation ?? null,
    meaningNoteEs: pedagogical?.meaning ?? null,
  }
}

export async function listarCatalogoHebreoParaAprendizaje(
  request: HebrewWordCatalogRequest = {}
): Promise<HebrewWordCatalogPage> {
  const page = normalizePage(request.page)
  const pageSize = normalizePageSize(request.pageSize)
  const search = normalizeSearch(request.search)
  const group = normalizeLearningGroup(request.group)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'sin-sesion', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
  }

  const offset = (page - 1) * pageSize
  const semanticIds = lexicalIdsForLearningGroup(group)
  let query = (supabase as any)
    .from('biblical_lexical_entries')
    .select(SELECT_CATALOG, { count: 'exact' })
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  // La navegación por grupos se aplica al catálogo normal. Una búsqueda es global
  // para que "rey" encuentre מלך aunque el usuario estuviera viendo otro grupo.
  if (!search) {
    if (semanticIds) {
      query = query.in('lexical_id', semanticIds)
    } else if (group === 'nouns') {
      query = query.eq('part_of_speech', 'noun')
    } else if (group === 'verbs') {
      query = query.eq('part_of_speech', 'verb')
    } else if (group === 'adjectives') {
      query = query.eq('part_of_speech', 'adjective')
    }
  }

  if (search) {
    if (/\p{Script=Hebrew}/u.test(search)) {
      query = query.ilike('lemma', hebrewSearchPattern(search))
    } else if (/^H?\d+[A-Z]?$/i.test(search)) {
      const normalizedStrong = search.toUpperCase().startsWith('H') ? search.toUpperCase() : `H${search.toUpperCase()}`
      query = query.or(`lexical_id.ilike.%${normalizedStrong}%,strong_number.ilike.%${normalizedStrong}%`)
    } else {
      const spanishMatches = lexicalIdsForSpanishSearch(search)
      if (spanishMatches.length > 0) {
        query = query.in('lexical_id', spanishMatches)
      } else {
        query = query.ilike('display_gloss_es', `%${search}%`)
      }
    }
  }

  const { data, error, count } = await query
    .order('lexical_id', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[hebrew-word-catalog] No se pudo cargar el catálogo:', error)
    return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
  }

  const total = count ?? 0
  const items = ((data ?? []) as HebrewLexicalRow[]).map(mapRow)
  if (!search && semanticIds) {
    const position = new Map(semanticIds.map((id, index) => [id, index]))
    items.sort((a, b) => (position.get(a.lexicalId) ?? 999) - (position.get(b.lexicalId) ?? 999))
  }

  return {
    status: 'ok',
    page,
    pageSize,
    total,
    totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    search,
    group,
    items,
  }
}
