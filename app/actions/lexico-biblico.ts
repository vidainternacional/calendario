'use server'

import { listarPalabrasBiblicasParaReferencia } from '@/lib/estudios/biblical-lexicon'
import { parsearReferenciaLexicaBiblica } from '@/lib/estudios/biblical-lexical-reference'

export async function cargarPalabrasBiblicasVerificadas(pasaje: string) {
  const reference = parsearReferenciaLexicaBiblica(pasaje)

  if (!reference) {
    return {
      status: 'unsupported' as const,
      referenceLabel: pasaje.trim(),
      version: null,
      occurrences: [],
    }
  }

  const referenceLabel = `${reference.bookLabel} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ''}`

  if (!reference.verse) {
    return {
      status: 'needs_verse' as const,
      referenceLabel,
      version: null,
      occurrences: [],
    }
  }

  const lexical = await listarPalabrasBiblicasParaReferencia({
    bookCode: reference.bookCode,
    chapter: reference.chapter,
    verse: reference.verse,
    limit: 30,
  })

  if (lexical.occurrences.length === 0) {
    return {
      status: 'empty' as const,
      referenceLabel,
      version: lexical.version,
      occurrences: [],
    }
  }

  return {
    status: 'available' as const,
    referenceLabel,
    version: lexical.version,
    occurrences: lexical.occurrences.map((occurrence) => ({
      wordIndex: occurrence.wordIndex,
      surfaceForm: occurrence.surfaceForm,
      normalizedForm: occurrence.normalizedForm,
      morphologyCode: occurrence.morphologyCode,
      morphologySummary: occurrence.morphologySummary,
      sourceLocator: occurrence.sourceLocator,
      providerVersion: occurrence.providerVersion,
      entry: {
        lexicalId: occurrence.entry.lexicalId,
        strongNumber: occurrence.entry.strongNumber,
        language: occurrence.entry.language,
        lemma: occurrence.entry.lemma,
        transliteration: occurrence.entry.transliteration,
        partOfSpeech: occurrence.entry.partOfSpeech,
        sourceGloss: occurrence.entry.sourceGloss,
        displayGlossEs: occurrence.entry.displayGlossEs,
        displayGlossKind: occurrence.entry.displayGlossKind,
        definition: occurrence.entry.definition,
        sourceLocator: occurrence.entry.sourceLocator,
      },
      source: {
        name: occurrence.source.name,
        website: occurrence.source.website,
        licenseUrl: occurrence.source.licenseUrl,
        attribution: occurrence.source.attribution,
      },
    })),
  }
}
