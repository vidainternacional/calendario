import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { parseInternalBibleReference } from '@/lib/estudios/biblical-context-corpus'

export type BiblicalTextualMorpheme = {
  morphemeIndex: number
  tokenKind: 'word' | 'prefix' | 'suffix'
  surfaceForm: string
  transliteration: string | null
  glossEs: string | null
  morphologyCode: string | null
  morphologySummary: string | null
  lexicalId: string
  strongNumber: string | null
  lemma: string
  lemmaTransliteration: string | null
  partOfSpeech: string | null
  joinsPrevious: boolean
  joinsNext: boolean
}

export type BiblicalTextualWord = {
  displayWordIndex: number
  sourceWordIndexes: number[]
  surfaceForm: string
  transliteration: string | null
  glossEs: string | null
  wordGroupKey: string | null
  morphemes: BiblicalTextualMorpheme[]
}

export type BiblicalTextualVariant = {
  key: string
  anchorWordIndex: number | null
  readingType: 'substitution' | 'addition' | 'omission' | 'transposition' | 'orthographic'
  baseReading: string | null
  variantReading: string | null
  witnessSummary: string | null
  witnesses: unknown[]
  editions: unknown[]
  significanceEs: string | null
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
}

export type BiblicalTextualSource = {
  name: string
  provider: string
  providerVersion: string | null
  website: string | null
  attribution: string
  licenseUrl: string | null
}

export type BiblicalTextualEdition = {
  language: 'hebrew' | 'aramaic' | 'greek'
  originalText: string
  normalizedText: string | null
  transliteration: string | null
  literalTranslationEs: string | null
  textDirection: 'ltr' | 'rtl'
  tokenCount: number | null
  analysisStatus: 'partial' | 'complete' | 'verified'
  baseEdition: string | null
  usesFallbackEdition: boolean
  sourceLocator: string
  providerVersion: string | null
  contentHash: string
  source: BiblicalTextualSource
  words: BiblicalTextualWord[]
  variantOccurrences: BiblicalTextualWord[]
  variants: BiblicalTextualVariant[]
}

export type BiblicalTextualStudyBundle = {
  reference: {
    bookCode: string
    bookName: string
    chapter: number
    verse: number
    canonicalReference: string
  }
  editions: BiblicalTextualEdition[]
  version: string
}

type VerseTextRow = {
  id: string
  source_id: string
  language: 'hebrew' | 'aramaic' | 'greek'
  original_text: string
  normalized_text: string | null
  transliteration: string | null
  literal_translation_es: string | null
  text_direction: 'ltr' | 'rtl'
  token_count: number | null
  analysis_status: 'partial' | 'complete' | 'verified'
  metadata: Record<string, unknown> | null
  source_locator: string
  provider_version: string | null
  content_hash: string
}

type OccurrenceRow = {
  lexical_entry_id: string
  word_index: number
  display_word_index: number
  morpheme_index: number
  token_kind: 'word' | 'prefix' | 'suffix'
  word_group_key: string | null
  surface_form: string
  occurrence_transliteration: string | null
  occurrence_gloss_es: string | null
  morphology_code: string | null
  morphology_summary: string | null
  joins_previous: boolean
  joins_next: boolean
  textual_status: 'base' | 'variant' | 'uncertain'
  content_hash: string
}

type LexicalRow = {
  id: string
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
}

type VariantRow = {
  variant_key: string
  anchor_word_index: number | null
  reading_type: BiblicalTextualVariant['readingType']
  base_reading: string | null
  variant_reading: string | null
  witness_summary: string | null
  witnesses: unknown[] | null
  editions: unknown[] | null
  significance_es: string | null
  source_locator: string
  provider_version: string | null
  content_hash: string
}

type SourceRow = {
  id: string
  name: string
  provider: string
  provider_version: string | null
  website: string | null
  attribution: string
  license_url: string | null
}

function assembleJoinedText(
  morphemes: Array<{ value: string | null; joinsPrevious: boolean; joinsNext: boolean }>
) {
  return morphemes.reduce((result, current, index) => {
    if (!current.value) return result
    if (index === 0 || current.joinsPrevious || morphemes[index - 1]?.joinsNext) {
      return `${result}${current.value}`
    }
    return result ? `${result} ${current.value}` : current.value
  }, '') || null
}

