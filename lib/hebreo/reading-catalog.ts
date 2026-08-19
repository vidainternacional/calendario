import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type HebrewReadingGroup = 'starter' | 'short' | 'medium' | 'long' | 'all'

export type HebrewReadingItem = {
  id: string
  bookCode: string
  chapter: number
  verse: number
  reference: string
  hebrew: string
  transliteration: string | null
  spanish: string | null
  tokenCount: number
}

export type HebrewReadingPage = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewReadingGroup
  items: HebrewReadingItem[]
}

export type HebrewReadingRequest = {
  page?: number
  pageSize?: number
  search?: string
  group?: string
}

type VerseRow = {
  book_code: string
  chapter: number
  verse: number
  original_text: string
  transliteration: string | null
  token_count: number
}

type SpanishRow = {
  book_code: string
  chapter: number
  verse: number
  original_text: string
}

const RV1909_SOURCE_ID = 'b6fef01a-f304-4fd0-98aa-5fe070279946'
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g

const BOOK_NAMES: Record<string, string> = {
  GEN: 'Génesis', EXO: 'Éxodo', LEV: 'Levítico', NUM: 'Números', DEU: 'Deuteronomio',
  JOS: 'Josué', JDG: 'Jueces', RUT: 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reyes', '2KI': '2 Reyes', '1CH': '1 Crónicas', '2CH': '2 Crónicas',
  EZR: 'Esdras', NEH: 'Nehemías', EST: 'Ester', JOB: 'Job', PSA: 'Salmos', PRO: 'Proverbios',
  ECC: 'Eclesiastés', SNG: 'Cantares', ISA: 'Isaías', JER: 'Jeremías', LAM: 'Lamentaciones',
  EZK: 'Ezequiel', DAN: 'Daniel', HOS: 'Oseas', JOL: 'Joel', AMO: 'Amós', OBA: 'Abdías',
  JON: 'Jonás', MIC: 'Miqueas', NAM: 'Nahúm', HAB: 'Habacuc', ZEP: 'Sofonías', HAG: 'Hageo',
  ZEC: 'Zacarías', MAL: 'Malaquías',
}

const OT_BOOK_CODES = Object.keys(BOOK_NAMES)

const STARTER_REFERENCES = [
  ['GEN', 1, 1], ['GEN', 1, 3], ['EXO', 20, 13], ['EXO', 20, 14], ['EXO', 20, 15],
  ['NUM', 6, 24], ['DEU', 6, 4], ['JOS', 1, 9], ['PSA', 23, 1], ['PSA', 119, 105],
  ['PRO', 1, 7], ['ECC', 3, 1], ['ISA', 40, 8], ['HAB', 2, 4], ['MIC', 6, 8],
] as const

function normalizeGroup(value: string | undefined): HebrewReadingGroup {
  return ['starter', 'short', 'medium', 'long', 'all'].includes(value ?? '') ? value as HebrewReadingGroup : 'starter'
}

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value as number : 1
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value)) return 12
  return Math.min(Math.max(value as number, 6), 30)
}

