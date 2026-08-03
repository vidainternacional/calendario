import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type CertezaCronologica = 'high' | 'medium' | 'low' | 'disputed'
export type PrecisionCronologica = 'exact' | 'year' | 'range' | 'approximate' | 'relative' | 'unknown'
export type PrecisionCoordenada = 'exact' | 'approximate' | 'regional' | 'unknown'

export type LugarBiblico = {
  slug: string
  name: string
  alternateNames: string[]
  kind: string
  latitude: number | null
  longitude: number | null
  coordinatePrecision: PrecisionCoordenada
  certainty: CertezaCronologica
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
}

export type PeriodoBiblico = {
  slug: string
  title: string
  startYear: number | null
  endYear: number | null
  era: string
  chronologySystem: string
  datePrecision: PrecisionCronologica
  certainty: CertezaCronologica
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
}

export type EventoCronologicoBiblico = {
  slug: string
  title: string
  summary: string | null
  startBookCode: string
  startChapter: number
  startVerse: number | null
  endBookCode: string | null
  endChapter: number | null
  endVerse: number | null
  relativeOrder: number
  datePrecision: PrecisionCronologica
  certainty: CertezaCronologica
  period: PeriodoBiblico | null
  places: Array<{
    relationType: string
    sequenceOrder: number
    place: LugarBiblico
  }>
  source: {
    name: string
    attribution: string
    licenseUrl: string | null
  }
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
}

export type PaqueteCronologicoBiblico = {
  version: string
  reference: {
    bookCode: string
    chapter: number
    verse: number | null
  }
  events: EventoCronologicoBiblico[]
}

type SolicitudCronologia = {
  bookCode: string
  chapter: number
  verse?: number | null
  limit?: number
}

type EventRow = {
  id: string
  slug: string
  title: string
  summary: string | null
  start_book_code: string
  start_chapter: number
  start_verse: number | null
  end_book_code: string | null
  end_chapter: number | null
  end_verse: number | null
  relative_order: number
  date_precision: PrecisionCronologica
  certainty_level: CertezaCronologica
  source_locator: string
  provider_version: string | null
  content_hash: string
  period: null | {
    slug: string
    title: string
    start_year: number | null
    end_year: number | null
    era: string
    chronology_system: string
    date_precision: PrecisionCronologica
    certainty_level: CertezaCronologica
    source_locator: string
    provider_version: string | null
    content_hash: string
  } | Array<Record<string, unknown>>
  source: {
    name: string
    attribution: string
    license_url: string | null
  } | Array<Record<string, unknown>>
}

type RelationRow = {
  event_id: string
  relation_type: string
  sequence_order: number
  place: {
    slug: string
    canonical_name_es: string
    alternate_names: string[] | null
    place_kind: string
    latitude: number | null
    longitude: number | null
    coordinate_precision: PrecisionCoordenada
    certainty_level: CertezaCronologica
    source_locator: string
    provider_version: string | null
    content_hash: string
  } | Array<Record<string, unknown>>
}

const EVENT_SELECT = `
  id, slug, title, summary,
  start_book_code, start_chapter, start_verse,
  end_book_code, end_chapter, end_verse,
  relative_order, date_precision, certainty_level,
  source_locator, provider_version, content_hash,
  period:biblical_timeline_periods!biblical_timeline_events_period_id_fkey (
    slug, title, start_year, end_year, era, chronology_system,
    date_precision, certainty_level, source_locator, provider_version, content_hash
  ),
  source:biblical_sources!biblical_timeline_events_source_id_fkey (
    name, attribution, license_url
  )
`

const RELATION_SELECT = `
  event_id, relation_type, sequence_order,
  place:biblical_places!biblical_timeline_event_places_place_id_fkey (
    slug, canonical_name_es, alternate_names, place_kind,
    latitude, longitude, coordinate_precision, certainty_level,
    source_locator, provider_version, content_hash
  )
`

function one<T>(value: T | Array<Record<string, unknown>> | null): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T | null
}

function normalizeBookCode(value: string) {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9]{2,8}$/.test(normalized) ? normalized : null
}

function normalizePositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0 ? value : null
}

function includesReference(row: EventRow, chapter: number, verse: number | null) {
  const endBookCode = row.end_book_code ?? row.start_book_code
  const endChapter = row.end_chapter ?? row.start_chapter
  if (endBookCode !== row.start_book_code) return true
  if (chapter < row.start_chapter || chapter > endChapter) return false
  if (verse === null) return true
  if (chapter === row.start_chapter && row.start_verse !== null && verse < row.start_verse) return false
  if (chapter === endChapter && row.end_verse !== null && verse > row.end_verse) return false
  return true
}

