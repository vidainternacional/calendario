import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type TipoRecursoBiblioteca =
  | 'commentary'
  | 'study_note'
  | 'dictionary'
  | 'article'
  | 'manuscript'
  | 'cross_reference_dataset'
  | 'other'

export type TipoContenidoBiblioteca =
  | 'source_excerpt'
  | 'editorial_summary'
  | 'inference'

export type RecursoBibliotecaBiblica = {
  slug: string
  title: string
  author: string | null
  itemType: TipoRecursoBiblioteca
  language: string
  publicationYear: number | null
  edition: string | null
  description: string | null
  sourceLocator: string
  licenseStatus: 'verified' | 'varies_by_item'
  providerVersion: string | null
  contentHash: string | null
  source: {
    slug: string
    name: string
    attribution: string
    website: string | null
    licenseUrl: string | null
    licenseNotes: string | null
  }
}

export type FragmentoBibliotecaBiblica = {
  slug: string
  title: string
  content: string
  contentKind: TipoContenidoBiblioteca
  language: string
  bookCode: string | null
  chapterStart: number | null
  verseStart: number | null
  chapterEnd: number | null
  verseEnd: number | null
  referenceLabel: string | null
  topics: string[]
  sourceLocator: string
  providerVersion: string | null
  contentHash: string | null
  item: RecursoBibliotecaBiblica
}

export type PaqueteBibliotecaBiblica = {
  version: string
  reference: {
    bookCode: string
    chapter: number
    verse: number | null
  }
  fragments: FragmentoBibliotecaBiblica[]
}

type SourceRow = {
  slug: string
  name: string
  attribution: string
  website: string | null
  license_url: string | null
  license_notes: string | null
}

type ItemRow = {
  slug: string
  title: string
  author: string | null
  item_type: TipoRecursoBiblioteca
  language: string
  publication_year: number | null
  edition: string | null
  description: string | null
  source_locator: string
  license_status: 'verified' | 'varies_by_item'
  provider_version: string | null
  content_hash: string | null
  source: SourceRow | SourceRow[]
}

type FragmentRow = {
  slug: string
  title: string
  content: string
  content_kind: TipoContenidoBiblioteca
  language: string
  book_code: string | null
  chapter_start: number | null
  verse_start: number | null
  chapter_end: number | null
  verse_end: number | null
  reference_label: string | null
  topics: string[] | null
  source_locator: string
  provider_version: string | null
  content_hash: string | null
  item: ItemRow | ItemRow[]
}

const SELECT_ITEMS = `
  slug,
  title,
  author,
  item_type,
  language,
  publication_year,
  edition,
  description,
  source_locator,
  license_status,
  provider_version,
  content_hash,
  source:biblical_sources!biblical_library_items_source_id_fkey (
    slug,
    name,
    attribution,
    website,
    license_url,
    license_notes
  )
`

const SELECT_FRAGMENTS = `
  slug,
  title,
  content,
  content_kind,
  language,
  book_code,
  chapter_start,
  verse_start,
  chapter_end,
  verse_end,
  reference_label,
  topics,
  source_locator,
  provider_version,
  content_hash,
  item:biblical_library_items!biblical_library_fragments_item_source_fkey (
    ${SELECT_ITEMS}
  )
`

function one<T>(value: T | T[]): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

function mapItem(row: ItemRow): RecursoBibliotecaBiblica | null {
  const source = one(row.source)
  if (!source) return null

  return {
    slug: row.slug,
    title: row.title,
    author: row.author,
    itemType: row.item_type,
    language: row.language,
    publicationYear: row.publication_year,
    edition: row.edition,
    description: row.description,
    sourceLocator: row.source_locator,
    licenseStatus: row.license_status,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
    source: {
      slug: source.slug,
      name: source.name,
      attribution: source.attribution,
      website: source.website,
      licenseUrl: source.license_url,
      licenseNotes: source.license_notes,
    },
  }
}

