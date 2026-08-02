'use server'

import { listarContextoBiblicoParaReferencia } from '@/lib/estudios/biblical-context'
import { parsearReferenciaBiblicaContextual } from '@/lib/estudios/biblical-reference'

export async function cargarContextoHistoricoBiblico(pasaje: string) {
  const reference = parsearReferenciaBiblicaContextual(pasaje)

  if (!reference) {
    return {
      status: 'unsupported' as const,
      referenceLabel: pasaje.trim(),
      version: null,
      fragments: [],
    }
  }

  const context = await listarContextoBiblicoParaReferencia({
    bookCode: reference.bookCode,
    chapter: reference.chapter,
    verse: reference.verse,
    limit: 6,
  })

  const referenceLabel = `${reference.bookLabel} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ''}`

  if (context.fragments.length === 0) {
    return {
      status: 'empty' as const,
      referenceLabel,
      version: context.version,
      fragments: [],
    }
  }

  return {
    status: 'available' as const,
    referenceLabel,
    version: context.version,
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