function groupOccurrences(
  rows: OccurrenceRow[],
  lexicalById: Map<string, LexicalRow>
): BiblicalTextualWord[] {
  const groups = new Map<number, OccurrenceRow[]>()

  for (const row of rows) {
    const existing = groups.get(Number(row.display_word_index)) ?? []
    existing.push(row)
    groups.set(Number(row.display_word_index), existing)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([displayWordIndex, group]) => {
      const sorted = [...group].sort((a, b) =>
        Number(a.morpheme_index) - Number(b.morpheme_index)
        || Number(a.word_index) - Number(b.word_index)
      )

      const morphemes = sorted.map<BiblicalTextualMorpheme>(row => {
        const lexical = lexicalById.get(row.lexical_entry_id)
        if (!lexical) {
          throw new Error(`Entrada léxica aprobada no encontrada: ${row.lexical_entry_id}`)
        }

        return {
          morphemeIndex: Number(row.morpheme_index),
          tokenKind: row.token_kind,
          surfaceForm: row.surface_form,
          transliteration: row.occurrence_transliteration,
          glossEs: row.occurrence_gloss_es,
          morphologyCode: row.morphology_code,
          morphologySummary: row.morphology_summary,
          lexicalId: lexical.lexical_id,
          strongNumber: lexical.strong_number,
          lemma: lexical.lemma,
          lemmaTransliteration: lexical.transliteration,
          partOfSpeech: lexical.part_of_speech,
          joinsPrevious: row.joins_previous,
          joinsNext: row.joins_next,
        }
      })

      return {
        displayWordIndex,
        sourceWordIndexes: Array.from(new Set(sorted.map(row => Number(row.word_index)))).sort((a, b) => a - b),
        surfaceForm: assembleJoinedText(morphemes.map(morpheme => ({
          value: morpheme.surfaceForm,
          joinsPrevious: morpheme.joinsPrevious,
          joinsNext: morpheme.joinsNext,
        }))) ?? '',
        transliteration: assembleJoinedText(morphemes.map(morpheme => ({
          value: morpheme.transliteration,
          joinsPrevious: morpheme.joinsPrevious,
          joinsNext: morpheme.joinsNext,
        }))),
        glossEs: morphemes.map(morpheme => morpheme.glossEs).filter(Boolean).join(' + ') || null,
        wordGroupKey: sorted.find(row => row.word_group_key)?.word_group_key ?? null,
        morphemes,
      }
    })
}

