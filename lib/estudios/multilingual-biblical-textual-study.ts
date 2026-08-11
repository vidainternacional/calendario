import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { parseInternalBibleReference } from '@/lib/estudios/biblical-context-corpus'
import {
  getResolvedBiblicalTextualStudy,
  type ResolvedBiblicalTextualStudyBundle,
} from '@/lib/estudios/resolved-biblical-textual-study'
import type {
  BiblicalTextualEdition,
  BiblicalTextualMorpheme,
  BiblicalTextualVariant,
  BiblicalTextualWord,
} from '@/lib/estudios/biblical-textual-study'

type Language = 'hebrew' | 'aramaic' | 'greek'

type VerseRow = {
  id: string
  source_id: string
  language: Language
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
}

type LexicalRow = {
  id: string
  language: Language
  lexical_id: string
  strong_number: string | null
  lemma: string
  transliteration: string | null
  part_of_speech: string | null
}

type VariantRow = {
  verse_text_id: string
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

function joined(values: Array<{ value: string | null; joinsPrevious: boolean; joinsNext: boolean }>) {
  return values.reduce((result, current, index) => {
    if (!current.value) return result
    if (index === 0 || current.joinsPrevious || values[index - 1]?.joinsNext) return `${result}${current.value}`
    return result ? `${result} ${current.value}` : current.value
  }, '') || null
}

function groupWords(rows: OccurrenceRow[], lexicalById: Map<string, LexicalRow>): BiblicalTextualWord[] {
  const groups = new Map<number, OccurrenceRow[]>()
  for (const row of rows) {
    const current = groups.get(Number(row.display_word_index)) ?? []
    current.push(row)
    groups.set(Number(row.display_word_index), current)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([displayWordIndex, group]) => {
      const sorted = [...group].sort((a, b) => Number(a.morpheme_index) - Number(b.morpheme_index) || Number(a.word_index) - Number(b.word_index))
      const morphemes = sorted.flatMap((row): BiblicalTextualMorpheme[] => {
        const lexical = lexicalById.get(row.lexical_entry_id)
        if (!lexical) return []
        return [{
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
        }]
      })

      return {
        displayWordIndex,
        sourceWordIndexes: Array.from(new Set(sorted.map(row => Number(row.word_index)))).sort((a, b) => a - b),
        surfaceForm: joined(morphemes.map(item => ({ value: item.surfaceForm, joinsPrevious: item.joinsPrevious, joinsNext: item.joinsNext }))) ?? '',
        transliteration: joined(morphemes.map(item => ({ value: item.transliteration, joinsPrevious: item.joinsPrevious, joinsNext: item.joinsNext }))),
        glossEs: morphemes.map(item => item.glossEs).filter(Boolean).join(' + ') || null,
        wordGroupKey: sorted.find(row => row.word_group_key)?.word_group_key ?? null,
        morphemes,
      }
    })
    .filter(word => word.morphemes.length > 0)
}

async function getMultilingualBundle(rawQuery: string): Promise<ResolvedBiblicalTextualStudyBundle | null> {
  const reference = await parseInternalBibleReference(rawQuery)
  if (!reference || reference.verse === null) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: verseData, error: verseError } = await (supabase as any)
    .from('biblical_verse_texts')
    .select('id, source_id, language, original_text, normalized_text, transliteration, literal_translation_es, text_direction, token_count, analysis_status, metadata, source_locator, provider_version, content_hash')
    .eq('book_code', reference.book.code)
    .eq('chapter', reference.chapter)
    .eq('verse', reference.verse)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('created_at')

  if (verseError) {
    console.error('[multilingual-biblical-textual-study] No se pudieron cargar textos:', verseError)
    return null
  }

  const verseRows = (verseData ?? []) as VerseRow[]
  if (new Set(verseRows.map(row => row.language)).size <= 1) return null

  const sourceIds = Array.from(new Set(verseRows.map(row => row.source_id)))
  const [sourceResponse, occurrenceResponse, variantResponse] = await Promise.all([
    (supabase as any)
      .from('biblical_sources')
      .select('id, name, provider, provider_version, website, attribution, license_url')
      .in('id', sourceIds)
      .eq('enabled', true)
      .eq('review_status', 'approved'),
    (supabase as any)
      .from('biblical_word_occurrences')
      .select('lexical_entry_id, word_index, display_word_index, morpheme_index, token_kind, word_group_key, surface_form, occurrence_transliteration, occurrence_gloss_es, morphology_code, morphology_summary, joins_previous, joins_next, textual_status')
      .in('source_id', sourceIds)
      .eq('book_code', reference.book.code)
      .eq('chapter', reference.chapter)
      .eq('verse', reference.verse)
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .order('word_index')
      .order('morpheme_index'),
    (supabase as any)
      .from('biblical_textual_variants')
      .select('verse_text_id, variant_key, anchor_word_index, reading_type, base_reading, variant_reading, witness_summary, witnesses, editions, significance_es, source_locator, provider_version, content_hash')
      .in('verse_text_id', verseRows.map(row => row.id))
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .order('anchor_word_index'),
  ])

  if (sourceResponse.error || occurrenceResponse.error || variantResponse.error) {
    console.error('[multilingual-biblical-textual-study] Recuperación incompleta', {
      source: sourceResponse.error,
      occurrences: occurrenceResponse.error,
      variants: variantResponse.error,
    })
    return null
  }

  const occurrences = (occurrenceResponse.data ?? []) as OccurrenceRow[]
  if (occurrences.length === 0) return null
  const lexicalIds = Array.from(new Set(occurrences.map(row => row.lexical_entry_id)))
  const { data: lexicalData, error: lexicalError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, language, lexical_id, strong_number, lemma, transliteration, part_of_speech')
    .in('id', lexicalIds)
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (lexicalError) {
    console.error('[multilingual-biblical-textual-study] No se pudo cargar léxico:', lexicalError)
    return null
  }

  const lexicalById = new Map(((lexicalData ?? []) as LexicalRow[]).map(row => [row.id, row]))
  const sourceById = new Map(((sourceResponse.data ?? []) as SourceRow[]).map(row => [row.id, row]))
  const variants = (variantResponse.data ?? []) as VariantRow[]

  const editions = verseRows.flatMap((verseText): BiblicalTextualEdition[] => {
    const source = sourceById.get(verseText.source_id)
    if (!source) return []
    const languageOccurrences = occurrences.filter(row => lexicalById.get(row.lexical_entry_id)?.language === verseText.language)
    if (languageOccurrences.length === 0) return []
    const editionVariants = variants.filter(row => row.verse_text_id === verseText.id)

    return [{
      language: verseText.language,
      originalText: verseText.original_text,
      normalizedText: verseText.normalized_text,
      transliteration: verseText.transliteration,
      literalTranslationEs: verseText.literal_translation_es,
      textDirection: verseText.text_direction,
      tokenCount: verseText.token_count === null ? null : Number(verseText.token_count),
      analysisStatus: verseText.analysis_status,
      baseEdition: typeof verseText.metadata?.base_edition === 'string' ? verseText.metadata.base_edition : null,
      usesFallbackEdition: verseText.metadata?.uses_fallback_edition === true,
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
      words: groupWords(languageOccurrences.filter(row => row.textual_status === 'base'), lexicalById),
      variantOccurrences: groupWords(languageOccurrences.filter(row => row.textual_status !== 'base'), lexicalById),
      variants: editionVariants.map(row => ({
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
    }]
  })

  if (editions.length < 2) return null
  const version = createHash('sha256')
    .update([reference.canonicalReference, ...editions.map(edition => edition.contentHash)].join('|'))
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

export async function getVidaBiblicalTextualStudy(
  rawQuery: string,
  translationId = 'spa_r09'
): Promise<ResolvedBiblicalTextualStudyBundle | null> {
  const multilingual = await getMultilingualBundle(rawQuery)
  if (multilingual) return multilingual
  return getResolvedBiblicalTextualStudy(rawQuery, translationId)
}
