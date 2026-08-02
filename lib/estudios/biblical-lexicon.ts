import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type IdiomaLexicoBiblico = 'hebrew' | 'aramaic' | 'greek'
export type TipoGlosaLexica = 'source_translation' | 'editorial_translation' | 'editorial_summary'

export type FuenteLexicaBiblica = {
  slug: string
  name: string
  website: string | null
  licenseUrl: string | null
  licenseNotes: string | null
  provider: string
  providerRef: string
  providerVersion: string | null
  contentHash: string | null
  attribution: string
}

export type EntradaLexicaBiblica = {
  lexicalId: string
  strongNumber: string | null
  language: IdiomaLexicoBiblico
  lemma: string
  transliteration: string | null
  partOfSpeech: string | null
  sourceGloss: string | null
  displayGlossEs: string | null
  displayGlossKind: TipoGlosaLexica
  definition: string | null
  sourceLocator: string
  providerVersion: string | null
  contentHash: string | null
  metadata: Record<string, unknown>
}

export type OcurrenciaLexicaBiblica = {
  bookCode: string
  chapter: number
  verse: number
  wordIndex: number
  surfaceForm: string
  normalizedForm: string | null
  morphologyCode: string | null
  morphologySummary: string | null
  sourceLocator: string
  providerVersion: string | null
  contentHash: string | null
  metadata: Record<string, unknown>
  entry: EntradaLexicaBiblica
  source: FuenteLexicaBiblica
}

export type PaqueteLexicoBiblico = {
  version: string
  reference: {
    bookCode: string
    chapter: number
    verse: number
  }
  occurrences: OcurrenciaLexicaBiblica[]
}

export type SolicitudLexicoBiblico = {
  bookCode: string
  chapter: number
  verse: number
  limit?: number
}

type FuenteLexicaRow = {
  slug: string
  name: string
  website: string | null
  license_url: string | null
  license_notes: string | null
  provider: string
  provider_ref: string
  provider_version: string | null
  content_hash: string | null
  attribution: string
}

type EntradaLexicaRow = {
  lexical_id: string
  strong_number: string | null
  language: IdiomaLexicoBiblico
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
  source_gloss: string | null
  display_gloss_es: string | null
  display_gloss_kind: TipoGlosaLexica
  definition: string | null
  source_locator: string
  provider_version: string | null
  content_hash: string | null
  metadata: Record<string, unknown> | null
}

type OcurrenciaLexicaRow = {
  book_code: string
  chapter: number
  verse: number
  word_index: number
  surface_form: string
  normalized_form: string | null
  morphology_code: string | null
  morphology_summary: string | null
  source_locator: string
  provider_version: string | null
  content_hash: string | null
  metadata: Record<string, unknown> | null
  entry: EntradaLexicaRow | EntradaLexicaRow[]
  source: FuenteLexicaRow | FuenteLexicaRow[]
}

const SELECT_LEXICON = `
  book_code,
  chapter,
  verse,
  word_index,
  surface_form,
  normalized_form,
  morphology_code,
  morphology_summary,
  source_locator,
  provider_version,
  content_hash,
  metadata,
  entry:biblical_lexical_entries!biblical_word_occurrences_entry_source_fkey (
    lexical_id,
    strong_number,
    language,
    lemma,
    transliteration,
    part_of_speech,
    source_gloss,
    display_gloss_es,
    display_gloss_kind,
    definition,
    source_locator,
    provider_version,
    content_hash,
    metadata
  ),
  source:biblical_sources!biblical_word_occurrences_source_id_fkey (
    slug,
    name,
    website,
    license_url,
    license_notes,
    provider,
    provider_ref,
    provider_version,
    content_hash,
    attribution
  )
`

function normalizeBookCode(value: string) {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9]{2,8}$/.test(normalized) ? normalized : null
}

function normalizePositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0 ? value : null
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined || !Number.isInteger(value)) return 30
  return Math.min(Math.max(value, 1), 100)
}

