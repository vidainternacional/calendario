'use server'

import { getResolvedBiblicalTextualStudy } from '@/lib/estudios/resolved-biblical-textual-study'

export async function cargarEvidenciaTextualBiblica(
  pasaje: string,
  translationId = 'spa_r09'
) {
  const query = pasaje.trim()
  const translation = translationId.trim()

  if (!query || query.length > 120) return null
  if (!/^[a-z0-9_-]{2,80}$/i.test(translation)) return null
  if (!/:\d+\b/.test(query)) return null

  return getResolvedBiblicalTextualStudy(query, translation)
}
