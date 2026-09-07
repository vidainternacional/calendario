'use server'

import { createClient } from '@/lib/supabase/server'
import { registrarAnaliticaEstudio } from '@/lib/estudios/study-analytics'

export type StudyAnalyticsClientEvent = {
  eventType: 'query' | 'section'
  queryKind?: string | null
  queryText?: string | null
  resolvedReference?: string | null
  resolvedBook?: string | null
  resolvedTopic?: string | null
  resultStatus?: string | null
  sectionKey?: string | null
  durationMs?: number | null
}

export async function registrarEventoAnaliticaEstudio(payload: StudyAnalyticsClientEvent) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await registrarAnaliticaEstudio(supabase, payload)
  return { success: true }
}
