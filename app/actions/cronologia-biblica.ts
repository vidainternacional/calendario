'use server'

import { listarCronologiaBiblicaParaReferencia } from '@/lib/estudios/biblical-chronology-maps'
import { parsearReferenciaBiblicaContextual } from '@/lib/estudios/biblical-reference'

export async function cargarCronologiaBiblica(pasaje: string) {
  const reference = parsearReferenciaBiblicaContextual(pasaje)

  if (!reference) {
    return {
      status: 'unsupported' as const,
      referenceLabel: pasaje.trim(),
      version: null,
      events: [],
    }
  }

  const bundle = await listarCronologiaBiblicaParaReferencia({
    bookCode: reference.bookCode,
    chapter: reference.chapter,
    verse: reference.verse,
    limit: 8,
  })

  const referenceLabel = `${reference.bookLabel} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ''}`

  if (bundle.events.length === 0) {
    return {
      status: 'empty' as const,
      referenceLabel,
      version: bundle.version,
      events: [],
    }
  }

  return {
    status: 'available' as const,
    referenceLabel,
    version: bundle.version,
    events: bundle.events,
  }
}
