'use server'

import { listarContextoBiblicoParaReferencia } from '@/lib/estudios/biblical-context'
import { getInternalBiblicalContext } from '@/lib/estudios/biblical-context-corpus'
import { parsearReferenciaBiblicaContextual } from '@/lib/estudios/biblical-reference'

export async function cargarContextoHistoricoBiblico(pasaje: string) {
  const reference = parsearReferenciaBiblicaContextual(pasaje)

  if (!reference) {
    return {
      status: 'unsupported' as const,
      referenceLabel: pasaje.trim(),
      version: null,
      fragments: [],
      editorialContext: null,
    }
  }

  const context = await listarContextoBiblicoParaReferencia({
    bookCode: reference.bookCode,
    chapter: reference.chapter,
    verse: reference.verse,
    limit: 6,
  })

  const referenceLabel = `${reference.bookLabel} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ''}`

  if (context.fragments.length > 0) {
    return {
      status: 'available' as const,
      referenceLabel,
      version: context.version,
      editorialContext: null,
      fragments: context.fragments.map((fragment) => ({
        slug: fragment.slug,
        title: fragment.title,
        content: fragment.content,
        contentKind: fragment.contentKind,
        contextType: fragment.contextType,
        referenceLabel: fragment.referenceLabel,
        sourceLocator: fragment.sourceLocator,
        periodLabel: fragment.periodLabel,
        locationNames: fragment.locationNames,
        source: {
          name: fragment.source.name,
          attribution: fragment.source.attribution,
          licenseUrl: fragment.source.licenseUrl,
        },
      })),
    }
  }

  const corpus = await getInternalBiblicalContext(pasaje)
  if (!corpus || corpus.status !== 'covered') {
    return {
      status: 'empty' as const,
      referenceLabel,
      version: corpus?.version ?? context.version,
      fragments: [],
      editorialContext: null,
    }
  }

  const unit = corpus.sectionContext ?? corpus.bookProfile
  if (!unit) {
    return {
      status: 'empty' as const,
      referenceLabel,
      version: corpus.version,
      fragments: [],
      editorialContext: null,
    }
  }

  return {
    status: 'editorial' as const,
    referenceLabel: corpus.reference.canonicalReference,
    version: corpus.version,
    fragments: [],
    editorialContext: {
      title: unit.title,
      summary: unit.summary,
      historicalContext: unit.historicalContext,
      jewishContext: unit.jewishContext,
      literaryContext: unit.literaryContext,
      authorialIntent: unit.authorialIntent,
      interpretiveCautions: unit.interpretiveCautions,
      keyTerms: unit.keyTerms,
      peopleGroups: unit.peopleGroups,
      places: unit.places,
      sourceLocator: unit.sourceLocator,
      providerVersion: unit.providerVersion,
      bookLanguages: corpus.reference.book.originalLanguages,
      attribution: 'VIDA — Corpus editorial de contexto bíblico',
      disclosure: 'Síntesis editorial asistida por IA y sujeta a revisión humana; no sustituye fuentes primarias ni comentarios críticos.',
    },
  }
}