async function loadEdition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  verseText: VerseTextRow,
  bookCode: string,
  chapter: number,
  verse: number
): Promise<BiblicalTextualEdition | null> {
  const [sourceResponse, occurrenceResponse, variantResponse] = await Promise.all([
    (supabase as any)
      .from('biblical_sources')
      .select('id, name, provider, provider_version, website, attribution, license_url')
      .eq('id', verseText.source_id)
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .maybeSingle(),
    (supabase as any)
      .from('biblical_word_occurrences')
      .select('lexical_entry_id, word_index, display_word_index, morpheme_index, token_kind, word_group_key, surface_form, occurrence_transliteration, occurrence_gloss_es, morphology_code, morphology_summary, joins_previous, joins_next, textual_status, content_hash')
      .eq('source_id', verseText.source_id)
      .eq('book_code', bookCode)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .order('word_index')
      .order('morpheme_index'),
    (supabase as any)
      .from('biblical_textual_variants')
      .select('variant_key, anchor_word_index, reading_type, base_reading, variant_reading, witness_summary, witnesses, editions, significance_es, source_locator, provider_version, content_hash')
      .eq('verse_text_id', verseText.id)
      .eq('source_id', verseText.source_id)
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .order('anchor_word_index'),
  ])

  if (sourceResponse.error || occurrenceResponse.error || variantResponse.error) {
    console.error('[biblical-textual-study] No se pudo recuperar la edición:', {
      sourceError: sourceResponse.error,
      occurrenceError: occurrenceResponse.error,
      variantError: variantResponse.error,
    })
    return null
  }

  const source = sourceResponse.data as SourceRow | null
  const occurrences = (occurrenceResponse.data ?? []) as OccurrenceRow[]
  const variants = (variantResponse.data ?? []) as VariantRow[]
  if (!source || occurrences.length === 0) return null

  const lexicalIds = Array.from(new Set(occurrences.map(row => row.lexical_entry_id)))
  const { data: lexicalData, error: lexicalError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lexical_id, strong_number, lemma, transliteration, part_of_speech')
    .eq('source_id', verseText.source_id)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('id', lexicalIds)

  if (lexicalError) {
    console.error('[biblical-textual-study] No se pudieron recuperar las entradas léxicas:', lexicalError)
    return null
  }

  const lexicalById = new Map(
    ((lexicalData ?? []) as LexicalRow[]).map(row => [row.id, row])
  )

  try {
    return {
      language: verseText.language,
      originalText: verseText.original_text,
      normalizedText: verseText.normalized_text,
      transliteration: verseText.transliteration,
      literalTranslationEs: verseText.literal_translation_es,
      textDirection: verseText.text_direction,
      tokenCount: verseText.token_count === null ? null : Number(verseText.token_count),
      analysisStatus: verseText.analysis_status,
      baseEdition: typeof verseText.metadata?.base_edition === 'string'
        ? verseText.metadata.base_edition
        : null,
      usesFallbackEdition: verseText.metadata?.uses_fallback_edition === true
        || verseText.metadata?.uses_fallback_edition === 'true',
      sourceLocator: verseText.source_locator,
      providerVersion: verseText.provider_version,
      contentHash: verseText.content_hash,
      source: {
        name: source.name,
        provider: source.provider,
        providerVersion: source.provider_version,
        website: source.website,
        attribution: source.attribution,
        licenseUrl: source.license_url,
      },
      words: groupOccurrences(
        occurrences.filter(row => row.textual_status === 'base'),
        lexicalById
      ),
      variantOccurrences: groupOccurrences(
        occurrences.filter(row => row.textual_status !== 'base'),
        lexicalById
      ),
      variants: variants.map(row => ({
        key: row.variant_key,
        anchorWordIndex: row.anchor_word_index === null ? null : Number(row.anchor_word_index),
        readingType: row.reading_type,
        baseReading: row.base_reading,
        variantReading: row.variant_reading,
        witnessSummary: row.witness_summary,
        witnesses: row.witnesses ?? [],
        editions: row.editions ?? [],
        significanceEs: row.significance_es,
        sourceLocator: row.source_locator,
        providerVersion: row.provider_version,
        contentHash: row.content_hash,
      })),
    }
  } catch (error) {
    console.error('[biblical-textual-study] La edición aprobada contiene referencias incompletas:', error)
    return null
  }
}

export async function getInternalBiblicalTextualStudy(
  rawQuery: string
): Promise<BiblicalTextualStudyBundle | null> {
  const reference = await parseInternalBibleReference(rawQuery)
  if (!reference || reference.verse === null) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('biblical_verse_texts')
    .select('id, source_id, language, original_text, normalized_text, transliteration, literal_translation_es, text_direction, token_count, analysis_status, metadata, source_locator, provider_version, content_hash')
    .eq('book_code', reference.book.code)
    .eq('chapter', reference.chapter)
    .eq('verse', reference.verse)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('analysis_status', { ascending: false })
    .order('created_at')
    .limit(10)

  if (error) {
    console.error('[biblical-textual-study] No se pudo recuperar el texto original:', error)
    return null
  }

  const editions = (await Promise.all(
    ((data ?? []) as VerseTextRow[]).map(row =>
      loadEdition(supabase, row, reference.book.code, reference.chapter, reference.verse as number)
    )
  )).filter((edition): edition is BiblicalTextualEdition => edition !== null)

  if (editions.length === 0) return null

  const version = createHash('sha256')
    .update([
      reference.book.code,
      String(reference.chapter),
      String(reference.verse),
      ...editions.flatMap(edition => [
        edition.contentHash,
        ...edition.words.flatMap(word => word.morphemes.map(morpheme =>
          [morpheme.lexicalId, morpheme.morphologyCode ?? '', morpheme.surfaceForm].join(':')
        )),
        ...edition.variants.map(variant => variant.contentHash),
      ]),
    ].join('|'))
    .digest('hex')
    .slice(0, 16)

  return {
    reference: {
      bookCode: reference.book.code,
      bookName: reference.book.nameEs,
      chapter: reference.chapter,
      verse: reference.verse,
      canonicalReference: reference.canonicalReference,
    },
    editions,
    version,
  }
}
