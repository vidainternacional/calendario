import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_EVENTS = new Set(['session_started', 'page_view'])

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
  }

  const body = payload as {
    eventName?: unknown
    route?: unknown
    sessionId?: unknown
    standalone?: unknown
  }

  if (typeof body.eventName !== 'string' || !ALLOWED_EVENTS.has(body.eventName)) {
    return NextResponse.json({ ok: false, error: 'Evento no permitido' }, { status: 400 })
  }

  const route = typeof body.route === 'string' ? body.route.slice(0, 240) : null
  const sessionId = isUuid(body.sessionId) ? body.sessionId : null
  const standalone = body.standalone === true

  const service = createServiceClient()
  const [{ data: participant }, { data: profile }] = await Promise.all([
    service
      .from('pilot_participants')
      .select('active')
      .eq('profile_id', user.id)
      .maybeSingle(),
    service
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!participant?.active) {
    return NextResponse.json({ ok: false, error: 'Fuera del piloto' }, { status: 403 })
  }

  const { error } = await service.from('pilot_usage_events').insert({
    profile_id: user.id,
    event_name: body.eventName,
    route,
    session_id: sessionId,
    metadata: {
      role: profile?.rol || 'servidor',
      standalone,
    },
  })

  if (error) {
    console.error('pilot_telemetry_insert_failed', {
      code: error.code,
      message: error.message,
      eventName: body.eventName,
      route,
    })
    return NextResponse.json({ ok: false, error: 'No se pudo registrar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
