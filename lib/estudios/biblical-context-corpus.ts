import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type BiblicalBook = {
  code: string
  canonicalOrder: number
  nameEs: string
  nameEn: string
  chapterCount: number
  testament: 'old' | 'new'
  canonicalSection: string
  originalLanguages: string[]
  aliases: string[]
  coverageStatus: 'context_ready' | 'indexed' | string
}

export type ParsedBibleReference = {
  book: BiblicalBook
  chapter: number
  verse: number | null
  canonicalReference: string
}

export type BiblicalContextUnit = {
  slug: string
  scopeKind: 'book' | 'section' | 'chapter'
  chapterStart: number
  chapterEnd: number
  title: string
  summary: string
  historicalContext: string
  jewishContext: string
  literaryContext: string
  authorialIntent: string
  theologicalReflection: string
  interpretiveCautions: string
  keyTerms: string[]
  peopleGroups: string[]
  places: string[]
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
}

export type BiblicalContextBundle = {
  status: 'covered' | 'indexed'
  reference: ParsedBibleReference
  bookProfile: BiblicalContextUnit | null
  sectionContext: BiblicalContextUnit | null
  version: string
}

type BookRow = {
  code: string
  canonical_order: number
  name_es: string
  name_en: string
  chapter_count: number
  testament: 'old' | 'new'
  canonical_section: string
  original_languages: string[] | null
  aliases: string[] | null
  metadata: Record<string, unknown> | null
}

type ContextRow = {
  slug: string
  scope_kind: 'book' | 'section' | 'chapter'
  chapter_start: number
  chapter_end: number
  title: string
  summary: string
  historical_context: string
  jewish_context: string
  literary_context: string
  authorial_intent: string
  theological_reflection: string
  interpretive_cautions: string
  key_terms: string[] | null
  people_groups: string[] | null
  places: string[] | null
  source_locator: string
  provider_version: string | null
  content_hash: string
}

function normalizeReference(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9:\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAlias(value: string) {
  return normalizeReference(value).replace(/\s+/g, ' ').trim()
}

function mapBook(row: BookRow): BiblicalBook {
  return {
    code: row.code,
    canonicalOrder: Number(row.canonical_order),
    nameEs: row.name_es,
    nameEn: row.name_en,
    chapterCount: Number(row.chapter_count),
    testament: row.testament,
    canonicalSection: row.canonical_section,
    originalLanguages: row.original_languages ?? [],
    aliases: row.aliases ?? [],
    coverageStatus: String(row.metadata?.coverage_status ?? 'indexed'),
  }
}

function mapContext(row: ContextRow): BiblicalContextUnit {
  return {
    slug: row.slug,
    scopeKind: row.scope_kind,
    chapterStart: Number(row.chapter_start),
    chapterEnd: Number(row.chapter_end),
    title: row.title,
    summary: row.summary,
    historicalContext: row.historical_context,
    jewishContext: row.jewish_context,
    literaryContext: row.literary_context,
    authorialIntent: row.authorial_intent,
    theologicalReflection: row.theological_reflection,
    interpretiveCautions: row.interpretive_cautions,
    keyTerms: row.key_terms ?? [],
    peopleGroups: row.people_groups ?? [],
    places: row.places ?? [],
    sourceLocator: row.source_locator,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
  }
}

async function listApprovedBooks(): Promise<BiblicalBook[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase as any)
    .from('biblical_books')
    .select('code, canonical_order, name_es, name_en, chapter_count, testament, canonical_section, original_languages, aliases, metadata')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('canonical_order')

  if (error) {
    console.error('[biblical-context-corpus] No se pudo cargar el índice canónico:', error)
    return []
  }

  return ((data ?? []) as BookRow[]).map(mapBook)
}

export async function parseInternalBibleReference(rawQuery: string): Promise<ParsedBibleReference | null> {
  const query = normalizeReference(rawQuery)
  if (!query) return null

  const books = await listApprovedBooks()
  const candidates = books.flatMap(book => {
    const aliases = new Set([book.nameEs, book.nameEn, book.code, ...book.aliases, ...(book.code === 'ACT' ? ['Hecho'] : [])])
    return Array.from(aliases)
      .map(alias => ({ book, alias: normalizeAlias(alias) }))
      .filter(candidate => candidate.alias.length >= 2)
  }).sort((a, b) => b.alias.length - a.alias.length)

  const match = candidates.find(candidate => {
    if (!query.startsWith(candidate.alias)) return false
    const boundary = query.charAt(candidate.alias.length)
    return boundary === '' || boundary === ' ' || /\d/.test(boundary)
  })

  if (!match) return null

  const remainder = query.slice(match.alias.length).trim()
  const referenceMatch = remainder.match(/^(\d{1,3})(?:\s*:\s*(\d{1,3}))?(?:\s*[-–]\s*\d{1,3})?$/)
  if (!referenceMatch) return null

  const chapter = Number(referenceMatch[1])
  const verse = referenceMatch[2] ? Number(referenceMatch[2]) : null
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > match.book.chapterCount) return null
  if (verse !== null && (!Number.isInteger(verse) || verse < 1 || verse > 200)) return null

  return {
    book: match.book,
    chapter,
    verse,
    canonicalReference: `${match.book.nameEs} ${chapter}${verse ? `:${verse}` : ''}`,
  }
}

export async function getInternalBiblicalContext(rawQuery: string): Promise<BiblicalContextBundle | null> {
  const reference = await parseInternalBibleReference(rawQuery)
  if (!reference) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('biblical_context_units')
    .select('slug, scope_kind, chapter_start, chapter_end, title, summary, historical_context, jewish_context, literary_context, authorial_intent, theological_reflection, interpretive_cautions, key_terms, people_groups, places, source_locator, provider_version, content_hash')
    .eq('book_code', reference.book.code)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .lte('chapter_start', reference.chapter)
    .gte('chapter_end', reference.chapter)
    .limit(20)

  if (error) {
    console.error('[biblical-context-corpus] No se pudo recuperar contexto:', error)
    return null
  }

  const units: BiblicalContextUnit[] = ((data ?? []) as ContextRow[]).map(mapContext)
  const bookProfile = units.find((unit: BiblicalContextUnit) => unit.scopeKind === 'book') ?? null
  const sectionContext = units
    .filter((unit: BiblicalContextUnit) => unit.scopeKind !== 'book')
    .sort((a: BiblicalContextUnit, b: BiblicalContextUnit) => {
      const scopePriority = (value: BiblicalContextUnit) => value.scopeKind === 'chapter' ? 0 : 1
      return scopePriority(a) - scopePriority(b)
        || (a.chapterEnd - a.chapterStart) - (b.chapterEnd - b.chapterStart)
    })[0] ?? null

  const version = createHash('sha256')
    .update([
      reference.book.code,
      String(reference.chapter),
      String(reference.verse ?? ''),
      bookProfile?.contentHash ?? '',
      sectionContext?.contentHash ?? '',
    ].join('|'))
    .digest('hex')
    .slice(0, 16)

  return {
    status: bookProfile || sectionContext ? 'covered' : 'indexed',
    reference,
    bookProfile,
    sectionContext,
    version,
  }
}