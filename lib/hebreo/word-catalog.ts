import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
  id: string
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  display_gloss_es: string | null
}

type SpanishVerseRef = { book_code: string; chapter: number; verse: number }
type OccurrenceRef = { lexical_entry_id: string; book_code: string; chapter: number; verse: number }
type SearchKind = 'spanish' | 'hebrew' | 'transliteration' | 'strong'
type RelationKind = 'lemma' | 'strong' | 'curated_spanish' | 'editorial_spanish' | 'transliteration' | 'inflected_form' | 'contextual'

type SearchResolutionRow = {
  lexical_entry_id: string
  relation_kind: RelationKind
  confidence: number
  evidence_count: number
}

type ResolutionCandidate = {
  row: HebrewLexicalRow
  relationKind: RelationKind
  confidence: number
  evidenceCount: number
  provenance: Record<string, unknown>
}

type OccurrenceWordCandidate = {
  lexical_entry_id: string
  surface_form: string
  normalized_form: string | null
  occurrence_transliteration?: string | null
  word_group_key: string | null
  morpheme_index: number
  token_kind: string
}

const SELECT_CATALOG = `
  id,
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
const COMMON_PREFIXES = new Set(['ו', 'ה', 'ב', 'כ', 'ל', 'מ', 'ש'])
const COMMON_SUFFIXES = ['יהם', 'יהן', 'יכם', 'יכן', 'ינו', 'נו', 'כם', 'כן', 'הם', 'הן', 'יו', 'יה', 'ך', 'י', 'ו', 'ה', 'ם', 'ן'] as const

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

function normalizeHebrewLetters(value: string) {
  return Array.from(value.normalize('NFD')).filter(character => HEBREW_LETTERS.test(character)).join('')
}

function normalizeLatinSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function normalizeLatinCompact(value: string) {
  return normalizeLatinSearch(value).replace(/\s+/g, '')
}

function hebrewSearchPattern(value: string) {
  const consonants = value.normalize('NFD').replace(HEBREW_MARKS, '').replace(/\s+/g, '')
  return consonants ? `%${Array.from(consonants).join('%')}%` : '%'
}

function latinSearchPattern(value: string) {
  const compact = normalizeLatinCompact(value)
  return compact ? `%${Array.from(compact).join('%')}%` : '%'
}

function normalizedSearchKey(search: string, kind: SearchKind) {
  if (kind === 'hebrew') return normalizeHebrewLetters(search).slice(0, 80)
  if (kind === 'strong') return (search.toUpperCase().startsWith('H') ? search.toUpperCase() : `H${search.toUpperCase()}`).slice(0, 80)
  if (kind === 'transliteration') return normalizeLatinCompact(search).slice(0, 80)
  return normalizeLatinSearch(search)
}

function emptyPage(page: number, pageSize: number, search: string, group: HebrewLearningGroupId): HebrewWordCatalogPage {
  return { status: 'ok', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
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

function pageFromRows({
  rows,
  page,
  pageSize,
  search,
  group,
  contextual,
}: {
  rows: HebrewLexicalRow[]
  page: number
  pageSize: number
  search: string
  group: HebrewLearningGroupId
  contextual?: Set<string>
}): HebrewWordCatalogPage {
  const offset = (page - 1) * pageSize
  const slice = rows.slice(offset, offset + pageSize)
  const items = slice.map(row => {
    const mapped = mapRow(row)
    if (!contextual?.has(row.id) || mapped.spanish) return mapped
    return {
      ...mapped,
      spanish: `Relacionado con «${search}»`,
      meaningNoteEs: `Resultado contextual: esta palabra hebrea aparece en versículos donde la RV1909 contiene «${search}». No se presenta como equivalencia uno-a-uno hasta que exista una glosa española aprobada.`,
    }
  })
  const total = rows.length
  return { status: 'ok', page, pageSize, total, totalPages: total > 0 ? Math.ceil(total / pageSize) : 0, search, group, items }
}

async function loadLexicalRowsByIds(supabase: any, ids: string[]) {
  if (ids.length === 0) return [] as HebrewLexicalRow[]
  const { data, error } = await supabase
    .from('biblical_lexical_entries')
    .select(SELECT_CATALOG)
    .in('id', ids)
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (error) {
    console.error('[hebrew-word-catalog] Falló recuperación de entradas léxicas:', error)
    return [] as HebrewLexicalRow[]
  }

  return (data ?? []) as HebrewLexicalRow[]
}

async function persistSearchResolutions({
  search,
  searchKind,
  candidates,
}: {
  search: string
  searchKind: SearchKind
  candidates: ResolutionCandidate[]
}) {
  const searchKey = normalizedSearchKey(search, searchKind)
  if (!searchKey || candidates.length === 0) return

  const payload = candidates
    .filter(candidate => candidate.row.id)
    .map(candidate => ({
      search_key: searchKey,
      search_kind: searchKind,
      lexical_entry_id: candidate.row.id,
      relation_kind: candidate.relationKind,
      confidence: Math.max(0, Math.min(100, Math.round(candidate.confidence))),
      evidence_count: Math.max(0, Math.round(candidate.evidenceCount)),
      provenance: candidate.provenance,
      updated_at: new Date().toISOString(),
    }))

  if (payload.length === 0) return

  try {
    const service = createServiceClient()
    const { error } = await service
      .from('biblical_hebrew_search_resolutions')
      .upsert(payload, { onConflict: 'search_key,search_kind,lexical_entry_id,relation_kind' })
    if (error) console.error('[hebrew-word-catalog] No se pudo guardar resolución derivada:', error)
  } catch (error) {
    console.error('[hebrew-word-catalog] Service role no disponible para resolución derivada:', error)
  }
}

async function cachedResolutionSearch({
  supabase,
  search,
  searchKind,
  page,
  pageSize,
  group,
}: {
  supabase: any
  search: string
  searchKind: SearchKind
  page: number
  pageSize: number
  group: HebrewLearningGroupId
}): Promise<HebrewWordCatalogPage | null> {
  const searchKey = normalizedSearchKey(search, searchKind)
  if (!searchKey) return null

  const { data, error } = await supabase
    .from('biblical_hebrew_search_resolutions')
    .select('lexical_entry_id, relation_kind, confidence, evidence_count')
    .eq('search_key', searchKey)
    .eq('search_kind', searchKind)
    .order('confidence', { ascending: false })
    .order('evidence_count', { ascending: false })
    .limit(120)

  if (error) {
    console.error('[hebrew-word-catalog] No se pudo leer índice derivado:', error)
    return null
  }

  const resolutions = (data ?? []) as SearchResolutionRow[]
  if (resolutions.length === 0) return null

  const bestById = new Map<string, SearchResolutionRow>()
  for (const resolution of resolutions) {
    if (!bestById.has(resolution.lexical_entry_id)) bestById.set(resolution.lexical_entry_id, resolution)
  }

  const ids = Array.from(bestById.keys())
  const lexicalRows = await loadLexicalRowsByIds(supabase, ids)
  if (lexicalRows.length === 0) return null

  const position = new Map(ids.map((id, index) => [id, index]))
  const ranked = lexicalRows.sort((a, b) => (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999))
  const contextual = new Set(
    Array.from(bestById.entries())
      .filter(([, resolution]) => resolution.relation_kind === 'contextual')
      .map(([id]) => id),
  )

  return pageFromRows({ rows: ranked, page, pageSize, search, group, contextual })
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
  if (refs.length === 0) return emptyPage(page, pageSize, search, group)

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
  if (ids.length === 0) return emptyPage(page, pageSize, search, group)

  const lexicalRows = await loadLexicalRowsByIds(supabase, ids)
  const ranked = lexicalRows
    .filter(row => HEBREW_LETTERS.test(row.lemma))
    .sort((a, b) => {
      const frequencyDiff = (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0)
      if (frequencyDiff !== 0) return frequencyDiff
      return lexicalPriority(b) - lexicalPriority(a)
    })

  const reusable = ranked
    .filter(row => (frequency.get(row.id) ?? 0) >= 2)
    .slice(0, 80)
    .map(row => ({
      row,
      relationKind: 'contextual' as const,
      confidence: Math.min(85, 55 + Math.min(frequency.get(row.id) ?? 0, 6) * 5),
      evidenceCount: frequency.get(row.id) ?? 0,
      provenance: {
        resolver: 'rv1909-context-v1',
        translation_source_id: RV1909_SOURCE_ID,
        verse_matches: refs.length,
      },
    }))
  await persistSearchResolutions({ search, searchKind: 'spanish', candidates: reusable })

  const contextual = new Set(ranked.map(row => row.id))
  return pageFromRows({ rows: ranked, page, pageSize, search, group, contextual })
}

function buildHebrewCoreCandidates(search: string) {
  const initial = normalizeHebrewLetters(search)
  if (!initial) return []

  const seen = new Set<string>([initial])
  let frontier = [initial]

  for (let depth = 0; depth < 4; depth += 1) {
    const next: string[] = []
    for (const candidate of frontier) {
      if (candidate.length > 2 && COMMON_PREFIXES.has(candidate[0])) {
        const stripped = candidate.slice(1)
        if (!seen.has(stripped)) {
          seen.add(stripped)
          next.push(stripped)
        }
      }
      for (const suffix of COMMON_SUFFIXES) {
        if (candidate.length - suffix.length < 2 || !candidate.endsWith(suffix)) continue
        const stripped = candidate.slice(0, -suffix.length)
        if (!seen.has(stripped)) {
          seen.add(stripped)
          next.push(stripped)
        }
      }
    }
    frontier = next
    if (frontier.length === 0) break
  }

  return Array.from(seen).filter(candidate => candidate.length >= 2).sort((a, b) => b.length - a.length).slice(0, 16)
}

async function inflectedHebrewSearch({
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
}): Promise<HebrewWordCatalogPage> {
  const target = normalizeHebrewLetters(search)
  const cores = buildHebrewCoreCandidates(search)
  if (!target || cores.length === 0) return emptyPage(page, pageSize, search, group)

  const { data: candidates, error: candidateError } = await supabase
    .from('biblical_word_occurrences')
    .select('lexical_entry_id, surface_form, normalized_form, word_group_key, morpheme_index, token_kind')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('token_kind', 'word')
    .in('book_code', OT_BOOK_CODES)
    .or(cores.map(core => `surface_form.ilike.${hebrewSearchPattern(core)}`).join(','))
    .limit(500)

  if (candidateError) {
    console.error('[hebrew-word-catalog] Falló búsqueda de formas flexionadas:', candidateError)
    return emptyPage(page, pageSize, search, group)
  }

  const coreSet = new Set(cores)
  const candidateRows = ((candidates ?? []) as OccurrenceWordCandidate[])
    .filter(row => coreSet.has(normalizeHebrewLetters(row.surface_form)) || coreSet.has(normalizeHebrewLetters(row.normalized_form ?? '')))
  const groupKeys = Array.from(new Set(candidateRows.map(row => row.word_group_key).filter((value): value is string => Boolean(value)))).slice(0, 160)
  if (groupKeys.length === 0) return emptyPage(page, pageSize, search, group)

  const { data: morphemes, error: groupError } = await supabase
    .from('biblical_word_occurrences')
    .select('lexical_entry_id, surface_form, normalized_form, word_group_key, morpheme_index, token_kind')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('word_group_key', groupKeys)
    .order('morpheme_index', { ascending: true })

  if (groupError) {
    console.error('[hebrew-word-catalog] Falló reconstrucción de palabra flexionada:', groupError)
    return emptyPage(page, pageSize, search, group)
  }

  const byGroup = new Map<string, OccurrenceWordCandidate[]>()
  for (const row of (morphemes ?? []) as OccurrenceWordCandidate[]) {
    if (!row.word_group_key) continue
    const current = byGroup.get(row.word_group_key) ?? []
    current.push(row)
    byGroup.set(row.word_group_key, current)
  }

  const frequency = new Map<string, number>()
  for (const rows of byGroup.values()) {
    const reconstructed = normalizeHebrewLetters(
      rows.sort((a, b) => a.morpheme_index - b.morpheme_index).map(row => row.surface_form).join(''),
    )
    if (reconstructed !== target) continue
    for (const row of rows) {
      if (row.token_kind !== 'word' || !row.lexical_entry_id) continue
      frequency.set(row.lexical_entry_id, (frequency.get(row.lexical_entry_id) ?? 0) + 1)
    }
  }

  const ids = Array.from(frequency.keys())
  if (ids.length === 0) return emptyPage(page, pageSize, search, group)

  const lexicalRows = await loadLexicalRowsByIds(supabase, ids)
  const ranked = lexicalRows.sort((a, b) => (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0))

  await persistSearchResolutions({
    search,
    searchKind: 'hebrew',
    candidates: ranked.map(row => ({
      row,
      relationKind: 'inflected_form',
      confidence: 97,
      evidenceCount: frequency.get(row.id) ?? 1,
      provenance: { resolver: 'occurrence-word-group-v1', exact_reconstructed_surface: true },
    })),
  })

  return pageFromRows({ rows: ranked, page, pageSize, search, group })
}

async function transliterationSearch({
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
}): Promise<HebrewWordCatalogPage> {
  const key = normalizeLatinCompact(search)
  if (!key) return emptyPage(page, pageSize, search, group)

  const { data, error } = await supabase
    .from('biblical_word_occurrences')
    .select('lexical_entry_id, occurrence_transliteration')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('token_kind', 'word')
    .in('book_code', OT_BOOK_CODES)
    .ilike('occurrence_transliteration', latinSearchPattern(search))
    .limit(800)

  if (error) {
    console.error('[hebrew-word-catalog] Falló búsqueda por transliteración:', error)
    return emptyPage(page, pageSize, search, group)
  }

  const frequency = new Map<string, number>()
  for (const row of (data ?? []) as { lexical_entry_id: string; occurrence_transliteration: string | null }[]) {
    if (!row.lexical_entry_id || normalizeLatinCompact(row.occurrence_transliteration ?? '') !== key) continue
    frequency.set(row.lexical_entry_id, (frequency.get(row.lexical_entry_id) ?? 0) + 1)
  }

  const ids = Array.from(frequency.keys())
  if (ids.length === 0) return emptyPage(page, pageSize, search, group)

  const lexicalRows = await loadLexicalRowsByIds(supabase, ids)
  const ranked = lexicalRows.sort((a, b) => (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0))

  await persistSearchResolutions({
    search,
    searchKind: 'transliteration',
    candidates: ranked.map(row => ({
      row,
      relationKind: 'transliteration',
      confidence: 95,
      evidenceCount: frequency.get(row.id) ?? 1,
      provenance: { resolver: 'occurrence-transliteration-v1', exact_normalized_transliteration: true },
    })),
  })

  return pageFromRows({ rows: ranked, page, pageSize, search, group })
}

async function executeDirectQuery({
  query,
  page,
  pageSize,
  search,
  group,
}: {
  query: any
  page: number
  pageSize: number
  search: string
  group: HebrewLearningGroupId
}) {
  const offset = (page - 1) * pageSize
  const { data, error, count } = await query.order('lexical_id', { ascending: true }).range(offset, offset + pageSize - 1)
  if (error) {
    console.error('[hebrew-word-catalog] No se pudo cargar el catálogo:', error)
    return { page: { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] } as HebrewWordCatalogPage, rows: [] as HebrewLexicalRow[], total: 0 }
  }
  const rows = (data ?? []) as HebrewLexicalRow[]
  const total = count ?? 0
  return {
    page: { status: 'ok', page, pageSize, total, totalPages: total > 0 ? Math.ceil(total / pageSize) : 0, search, group, items: rows.map(mapRow) } as HebrewWordCatalogPage,
    rows,
    total,
  }
}

export async function listarCatalogoHebreoParaAprendizaje(request: HebrewWordCatalogRequest = {}): Promise<HebrewWordCatalogPage> {
  const page = normalizePage(request.page)
  const pageSize = normalizePageSize(request.pageSize)
  const search = normalizeSearch(request.search)
  const group = normalizeLearningGroup(request.group)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'sin-sesion', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }

  const semanticIds = lexicalIdsForLearningGroup(group)

  if (!search) {
    const offset = (page - 1) * pageSize
    let query = (supabase as any)
      .from('biblical_lexical_entries')
      .select(SELECT_CATALOG, { count: 'exact' })
      .eq('language', 'hebrew')
      .eq('enabled', true)
      .eq('review_status', 'approved')

    if (semanticIds) query = query.in('lexical_id', semanticIds)
    else if (group === 'nouns') query = query.eq('part_of_speech', 'noun')
    else if (group === 'verbs') query = query.eq('part_of_speech', 'verb')
    else if (group === 'adjectives') query = query.eq('part_of_speech', 'adjective')

    const { data, error, count } = await query.order('lexical_id', { ascending: true }).range(offset, offset + pageSize - 1)
    if (error) {
      console.error('[hebrew-word-catalog] No se pudo cargar el catálogo:', error)
      return { status: 'no-disponible', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
    }

    let items = ((data ?? []) as HebrewLexicalRow[]).map(mapRow)
    if (semanticIds) {
      const position = new Map(semanticIds.map((id, index) => [id, index]))
      items = items.sort((a, b) => (position.get(a.lexicalId) ?? 999) - (position.get(b.lexicalId) ?? 999))
    }
    const total = count ?? 0
    return { status: 'ok', page, pageSize, total, totalPages: total > 0 ? Math.ceil(total / pageSize) : 0, search, group, items }
  }

  if (/\p{Script=Hebrew}/u.test(search)) {
    const direct = await executeDirectQuery({
      query: (supabase as any)
        .from('biblical_lexical_entries')
        .select(SELECT_CATALOG, { count: 'exact' })
        .eq('language', 'hebrew')
        .eq('enabled', true)
        .eq('review_status', 'approved')
        .ilike('lemma', hebrewSearchPattern(search)),
      page,
      pageSize,
      search,
      group,
    })
    if (direct.page.status === 'no-disponible' || direct.total > 0) {
      if (direct.total > 0) await persistSearchResolutions({
        search,
        searchKind: 'hebrew',
        candidates: direct.rows.map(row => ({ row, relationKind: 'lemma', confidence: 100, evidenceCount: 1, provenance: { resolver: 'approved-lemma-v1' } })),
      })
      return direct.page
    }

    const cached = await cachedResolutionSearch({ supabase, search, searchKind: 'hebrew', page, pageSize, group })
    if (cached) return cached
    return inflectedHebrewSearch({ supabase, search, page, pageSize, group })
  }

  if (/^H?\d+[A-Z]?$/i.test(search)) {
    const normalizedStrong = normalizedSearchKey(search, 'strong')
    const direct = await executeDirectQuery({
      query: (supabase as any)
        .from('biblical_lexical_entries')
        .select(SELECT_CATALOG, { count: 'exact' })
        .eq('language', 'hebrew')
        .eq('enabled', true)
        .eq('review_status', 'approved')
        .or(`lexical_id.ilike.%${normalizedStrong}%,strong_number.ilike.%${normalizedStrong}%`),
      page,
      pageSize,
      search,
      group,
    })
    if (direct.total > 0) await persistSearchResolutions({
      search,
      searchKind: 'strong',
      candidates: direct.rows.map(row => ({ row, relationKind: 'strong', confidence: 100, evidenceCount: 1, provenance: { resolver: 'approved-strong-v1' } })),
    })
    return direct.page
  }

  const spanishMatches = lexicalIdsForSpanishSearch(search)
  const spanishDirect = await executeDirectQuery({
    query: spanishMatches.length > 0
      ? (supabase as any)
          .from('biblical_lexical_entries')
          .select(SELECT_CATALOG, { count: 'exact' })
          .eq('language', 'hebrew')
          .eq('enabled', true)
          .eq('review_status', 'approved')
          .in('lexical_id', spanishMatches)
      : (supabase as any)
          .from('biblical_lexical_entries')
          .select(SELECT_CATALOG, { count: 'exact' })
          .eq('language', 'hebrew')
          .eq('enabled', true)
          .eq('review_status', 'approved')
          .ilike('display_gloss_es', `%${search}%`),
    page,
    pageSize,
    search,
    group,
  })

  if (spanishDirect.page.status === 'no-disponible' || spanishDirect.total > 0) {
    if (spanishDirect.total > 0) await persistSearchResolutions({
      search,
      searchKind: 'spanish',
      candidates: spanishDirect.rows.map(row => ({
        row,
        relationKind: spanishMatches.length > 0 ? 'curated_spanish' : 'editorial_spanish',
        confidence: 100,
        evidenceCount: 1,
        provenance: { resolver: spanishMatches.length > 0 ? 'pedagogical-spanish-v1' : 'approved-editorial-spanish-v1' },
      })),
    })
    return spanishDirect.page
  }

  const cachedSpanish = await cachedResolutionSearch({ supabase, search, searchKind: 'spanish', page, pageSize, group })
  if (cachedSpanish) return cachedSpanish

  const contextual = await contextualSpanishSearch({ supabase, search, page, pageSize, group })
  if (contextual && contextual.total > 0) return contextual

  const cachedTransliteration = await cachedResolutionSearch({ supabase, search, searchKind: 'transliteration', page, pageSize, group })
  if (cachedTransliteration) return cachedTransliteration

  const transliteration = await transliterationSearch({ supabase, search, page, pageSize, group })
  if (transliteration.total > 0) return transliteration

  return contextual ?? emptyPage(page, pageSize, search, group)
}
