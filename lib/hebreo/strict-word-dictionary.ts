import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { normalizeLearningGroup, type HebrewLearningGroupId } from '@/lib/hebreo/word-learning'

const FINAL_SPANISH_STATUSES = ['verified_derived', 'manual_approved'] as const

type LexicalRow = {
  id: string
  lexical_id: string
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  display_gloss_es: string | null
}

type DerivedGlossRow = {
  lexical_entry_id: string
  display_gloss_es: string
  confidence: number | null
}

export type StrictDictionaryPage = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewLearningGroupId
  items: Array<{
    lexicalId: string
    strongNumber: null
    lemma: string
    partOfSpeech: string | null
    spanish: string
    pronunciation: string | null
    meaningNoteEs: null
  }>
}

function cleanSearch(value: string) {
  return value.replace(/[,%_()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function emptyPage(page: number, pageSize: number, search: string, group: HebrewLearningGroupId): StrictDictionaryPage {
  return { status: 'ok', page, pageSize, total: 0, totalPages: 0, search, group, items: [] }
}

export async function buscarPalabraEspanolaExactaEnDiccionario({
  page = 1,
  pageSize = 24,
  search,
  group: rawGroup,
}: {
  page?: number
  pageSize?: number
  search: string
  group?: string
}): Promise<StrictDictionaryPage> {
  const group = normalizeLearningGroup(rawGroup)
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const safePageSize = Math.min(Math.max(Number.isInteger(pageSize) ? pageSize : 24, 12), 60)
  const query = cleanSearch(search)
  if (!query) return emptyPage(safePage, safePageSize, query, group)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'sin-sesion', page: safePage, pageSize: safePageSize, total: 0, totalPages: 0, search: query, group, items: [] }

  const [{ data: directRows, error: directError }, { data: derivedRows, error: derivedError }] = await Promise.all([
    (supabase as any)
      .from('biblical_lexical_entries')
      .select('id, lexical_id, lemma, transliteration, part_of_speech, display_gloss_es')
      .eq('language', 'hebrew')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .ilike('display_gloss_es', query)
      .limit(120),
    (supabase as any)
      .from('biblical_hebrew_spanish_glosses')
      .select('lexical_entry_id, display_gloss_es, confidence')
      .in('status', FINAL_SPANISH_STATUSES)
      .ilike('display_gloss_es', query)
      .order('confidence', { ascending: false })
      .limit(120),
  ])

  if (directError || derivedError) {
    console.error('[hebrew-strict-dictionary] No se pudo consultar el diccionario:', directError ?? derivedError)
    return { status: 'no-disponible', page: safePage, pageSize: safePageSize, total: 0, totalPages: 0, search: query, group, items: [] }
  }

  const direct = (directRows ?? []) as LexicalRow[]
  const derived = (derivedRows ?? []) as DerivedGlossRow[]
  const derivedIds = derived.map(row => row.lexical_entry_id)
  let derivedLexical: LexicalRow[] = []

  if (derivedIds.length > 0) {
    const { data, error } = await (supabase as any)
      .from('biblical_lexical_entries')
      .select('id, lexical_id, lemma, transliteration, part_of_speech, display_gloss_es')
      .in('id', derivedIds)
      .eq('language', 'hebrew')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(120)
    if (error) {
      console.error('[hebrew-strict-dictionary] No se pudieron recuperar lemas:', error)
      return { status: 'no-disponible', page: safePage, pageSize: safePageSize, total: 0, totalPages: 0, search: query, group, items: [] }
    }
    derivedLexical = (data ?? []) as LexicalRow[]
  }

  const glossById = new Map<string, string>()
  for (const row of derived) if (!glossById.has(row.lexical_entry_id)) glossById.set(row.lexical_entry_id, row.display_gloss_es)
  for (const row of direct) if (row.display_gloss_es) glossById.set(row.id, row.display_gloss_es)

  const byId = new Map<string, LexicalRow>()
  for (const row of [...direct, ...derivedLexical]) byId.set(row.id, row)

  const rows = Array.from(byId.values())
    .filter(row => glossById.has(row.id))
    .sort((a, b) => a.lexical_id.localeCompare(b.lexical_id))

  const total = rows.length
  const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 0
  const offset = (safePage - 1) * safePageSize
  const items = rows.slice(offset, offset + safePageSize).map(row => ({
    lexicalId: row.lexical_id,
    strongNumber: null,
    lemma: row.lemma,
    partOfSpeech: row.part_of_speech,
    spanish: glossById.get(row.id) as string,
    pronunciation: row.transliteration,
    meaningNoteEs: null,
  }))

  return { status: 'ok', page: safePage, pageSize: safePageSize, total, totalPages, search: query, group, items }
}
