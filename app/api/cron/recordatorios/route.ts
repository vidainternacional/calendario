import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/webpush'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Llamado cada hora por pg_cron (Supabase).
 * Envía recordatorios "mañana" (ventana 23.5h–24.5h) y "en 1 hora" (0.5h–1.5h).
 */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const ahora = Date.now()
  const h = 3600_000

  const ventanas = [
    { flag: 'notif_1d', desde: new Date(ahora + 23.5 * h), hasta: new Date(ahora + 24.5 * h), titulo: '📅 Evento mañana', cuando: 'mañana' },
    { flag: 'notif_1h', desde: new Date(ahora + 0.5 * h), hasta: new Date(ahora + 1.5 * h), titulo: '⏰ Comienza en 1 hora', cuando: 'en 1 hora' },
  ] as const

  let enviadas = 0

  for (const v of ventanas) {
    const { data: asignaciones } = await supabase
      .from('evento_asignaciones')
      .select('id, profile_id, eventos!inner ( id, titulo, ubicacion, fecha_inicio )')
      .eq(v.flag, false)
      .neq('estado', 'declinado')
      .gte('eventos.fecha_inicio', v.desde.toISOString())
      .lt('eventos.fecha_inicio', v.hasta.toISOString())

    for (const a of asignaciones ?? []) {
      const ev = Array.isArray(a.eventos) ? a.eventos[0] : a.eventos
      if (!ev) continue
      const hora = new Date(ev.fecha_inicio).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/El_Salvador' })
      await notifyUser(supabase, a.profile_id, {
        title: v.titulo,
        body: `${ev.titulo} — ${v.cuando} a las ${hora}${ev.ubicacion ? ` · ${ev.ubicacion}` : ''}`,
        url: '/calendario',
        tag: `recordatorio-${a.id}-${v.flag}`,
      })
      await supabase.from('evento_asignaciones').update({ [v.flag]: true }).eq('id', a.id)
      enviadas++
    }
  }

  return NextResponse.json({ ok: true, enviadas })
}