function normalizeSearch(value: string | undefined) {
  return (value ?? '').replace(/[,%_()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function hebrewSearchPattern(value: string) {
  const consonants = value.normalize('NFD').replace(HEBREW_MARKS, '').replace(/\s+/g, '')
  return consonants ? `%${Array.from(consonants).join('%')}%` : '%'
}

function refKey(bookCode: string, chapter: number, verse: number) {
  return `${bookCode}.${chapter}.${verse}`
}

function referenceLabel(bookCode: string, chapter: number, verse: number) {
  return `${BOOK_NAMES[bookCode] ?? bookCode} ${chapter}:${verse}`
}

function orReferences(rows: Array<{ book_code: string; chapter: number; verse: number }>) {
  return rows.map(row => `and(book_code.eq.${row.book_code},chapter.eq.${row.chapter},verse.eq.${row.verse})`).join(',')
}

function starterFilter() {
  return STARTER_REFERENCES.map(([bookCode, chapter, verse]) => `and(book_code.eq.${bookCode},chapter.eq.${chapter},verse.eq.${verse})`).join(',')
}

async function pairSpanish(supabase: any, rows: VerseRow[]) {
  if (rows.length === 0) return new Map<string, string>()
  const { data, error } = await supabase
    .from('biblical_verse_texts')
    .select('book_code, chapter, verse, original_text')
    .eq('source_id', RV1909_SOURCE_ID)
    .eq('language', 'spanish')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .or(orReferences(rows))

  if (error) {
    console.error('[hebrew-reading] No se pudo cargar RV1909:', error)
    return new Map<string, string>()
  }

  return new Map(((data ?? []) as SpanishRow[]).map(row => [refKey(row.book_code, row.chapter, row.verse), row.original_text]))
}

function mapRows(rows: VerseRow[], spanish: Map<string, string>): HebrewReadingItem[] {
  return rows.map(row => ({
    id: refKey(row.book_code, row.chapter, row.verse),
    bookCode: row.book_code,
    chapter: row.chapter,
    verse: row.verse,
    reference: referenceLabel(row.book_code, row.chapter, row.verse),
    hebrew: row.original_text,
    transliteration: row.transliteration,
    spanish: spanish.get(refKey(row.book_code, row.chapter, row.verse)) ?? null,
    tokenCount: row.token_count,
  }))
}

export async function listarLecturasHebreas(request: HebrewReadingRequest = {}): Promise<HebrewReadingPage> {
  const page = normalizePage(request.page)
  const pageSize = normalizePageSize(request.pageSize)
  const search = normalizeSearch(request.search)
  const group = normalizeGroup(request.group)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'sin-sesion', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }

  const offset = (page - 1) * pageSize

  // La búsqueda en español usa directamente la RV1909 aprobada y después recupera
  // el mismo versículo en el corpus hebreo; no fabrica una traducción paralela.
  if (search && !/\p{Script=Hebrew}/u.test(search)) {
    const { data: spanishMatches, error: spanishError, count } = await (supabase as any)
      .from('biblical_verse_texts')
      .select('book_code, chapter, verse, original_text', { count: 'exact' })
      .eq('source_id', RV1909_SOURCE_ID)
      .eq('language', 'spanish')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .in('book_code', OT_BOOK_CODES)
      .ilike('original_text', `%${search}%`)
      .order('book_code', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (spanishError) {
      console.error('[hebrew-reading] Falló búsqueda RV1909:', spanishError)
      return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
    }

    const refs = (spanishMatches ?? []) as SpanishRow[]
    if (refs.length === 0) return { status: 'ok', page, pageSize, total: count ?? 0, totalPages: 0, search, group, items: [] }

    const { data: hebrewRows, error: hebrewError } = await (supabase as any)
      .from('biblical_verse_texts')
      .select('book_code, chapter, verse, original_text, transliteration, token_count')
      .eq('language', 'hebrew')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .or(orReferences(refs))

    if (hebrewError) {
      console.error('[hebrew-reading] Falló correspondencia hebrea:', hebrewError)
      return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
    }

    const hebrewByRef = new Map(((hebrewRows ?? []) as VerseRow[]).map(row => [refKey(row.book_code, row.chapter, row.verse), row]))
    const ordered = refs.map(ref => hebrewByRef.get(refKey(ref.book_code, ref.chapter, ref.verse))).filter((row): row is VerseRow => Boolean(row))
    const spanish = new Map(refs.map(row => [refKey(row.book_code, row.chapter, row.verse), row.original_text]))
    const total = count ?? 0
    return { status: 'ok', page, pageSize, total, totalPages: total ? Math.ceil(total / pageSize) : 0, search, group, items: mapRows(ordered, spanish) }
  }

  let query = (supabase as any)
    .from('biblical_verse_texts')
    .select('book_code, chapter, verse, original_text, transliteration, token_count', { count: 'exact' })
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (search) query = query.ilike('original_text', hebrewSearchPattern(search))
  else if (group === 'short') query = query.lte('token_count', 5)
  else if (group === 'medium') query = query.gte('token_count', 6).lte('token_count', 10)
  else if (group === 'long') query = query.gte('token_count', 11)

  if (!search && group === 'starter') {
    const { data, error } = await query.or(starterFilter())
    if (error) {
      console.error('[hebrew-reading] No se pudieron cargar lecturas iniciales:', error)
      return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
    }
    const rows = (data ?? []) as VerseRow[]
    const position = new Map(STARTER_REFERENCES.map(([bookCode, chapter, verse], index) => [refKey(bookCode, chapter, verse), index]))
    rows.sort((a, b) => (position.get(refKey(a.book_code, a.chapter, a.verse)) ?? 999) - (position.get(refKey(b.book_code, b.chapter, b.verse)) ?? 999))
    const total = rows.length
    const slice = rows.slice(offset, offset + pageSize)
    const spanish = await pairSpanish(supabase, slice)
    return { status: 'ok', page, pageSize, total, totalPages: total ? Math.ceil(total / pageSize) : 0, search, group, items: mapRows(slice, spanish) }
  }

  const { data, error, count } = await query
    .order('book_code', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[hebrew-reading] No se pudo cargar catálogo de lectura:', error)
    return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
  }

  const rows = (data ?? []) as VerseRow[]
  const spanish = await pairSpanish(supabase, rows)
  const total = count ?? 0
  return { status: 'ok', page, pageSize, total, totalPages: total ? Math.ceil(total / pageSize) : 0, search, group, items: mapRows(rows, spanish) }
}