function packageVersion(events: EventoCronologicoBiblico[]) {
  return createHash('sha256')
    .update(JSON.stringify(events.map((event) => ({
      slug: event.slug,
      hash: event.contentHash,
      period: event.period?.contentHash ?? null,
      places: event.places.map((relation) => relation.place.contentHash),
    }))))
    .digest('hex')
    .slice(0, 16)
}

export async function listarCronologiaBiblicaParaReferencia(
  request: SolicitudCronologia
): Promise<PaqueteCronologicoBiblico> {
  const bookCode = normalizeBookCode(request.bookCode)
  const chapter = normalizePositiveInteger(request.chapter)
  const verse = request.verse == null ? null : normalizePositiveInteger(request.verse)
  const limit = Math.min(Math.max(Number.isInteger(request.limit) ? request.limit! : 8, 1), 20)

  if (!bookCode || !chapter || (request.verse != null && !verse)) {
    return { version: 'referencia-invalida', reference: { bookCode: bookCode ?? '', chapter: chapter ?? 0, verse }, events: [] }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { version: 'sin-sesion', reference: { bookCode, chapter, verse }, events: [] }

  const { data, error } = await (supabase as any)
    .from('biblical_timeline_events')
    .select(EVENT_SELECT)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('start_book_code', bookCode)
    .lte('start_chapter', chapter)
    .order('relative_order', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[biblical-chronology-maps] No se pudieron cargar eventos:', error)
    return { version: 'no-disponible', reference: { bookCode, chapter, verse }, events: [] }
  }

  const eventRows = ((data ?? []) as EventRow[]).filter((row) => includesReference(row, chapter, verse))
  if (eventRows.length === 0) return { version: 'sin-datos', reference: { bookCode, chapter, verse }, events: [] }

  const eventIds = eventRows.map((row) => row.id)
  const { data: relationData, error: relationError } = await (supabase as any)
    .from('biblical_timeline_event_places')
    .select(RELATION_SELECT)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('event_id', eventIds)
    .order('sequence_order', { ascending: true })

  if (relationError) {
    console.error('[biblical-chronology-maps] No se pudieron cargar lugares:', relationError)
    return { version: 'no-disponible', reference: { bookCode, chapter, verse }, events: [] }
  }

  const relationsByEvent = new Map<string, RelationRow[]>()
  for (const relation of (relationData ?? []) as RelationRow[]) {
    const current = relationsByEvent.get(relation.event_id) ?? []
    current.push(relation)
    relationsByEvent.set(relation.event_id, current)
  }

  const events = eventRows.slice(0, limit).flatMap((row): EventoCronologicoBiblico[] => {
    const period = one<NonNullable<EventRow['period']>>(row.period)
    const source = one<NonNullable<EventRow['source']>>(row.source)
    if (!source) return []

    const places = (relationsByEvent.get(row.id) ?? []).flatMap((relation) => {
      const place = one<NonNullable<RelationRow['place']>>(relation.place)
      if (!place) return []
      return [{
        relationType: relation.relation_type,
        sequenceOrder: relation.sequence_order,
        place: {
          slug: place.slug,
          name: place.canonical_name_es,
          alternateNames: place.alternate_names ?? [],
          kind: place.place_kind,
          latitude: place.latitude,
          longitude: place.longitude,
          coordinatePrecision: place.coordinate_precision,
          certainty: place.certainty_level,
          sourceLocator: place.source_locator,
          providerVersion: place.provider_version,
          contentHash: place.content_hash,
        },
      }]
    })

    return [{
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      startBookCode: row.start_book_code,
      startChapter: row.start_chapter,
      startVerse: row.start_verse,
      endBookCode: row.end_book_code,
      endChapter: row.end_chapter,
      endVerse: row.end_verse,
      relativeOrder: row.relative_order,
      datePrecision: row.date_precision,
      certainty: row.certainty_level,
      period: period ? {
        slug: period.slug,
        title: period.title,
        startYear: period.start_year,
        endYear: period.end_year,
        era: period.era,
        chronologySystem: period.chronology_system,
        datePrecision: period.date_precision,
        certainty: period.certainty_level,
        sourceLocator: period.source_locator,
        providerVersion: period.provider_version,
        contentHash: period.content_hash,
      } : null,
      places,
      source: {
        name: source.name,
        attribution: source.attribution,
        licenseUrl: source.license_url,
      },
      sourceLocator: row.source_locator,
      providerVersion: row.provider_version,
      contentHash: row.content_hash,
    }]
  })

  return { version: packageVersion(events), reference: { bookCode, chapter, verse }, events }
}
