import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventoDirectoClient from '@/components/calendario/EventoDirectoClient'
import type { CalendarioOrigen, EventoCalendario } from '@/components/calendario/calendario-ios-types'

export const metadata: Metadata = {
  title: 'Recordatorio',
}

export const dynamic = 'force-dynamic'

export default async function RecordatorioDirectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row, error } = await (supabase as any)
    .from('calendar_reminders')
    .select('id,title,notes,remind_at,calendar_id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[RecordatorioDirectoPage] No se pudo cargar el recordatorio', error)
  }
  if (!row) notFound()

  let calendar: CalendarioOrigen | null = null
  const { data: calendarRow } = await (supabase as any)
    .from('calendars')
    .select('id,nombre,color,owner_id,tipo_cuenta,es_publico,ministerio_id')
    .eq('id', row.calendar_id)
    .maybeSingle()

  if (calendarRow) {
    calendar = {
      id: String(calendarRow.id),
      nombre: String(calendarRow.nombre || 'Vida Internacional'),
      color: String(calendarRow.color || '#5B3DF5'),
      owner_id: calendarRow.owner_id || null,
      tipo_cuenta: (calendarRow.tipo_cuenta || 'interno') as CalendarioOrigen['tipo_cuenta'],
      es_publico: Boolean(calendarRow.es_publico),
      ministerio_id: calendarRow.ministerio_id || null,
      visible: true,
    }
  }

  const event: EventoCalendario = {
    kind: 'reminder',
    id: String(row.id),
    titulo: String(row.title),
    descripcion: row.notes || null,
    ubicacion: null,
    fecha_inicio: String(row.remind_at),
    fecha_fin: null,
    todo_el_dia: false,
    tiempo_viaje_minutos: 0,
    calendar_id: String(row.calendar_id),
    calendar_ids: [String(row.calendar_id)],
    calendars: calendar,
    ministerio_id: calendar?.ministerio_id || null,
    ministerios: null,
    asignacion_id: null,
    estadoAsignacion: null,
  }

  return <EventoDirectoClient event={event} />
}