function mapFragment(row: FragmentRow): FragmentoBibliotecaBiblica | null {
  const rawItem = one(row.item)
  const item = rawItem ? mapItem(rawItem) : null
  if (!item) return null

  return {
    slug: row.slug,
    title: row.title,
    content: row.content,
    contentKind: row.content_kind,
    language: row.language,
    bookCode: row.book_code,
    chapterStart: row.chapter_start,
    verseStart: row.verse_start,
    chapterEnd: row.chapter_end,
    verseEnd: row.verse_end,
    referenceLabel: row.reference_label,
    topics: row.topics ?? [],
    sourceLocator: row.source_locator,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
    item,
  }
}

function normalizeBookCode(value: string) {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9]{2,8}$/.test(normalized) ? normalized : null
}

function normalizePositiveInteger(value: number | null | undefined) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null
}

function includesReference(row: FragmentRow, chapter: number, verse: number | null) {
  if (row.chapter_start === null || row.chapter_end === null) return false
  if (chapter < row.chapter_start || chapter > row.chapter_end) return false
  if (verse === null) return true
  if (chapter === row.chapter_start && row.verse_start !== null && verse < row.verse_start) return false
  if (chapter === row.chapter_end && row.verse_end !== null && verse > row.verse_end) return false
  return true
}

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

function packageVersion(fragments: FragmentoBibliotecaBiblica[]) {
  const fingerprint = fragments.map((fragment) => ({
    slug: fragment.slug,
    hash: fragment.contentHash,
    version: fragment.providerVersion,
    item: fragment.item.slug,
    itemHash: fragment.item.contentHash,
    source: fragment.item.source.slug,
  }))

  return createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex')
    .slice(0, 16)
}

export async function listarRecursosBibliotecaAprobados(limit = 50): Promise<RecursoBibliotecaBiblica[]> {
  const supabase = await authenticatedClient()
  if (!supabase) return []

  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 50
  const { data, error } = await (supabase as any)
    .from('biblical_library_items')
    .select(SELECT_ITEMS)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('license_status', ['verified', 'varies_by_item'])
    .order('title', { ascending: true })
    .limit(safeLimit)

  if (error) {
    console.error('[biblical-library] No se pudieron cargar los recursos:', error)
    return []
  }

  return ((data ?? []) as ItemRow[])
    .map(mapItem)
    .filter((item): item is RecursoBibliotecaBiblica => item !== null)
}

export async function listarBibliotecaParaReferencia(request: {
  bookCode: string
  chapter: number
  verse?: number | null
  limit?: number
}): Promise<PaqueteBibliotecaBiblica> {
  const bookCode = normalizeBookCode(request.bookCode)
  const chapter = normalizePositiveInteger(request.chapter)
  const verse = request.verse == null ? null : normalizePositiveInteger(request.verse)
  const limit = Number.isInteger(request.limit) ? Math.min(Math.max(Number(request.limit), 1), 20) : 8

  if (!bookCode || !chapter || (request.verse != null && !verse)) {
    return {
      version: 'referencia-invalida',
      reference: { bookCode: bookCode ?? '', chapter: chapter ?? 0, verse },
      fragments: [],
    }
  }

  const supabase = await authenticatedClient()
  if (!supabase) {
    return {
      version: 'sin-sesion',
      reference: { bookCode, chapter, verse },
      fragments: [],
    }
  }

  const { data, error } = await (supabase as any)
    .from('biblical_library_fragments')
    .select(SELECT_FRAGMENTS)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', bookCode)
    .lte('chapter_start', chapter)
    .gte('chapter_end', chapter)
    .order('chapter_start', { ascending: true })
    .order('verse_start', { ascending: true, nullsFirst: true })
    .limit(50)

  if (error) {
    console.error('[biblical-library] No se pudieron cargar los fragmentos:', error)
    return {
      version: 'no-disponible',
      reference: { bookCode, chapter, verse },
      fragments: [],
    }
  }

  const fragments = ((data ?? []) as FragmentRow[])
    .filter((row) => includesReference(row, chapter, verse))
    .map(mapFragment)
    .filter((fragment): fragment is FragmentoBibliotecaBiblica => fragment !== null)
    .slice(0, limit)

  return {
    version: packageVersion(fragments),
    reference: { bookCode, chapter, verse },
    fragments,
  }
}