function normalizeRelation<T>(value: T | T[]): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function mapOccurrence(row: OcurrenciaLexicaRow): OcurrenciaLexicaBiblica | null {
  const entry = normalizeRelation(row.entry)
  const source = normalizeRelation(row.source)
  if (!entry || !source) return null

  return {
    bookCode: row.book_code,
    chapter: row.chapter,
    verse: row.verse,
    wordIndex: row.word_index,
    surfaceForm: row.surface_form,
    normalizedForm: row.normalized_form,
    morphologyCode: row.morphology_code,
    morphologySummary: row.morphology_summary,
    sourceLocator: row.source_locator,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
    metadata: row.metadata ?? {},
    entry: {
      lexicalId: entry.lexical_id,
      strongNumber: entry.strong_number,
      language: entry.language,
      lemma: entry.lemma,
      transliteration: entry.transliteration,
      partOfSpeech: entry.part_of_speech,
      sourceGloss: entry.source_gloss,
      displayGlossEs: entry.display_gloss_es,
      displayGlossKind: entry.display_gloss_kind,
      definition: entry.definition,
      sourceLocator: entry.source_locator,
      providerVersion: entry.provider_version,
      contentHash: entry.content_hash,
      metadata: entry.metadata ?? {},
    },
    source: {
      slug: source.slug,
      name: source.name,
      website: source.website,
      licenseUrl: source.license_url,
      licenseNotes: source.license_notes,
      provider: source.provider,
      providerRef: source.provider_ref,
      providerVersion: source.provider_version,
      contentHash: source.content_hash,
      attribution: source.attribution,
    },
  }
}

function packageVersion(occurrences: OcurrenciaLexicaBiblica[]) {
  const fingerprint = occurrences.map((occurrence) => ({
    reference: `${occurrence.bookCode}.${occurrence.chapter}.${occurrence.verse}.${occurrence.wordIndex}`,
    lexicalId: occurrence.entry.lexicalId,
    occurrenceVersion: occurrence.providerVersion,
    occurrenceHash: occurrence.contentHash,
    entryVersion: occurrence.entry.providerVersion,
    entryHash: occurrence.entry.contentHash,
    sourceSlug: occurrence.source.slug,
    sourceVersion: occurrence.source.providerVersion,
    sourceHash: occurrence.source.contentHash,
  }))

  return createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex')
    .slice(0, 16)
}

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

export async function listarPalabrasBiblicasParaReferencia(
  request: SolicitudLexicoBiblico
): Promise<PaqueteLexicoBiblico> {
  const bookCode = normalizeBookCode(request.bookCode)
  const chapter = normalizePositiveInteger(request.chapter)
  const verse = normalizePositiveInteger(request.verse)
  const limit = normalizeLimit(request.limit)

  if (!bookCode || !chapter || !verse) {
    return {
      version: 'referencia-invalida',
      reference: {
        bookCode: bookCode ?? '',
        chapter: chapter ?? 0,
        verse: verse ?? 0,
      },
      occurrences: [],
    }
  }

  const supabase = await authenticatedClient()
  if (!supabase) {
    return {
      version: 'sin-sesion',
      reference: { bookCode, chapter, verse },
      occurrences: [],
    }
  }

  const { data, error } = await (supabase as any)
    .from('biblical_word_occurrences')
    .select(SELECT_LEXICON)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', bookCode)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .order('word_index', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[biblical-lexicon] No se pudo cargar el léxico:', error)
    return {
      version: 'no-disponible',
      reference: { bookCode, chapter, verse },
      occurrences: [],
    }
  }

  const occurrences = ((data ?? []) as OcurrenciaLexicaRow[])
    .map(mapOccurrence)
    .filter((occurrence): occurrence is OcurrenciaLexicaBiblica => occurrence !== null)

  return {
    version: packageVersion(occurrences),
    reference: { bookCode, chapter, verse },
    occurrences,
  }
}
