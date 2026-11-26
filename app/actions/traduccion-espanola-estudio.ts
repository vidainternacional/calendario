'use server'

import { readStudyScripture, type StudyScripture } from '@/lib/estudios/study-scripture'

export type TraduccionEspanolaEstudio = StudyScripture

export async function cargarTraduccionEspanolaEstudio(pasaje: string): Promise<TraduccionEspanolaEstudio | null> {
  const query = pasaje.trim()
  if (!query || query.length > 120) return null
  const result = await readStudyScripture(query)
  return result.status === 'ready' ? result.translation : null
}
