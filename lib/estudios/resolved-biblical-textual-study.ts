import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { parseInternalBibleReference } from '@/lib/estudios/biblical-context-corpus'
import {
  getInternalBiblicalTextualStudy,
  type BiblicalTextualEdition,
  type BiblicalTextualStudyBundle,
  type BiblicalTextualVariant,
  type BiblicalTextualWord,
} from '@/lib/estudios/biblical-textual-study'

type MappingRow = {
  source_book_code: string
  source_chapter: number
  source_verse: number
  sequence: number
  mapping_kind: 'identity' | 'split' | 'merge' | 'relabel'
}

type ProfileRow = {
  id: string
  profile_key: string
}

type BookRow = {
  code: string
  name_es: string
}

export type ResolvedBiblicalTextualStudyBundle = BiblicalTextualStudyBundle & {
  versification?: {
    translationId: string
    profileKey: string
    mappingKinds: Array<MappingRow['mapping_kind']>
    sourceReferences: string[]
  }
}

function joinNullable(values: Array<string | null>, separator = ' ') {
  const available = values.filter((value): value is string => Boolean(value?.trim()))
  return available.length > 0 ? available.join(separator) : null
}

function shiftWords(words: BiblicalTextualWord[], offset: number): BiblicalTextualWord[] {
  return words.map(word => ({
    ...word,
    displayWordIndex: word.displayWordIndex + offset,
  }))
}

function shiftVariants(
  variants: BiblicalTextualVariant[],
  offset: number,
  sourceReference: string
): BiblicalTextualVariant[] {
  return variants.map(variant => ({
    ...variant,
    key: `${sourceReference}:${variant.key}`,
    anchorWordIndex: variant.anchorWordIndex === null
      ? null
      : variant.anchorWordIndex + offset,
  }))
}

function mergeAnalysisStatus(editions: BiblicalTextualEdition[]) {
  const rank: Record<BiblicalTextualEdition['analysisStatus'], number> = {
    partial: 0,
    complete: 1,
    verified: 2,
  }
  return editions.reduce<BiblicalTextualEdition['analysisStatus']>(
    (current, edition) => rank[edition.analysisStatus] < rank[current]
      ? edition.analysisStatus
      : current,
    'verified'
  )
}

function mergeEditions(
  editions: BiblicalTextualEdition[],
  sourceReferences: string[]
): BiblicalTextualEdition {
  if (editions.length === 1) return editions[0]

  const first = editions[0]
  let wordOffset = 0
  const words: BiblicalTextualWord[] = []
  const variantOccurrences: BiblicalTextualWord[] = []
  const variants: BiblicalTextualVariant[] = []

  editions.forEach((edition, index) => {
    words.push(...shiftWords(edition.words, wordOffset))
    variantOccurrences.push(...shiftWords(edition.variantOccurrences, wordOffset))
    variants.push(...shiftVariants(
      edition.variants,
      wordOffset,
      sourceReferences[index] ?? `segmento-${index + 1}`
    ))
    wordOffset += edition.words.length
  })

  const contentHash = createHash('sha256')
    .update(editions.map(edition => edition.contentHash).join('|'))
    .digest('hex')

  return {
    language: first.language,
    originalText: editions.map(edition => edition.originalText).join(' '),
    normalizedText: joinNullable(editions.map(edition => edition.normalizedText)),
    transliteration: joinNullable(editions.map(edition => edition.transliteration)),
    literalTranslationEs: joinNullable(editions.map(edition => edition.literalTranslationEs)),
    textDirection: first.textDirection,
    tokenCount: editions.every(edition => edition.tokenCount !== null)
      ? editions.reduce((total, edition) => total + Number(edition.tokenCount), 0)
      : null,
    analysisStatus: mergeAnalysisStatus(editions),
    sourceLocator: editions.map(edition => edition.sourceLocator).join(' | '),
    providerVersion: joinNullable(
      Array.from(new Set(editions.map(edition => edition.providerVersion))),
      ' + '
    ),
    contentHash,
    source: first.source,
    words,
    variantOccurrences,
    variants,
  }
}

