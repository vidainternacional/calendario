import 'server-only'

import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'vida_estudio_session'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type EstudioAnalyticsPayload = {
  eventType: 'query' | 'section'
  queryKind?: string | null
  queryText?: string | null
  resolvedReference?: string | null
  resolvedBook?: string | null
  resolvedTopic?: string | null
  resultStatus?: string | null
  sectionKey?: string | null
  durationMs?: number | null
  metadata?: Record<string, unknown>
}

function cleanText(value: string | null | undefined, maxLength: number) {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, maxLength) : null
}

async function getAnonymousStudySessionId() {
  const store = await cookies()
  const existing = store.get(SESSION_COOKIE)?.value
  if (existing && UUID_PATTERN.test(existing)) return existing

  const sessionId = randomUUID()
  try {
    store.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch {
    // Algunas lecturas server-only no permiten mutar cookies; la sesión sigue siendo anónima para este evento.
  }
  return sessionId
}

export async function registrarAnaliticaEstudio(supabase: any, payload: EstudioAnalyticsPayload) {
  try {
    const sessionId = await getAnonymousStudySessionId()
    const duration = Number.isFinite(payload.durationMs)
      ? Math.max(0, Math.min(Math.round(payload.durationMs as number), 600_000))
      : null

    const { error } = await supabase.from('estudio_analytics_events').insert({
      session_id: sessionId,
      event_type: payload.eventType,
      query_kind: cleanText(payload.queryKind, 40),
      query_text: cleanText(payload.queryText, 300),
      resolved_reference: cleanText(payload.resolvedReference, 160),
      resolved_book: cleanText(payload.resolvedBook, 80),
      resolved_topic: cleanText(payload.resolvedTopic, 160),
      result_status: cleanText(payload.resultStatus, 60),
      section_key: cleanText(payload.sectionKey, 100),
      duration_ms: duration,
      metadata: payload.metadata ?? {},
    })

    if (error) console.error('[estudio-analytics] No se pudo registrar el evento:', error)
  } catch (error) {
    console.error('[estudio-analytics] Error inesperado:', error)
  }
}
