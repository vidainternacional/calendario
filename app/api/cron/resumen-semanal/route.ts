import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/webpush'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Llamado cada lunes por pg_cron: "Tienes X eventos esta semana". */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const ahora = new Date()
  const en7dias = new Date(ahora.getTime() + 7 * 24 * 3600_000)

  const { data: asignaciones } = await supabase
    .from('evento_asignaciones')
    .select('profile_id, eventos!inner ( fecha_inicio )')
    .neq('estado', 'declinado')
    .gte('eventos.fecha_inicio', ahora.toISOString())
    .lt('eventos.fecha_inicio', en7dias.toISOString())

  const conteo = new Map<string, number>()
  for (const a of asignaciones ?? []) conteo.set(a.profile_id, (conteo.get(a.profile_id) ?? 0) + 1)

  let enviadas = 0
  for (const [profileId, n] of conteo) {
    await notifyUser(supabase, profileId, {
      title: '📅 Tu semana en Vida Internacional',
      body: n === 1 ? 'Tienes 1 evento esta semana. Toca para ver tu calendario.' : `Tienes ${n} eventos esta semana. Toca para ver tu calendario.`,
      url: '/calendario',
      tag: 'resumen-semanal',
    })
    enviadas++
  }

  return NextResponse.json({ ok: true, enviadas })
}
