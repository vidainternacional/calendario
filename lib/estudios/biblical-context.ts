import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type TipoContenidoContextual =
  | 'source_excerpt'
  | 'editorial_summary'
  | 'inference'

export type TipoContextoBiblico =
  | 'historical_period'
  | 'political'
  | 'religious'
  | 'social_custom'
  | 'institution'
  | 'people_group'
  | 'place'
  | 'archaeology'
  | 'literary'
  | 'other'

export type FuenteContextoBiblico = {
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

export type FragmentoContextoBiblico = {
  slug: string
  title: string
  content: string
  contentKind: TipoContenidoContextual
  contextType: TipoContextoBiblico
  language: string
  bookCode: string
  chapterStart: number
  verseStart: number | null
  chapterEnd: number
  verseEnd: number | null
  referenceLabel: string
  sourceLocator: string
  periodLabel: string | null
  locationNames: string[]
  peopleGroups: string[]
  topics: string[]
  providerVersion: string | null
  contentHash: string | null
  metadata: Record<string, unknown>
  approvedAt: string | null
  source: FuenteContextoBiblico
}

export type PaqueteContextoBiblico = {
  version: string
  reference: {
    bookCode: string
    chapter: number
    verse: number | null
  }
  fragments: FragmentoContextoBiblico[]
}

export type SolicitudContextoBiblico = {
  bookCode: string
  chapter: number
  verse?: number | null
  limit?: number
}

type FuenteContextoRow = {
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

type FragmentoContextoRow = {
  slug: string
  title: string
  content: string
  content_kind: TipoContenidoContextual
  context_type: TipoContextoBiblico
  language: string
  book_code: string
  chapter_start: number
  verse_start: number | null
  chapter_end: number
  verse_end: number | null
  reference_label: string
  source_locator: string
  period_label: string | null
  location_names: string[] | null
  people_groups: string[] | null
  topics: string[] | null
  provider_version: string | null
  content_hash: string | null
  metadata: Record<string, unknown> | null
  approved_at: string | null
  source: FuenteContextoRow | FuenteContextoRow[]
}

const SELECT_CONTEXT = `
  slug,
  title,
  content,
  content_kind,
  context_type,
  language,
  book_code,
  chapter_start,
  verse_start,
  chapter_end,
  verse_end,
  reference_label,
  source_locator,
  period_label,
  location_names,
  people_groups,
  topics,
  provider_version,
  content_hash,
  metadata,
  approved_at,
  source:biblical_sources!biblical_context_fragments_source_id_fkey (
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
  if (value === undefined) return 8
  if (!Number.isInteger(value)) return 8
  return Math.min(Math.max(value, 1), 20)
}

function normalizeSource(value: FragmentoContextoRow['source']): FuenteContextoRow | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function includesReference(
  row: FragmentoContextoRow,
  chapter: number,
  verse: number | null
) {
  if (chapter < row.chapter_start || chapter > row.chapter_end) return false
  if (verse === null) return true

  if (
    chapter === row.chapter_start
    && row.verse_start !== null
    && verse < row.verse_start
  ) return false

  if (
    chapter === row.chapter_end
    && row.verse_end !== null
    && verse > row.verse_end
  ) return false

  return true
}

function mapFragment(row: FragmentoContextoRow): FragmentoContextoBiblico | null {
  const source = normalizeSource(row.source)
  if (!source) return null

  return {
    slug: row.slug,
    title: row.title,
    content: row.content,
    contentKind: row.content_kind,
    contextType: row.context_type,
    language: row.language,
    bookCode: row.book_code,
    chapterStart: row.chapter_start,
    verseStart: row.verse_start,
    chapterEnd: row.chapter_end,
    verseEnd: row.verse_end,
    referenceLabel: row.reference_label,
    sourceLocator: row.source_locator,
    periodLabel: row.period_label,
    locationNames: row.location_names ?? [],
    peopleGroups: row.people_groups ?? [],
    topics: row.topics ?? [],
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
    metadata: row.metadata ?? {},
    approvedAt: row.approved_at,
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

function packageVersion(fragments: FragmentoContextoBiblico[]) {
  const fingerprint = fragments.map((fragment) => ({
    slug: fragment.slug,
    providerVersion: fragment.providerVersion,
    contentHash: fragment.contentHash,
    sourceSlug: fragment.source.slug,
    sourceVersion: fragment.source.providerVersion,
    sourceHash: fragment.source.contentHash,
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

export async function listarContextoBiblicoParaReferencia(
  request: SolicitudContextoBiblico
): Promise<PaqueteContextoBiblico> {
  const bookCode = normalizeBookCode(request.bookCode)
  const chapter = normalizePositiveInteger(request.chapter)
  const verse = request.verse == null
    ? null
    : normalizePositiveInteger(request.verse)
  const limit = normalizeLimit(request.limit)

  if (!bookCode || !chapter || (request.verse != null && !verse)) {
    return {
      version: 'referencia-invalida',
      reference: {
        bookCode: bookCode ?? '',
        chapter: chapter ?? 0,
        verse: verse ?? null,
      },
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
    .from('biblical_context_fragments')
    .select(SELECT_CONTEXT)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', bookCode)
    .lte('chapter_start', chapter)
    .gte('chapter_end', chapter)
    .order('chapter_start', { ascending: true })
    .order('verse_start', { ascending: true, nullsFirst: true })
    .limit(50)

  if (error) {
    console.error('[biblical-context] No se pudo cargar el contexto:', error)
    return {
      version: 'no-disponible',
      reference: { bookCode, chapter, verse },
      fragments: [],
    }
  }

  const fragments = ((data ?? []) as FragmentoContextoRow[])
    .filter((row) => includesReference(row, chapter, verse))
    .map(mapFragment)
    .filter((fragment): fragment is FragmentoContextoBiblico => fragment !== null)
    .slice(0, limit)

  return {
    version: packageVersion(fragments),
    reference: { bookCode, chapter, verse },
    fragments,
  }
}

export async function obtenerFragmentoContextoBiblico(
  slug: string
): Promise<FragmentoContextoBiblico | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  const supabase = await authenticatedClient()
  if (!supabase) return null

  const { data, error } = await (supabase as any)
    .from('biblical_context_fragments')
    .select(SELECT_CONTEXT)
    .eq('slug', slug)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .maybeSingle()

  if (error) {
    console.error('[biblical-context] No se pudo cargar el fragmento:', error)
    return null
  }

  return data ? mapFragment(data as FragmentoContextoRow) : null
}
