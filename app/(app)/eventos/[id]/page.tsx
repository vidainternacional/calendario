import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventoDirectoClient from '@/components/calendario/EventoDirectoClient'
import type { CalendarioOrigen, EventoCalendario } from '@/components/calendario/calendario-ios-types'

export const metadata: Metadata = {
  title: 'Evento',
}

export const dynamic = 'force-dynamic'

export default async function EventoDirectoPage({
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
    .from('eventos')
    .select(`
      id,
      titulo,
      descripcion,
      ubicacion,
      fecha_inicio,
      fecha_fin,
      todo_el_dia,
      tiempo_viaje_minutos,
      calendar_id,
      ministerio_id,
      ministerios (nombre)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[EventoDirectoPage] No se pudo cargar el evento', error)
  }

  if (!row) notFound()

  let calendar: CalendarioOrigen | null = null
  if (row.calendar_id) {
    const { data: calendarRow } = await (supabase as any)
      .from('calendars')
      .select('id, nombre, color, owner_id, tipo_cuenta, es_publico, ministerio_id')
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
  }

  const event: EventoCalendario = {
    kind: 'event',
    id: String(row.id),
    titulo: String(row.titulo),
    descripcion: row.descripcion || null,
    ubicacion: row.ubicacion || null,
    fecha_inicio: String(row.fecha_inicio),
    fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
    todo_el_dia: Boolean(row.todo_el_dia),
    tiempo_viaje_minutos: Number(row.tiempo_viaje_minutos || 0),
    calendar_id: String(row.calendar_id || ''),
    calendar_ids: row.calendar_id ? [String(row.calendar_id)] : [],
    calendars: calendar,
    ministerio_id: row.ministerio_id || null,
    ministerios: row.ministerios || null,
    asignacion_id: null,
    estadoAsignacion: null,
  }

  return <EventoDirectoClient event={event} />
}