function mergeBundles(
  target: NonNullable<Awaited<ReturnType<typeof parseInternalBibleReference>>>,
  bundles: BiblicalTextualStudyBundle[],
  translationId: string,
  profileKey: string,
  mappings: MappingRow[],
  sourceReferences: string[]
): ResolvedBiblicalTextualStudyBundle | null {
  const editionsByKey = new Map<string, BiblicalTextualEdition[]>()

  bundles.forEach(bundle => {
    bundle.editions.forEach(edition => {
      const key = [
        edition.language,
        edition.source.provider,
        edition.source.providerVersion ?? '',
      ].join('|')
      const current = editionsByKey.get(key) ?? []
      current.push(edition)
      editionsByKey.set(key, current)
    })
  })

  const editions = Array.from(editionsByKey.values()).map(parts =>
    mergeEditions(parts, sourceReferences)
  )
  if (editions.length === 0) return null

  const version = createHash('sha256')
    .update([
      target.book.code,
      String(target.chapter),
      String(target.verse),
      translationId,
      profileKey,
      ...sourceReferences,
      ...editions.map(edition => edition.contentHash),
    ].join('|'))
    .digest('hex')
    .slice(0, 16)

  return {
    reference: {
      bookCode: target.book.code,
      bookName: target.book.nameEs,
      chapter: target.chapter,
      verse: target.verse as number,
      canonicalReference: target.canonicalReference,
    },
    editions,
    version,
    versification: {
      translationId,
      profileKey,
      mappingKinds: Array.from(new Set(mappings.map(mapping => mapping.mapping_kind))),
      sourceReferences,
    },
  }
}

export async function getResolvedBiblicalTextualStudy(
  rawQuery: string,
  translationId = 'spa_r09'
): Promise<ResolvedBiblicalTextualStudyBundle | null> {
  const target = await parseInternalBibleReference(rawQuery)
  if (!target || target.verse === null) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileData, error: profileError } = await (supabase as any)
    .from('biblical_versification_profiles')
    .select('id, profile_key')
    .contains('translation_ids', [translationId])
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('priority')
    .limit(1)
    .maybeSingle()

  if (profileError) {
    console.error('[resolved-biblical-textual-study] No se pudo resolver el perfil:', profileError)
    return getInternalBiblicalTextualStudy(rawQuery)
  }

  const profile = profileData as ProfileRow | null
  if (!profile) return getInternalBiblicalTextualStudy(rawQuery)

  const { data: mappingData, error: mappingError } = await (supabase as any)
    .from('biblical_verse_mappings')
    .select('source_book_code, source_chapter, source_verse, sequence, mapping_kind')
    .eq('profile_id', profile.id)
    .eq('target_book_code', target.book.code)
    .eq('target_chapter', target.chapter)
    .eq('target_verse', target.verse)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('sequence')

  if (mappingError) {
    console.error('[resolved-biblical-textual-study] No se pudieron resolver correspondencias:', mappingError)
    return getInternalBiblicalTextualStudy(rawQuery)
  }

  const mappings = (mappingData ?? []) as MappingRow[]
  if (mappings.length === 0) return getInternalBiblicalTextualStudy(rawQuery)

  const sourceCodes = Array.from(new Set(mappings.map(mapping => mapping.source_book_code)))
  const { data: bookData, error: bookError } = await (supabase as any)
    .from('biblical_books')
    .select('code, name_es')
    .in('code', sourceCodes)
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (bookError) {
    console.error('[resolved-biblical-textual-study] No se recuperaron nombres canónicos:', bookError)
    return null
  }

  const nameByCode = new Map(
    ((bookData ?? []) as BookRow[]).map(book => [book.code, book.name_es])
  )
  const sourceReferences = mappings.map(mapping => {
    const bookName = nameByCode.get(mapping.source_book_code)
    if (!bookName) throw new Error(`Libro fuente no reconocido: ${mapping.source_book_code}`)
    return `${bookName} ${mapping.source_chapter}:${mapping.source_verse}`
  })

  try {
    const bundles = (await Promise.all(
      sourceReferences.map(reference => getInternalBiblicalTextualStudy(reference))
    )).filter((bundle): bundle is BiblicalTextualStudyBundle => bundle !== null)

    if (bundles.length !== mappings.length) {
      console.error('[resolved-biblical-textual-study] Faltan segmentos aprobados:', {
        expected: mappings.length,
        received: bundles.length,
        sourceReferences,
      })
      return null
    }

    return mergeBundles(
      target,
      bundles,
      translationId,
      profile.profile_key,
      mappings,
      sourceReferences
    )
  } catch (error) {
    console.error('[resolved-biblical-textual-study] No se pudo ensamblar la referencia:', error)
    return null
  }
}
