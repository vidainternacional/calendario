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
  id?: string
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  display_gloss_es: string | null
}

type SpanishVerseRef = { book_code: string; chapter: number; verse: number }
type OccurrenceRef = { lexical_entry_id: string; book_code: string; chapter: number; verse: number }

const SELECT_CATALOG = `
  lexical_id,
  strong_number,
  lemma,
  transliteration,
  part_of_speech,
  display_gloss_es
`

const RV1909_SOURCE_ID = 'b6fef01a-f304-4fd0-98aa-5fe070279946'
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
const HEBREW_LETTERS = /[\u05D0-\u05EA]/
const OT_BOOK_CODES = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']

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

function orReferences(rows: SpanishVerseRef[]) {
  return rows.map(row => `and(book_code.eq.${row.book_code},chapter.eq.${row.chapter},verse.eq.${row.verse})`).join(',')
}

function lexicalPriority(row: HebrewLexicalRow) {
  const preferred = new Set(['noun', 'verb', 'adjective', 'proper_name'])
  let score = preferred.has(row.part_of_speech ?? '') ? 10 : 0
  if ((row.lemma.match(/[\u05D0-\u05EA]/g) ?? []).length >= 2) score += 4
  if (row.display_gloss_es) score += 4
  return score
}

async function contextualSpanishSearch({
  supabase,
  search,
  page,
  pageSize,
  group,
}: {
  supabase: any
  search: string
  page: number
  pageSize: number
  group: HebrewLearningGroupId
}): Promise<HebrewWordCatalogPage | null> {
  const { data: verses, error: verseError } = await supabase
    .from('biblical_verse_texts')
    .select('book_code, chapter, verse')
    .eq('source_id', RV1909_SOURCE_ID)
    .eq('language', 'spanish')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('book_code', OT_BOOK_CODES)
    .ilike('original_text', `%${search}%`)
    .limit(80)

  if (verseError) {
    console.error('[hebrew-word-catalog] Falló búsqueda contextual RV1909:', verseError)
    return null
  }

  const refs = (verses ?? []) as SpanishVerseRef[]
  if (refs.length === 0) return { status: 'ok', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }

  const { data: occurrences, error: occurrenceError } = await supabase
    .from('biblical_word_occurrences')
    .select('lexical_entry_id, book_code, chapter, verse')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .or(orReferences(refs))
    .limit(1800)

  if (occurrenceError) {
    console.error('[hebrew-word-catalog] Falló recuperación de ocurrencias:', occurrenceError)
    return null
  }

  const frequency = new Map<string, number>()
  for (const row of (occurrences ?? []) as OccurrenceRef[]) {
    if (!row.lexical_entry_id) continue
    frequency.set(row.lexical_entry_id, (frequency.get(row.lexical_entry_id) ?? 0) + 1)
  }

  const ids = Array.from(frequency.keys())
  if (ids.length === 0) return { status: 'ok', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }

  const { data: lexicalRows, error: lexicalError } = await supabase
    .from('biblical_lexical_entries')
    .select(`id, ${SELECT_CATALOG}`)
    .in('id', ids)
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (lexicalError) {
    console.error('[hebrew-word-catalog] Falló resolución contextual:', lexicalError)
    return null
  }

  const ranked = ((lexicalRows ?? []) as HebrewLexicalRow[])
    .filter(row => HEBREW_LETTERS.test(row.lemma))
    .sort((a, b) => {
      const frequencyDiff = (frequency.get(b.id ?? '') ?? 0) - (frequency.get(a.id ?? '') ?? 0)
      if (frequencyDiff !== 0) return frequencyDiff
      return lexicalPriority(b) - lexicalPriority(a)
    })

  const offset = (page - 1) * pageSize
  const slice = ranked.slice(offset, offset + pageSize)
  const items = slice.map(row => {
    const mapped = mapRow(row)
    if (mapped.spanish) return mapped
    return {
      ...mapped,
      spanish: `Relacionado con «${search}»`,
      meaningNoteEs: `Resultado contextual: esta palabra hebrea aparece en versículos donde la RV1909 contiene «${search}». No se presenta como equivalencia uno-a-uno hasta que exista una glosa española aprobada.`,
    }
  })

  const total = ranked.length
  return { status: 'ok', page, pageSize, total, totalPages: total > 0 ? Math.ceil(total / pageSize) : 0, search, group, items }
}

export async function listarCatalogoHebreoParaAprendizaje(request: HebrewWordCatalogRequest = {}): Promise<HebrewWordCatalogPage> {
  const page = normalizePage(request.page)
  const pageSize = normalizePageSize(request.pageSize)
  const search = normalizeSearch(request.search)
  const group = normalizeLearningGroup(request.group)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'sin-sesion', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }

  const offset = (page - 1) * pageSize
  const semanticIds = lexicalIdsForLearningGroup(group)
  let query = (supabase as any)
    .from('biblical_lexical_entries')
    .select(SELECT_CATALOG, { count: 'exact' })
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (!search) {
    if (semanticIds) query = query.in('lexical_id', semanticIds)
    else if (group === 'nouns') query = query.eq('part_of_speech', 'noun')
    else if (group === 'verbs') query = query.eq('part_of_speech', 'verb')
    else if (group === 'adjectives') query = query.eq('part_of_speech', 'adjective')
  }

  if (search) {
    if (/\p{Script=Hebrew}/u.test(search)) {
      query = query.ilike('lemma', hebrewSearchPattern(search))
    } else if (/^H?\d+[A-Z]?$/i.test(search)) {
      const normalizedStrong = search.toUpperCase().startsWith('H') ? search.toUpperCase() : `H${search.toUpperCase()}`
      query = query.or(`lexical_id.ilike.%${normalizedStrong}%,strong_number.ilike.%${normalizedStrong}%`)
    } else {
      const spanishMatches = lexicalIdsForSpanishSearch(search)
      if (spanishMatches.length > 0) query = query.in('lexical_id', spanishMatches)
      else query = query.ilike('display_gloss_es', `%${search}%`)
    }
  }

  const { data, error, count } = await query.order('lexical_id', { ascending: true }).range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[hebrew-word-catalog] No se pudo cargar el catálogo:', error)
    return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
  }

  const total = count ?? 0
  let items = ((data ?? []) as HebrewLexicalRow[]).map(mapRow)

  // Si la búsqueda española exacta no existe todavía en el léxico editorial,
  // ampliamos recuperación por contexto RV1909 sin afirmar traducción palabra-a-palabra.
  if (search && !/\p{Script=Hebrew}/u.test(search) && !/^H?\d+[A-Z]?$/i.test(search) && total === 0) {
    const contextual = await contextualSpanishSearch({ supabase, search, page, pageSize, group })
    if (contextual) return contextual
  }

  if (!search && semanticIds) {
    const position = new Map(semanticIds.map((id, index) => [id, index]))
    items = items.sort((a, b) => (position.get(a.lexicalId) ?? 999) - (position.get(b.lexicalId) ?? 999))
  }

  return { status: 'ok', page, pageSize, total, totalPages: total > 0 ? Math.ceil(total / pageSize) : 0, search, group, items }
}
