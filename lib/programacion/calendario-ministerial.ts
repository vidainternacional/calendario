export type ProgramacionCalendarItem = {
  kind: 'event' | 'reminder'
  id: string
  titulo: string
  descripcion: string | null
  ubicacion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  calendar_id: string
  calendar_ids: string[]
  calendar_nombre: string
  calendar_color: string
  publico: boolean
  preparado: boolean
  ministerio_id: string | null
}

type CalendarRow = {
  id: string
  nombre: string
  color: string | null
  es_publico: boolean
  ministerio_id: string | null
}

export async function cargarCalendarioMinisterial(
  admin: any,
  ministerioId: string,
  start: string,
  end: string,
) {
  const [{ data: ministerioCalendars = [] }, { data: publicCalendars = [] }] = await Promise.all([
    admin
      .from('calendars')
      .select('id,nombre,color,es_publico,ministerio_id')
      .eq('ministerio_id', ministerioId)
      .order('created_at')
      .limit(1),
    admin
      .from('calendars')
      .select('id,nombre,color,es_publico,ministerio_id')
      .eq('es_publico', true)
      .order('created_at'),
  ])

  const ministerioCalendar = (ministerioCalendars as CalendarRow[])[0] || null
  const publicRows = publicCalendars as CalendarRow[]
  const sourceCalendars = [
    ...publicRows,
    ...(ministerioCalendar && !publicRows.some((item) => item.id === ministerioCalendar.id)
      ? [ministerioCalendar]
      : []),
  ]
  const sourceIds = sourceCalendars.map((item) => String(item.id))
  const calendarMap = new Map(sourceCalendars.map((item) => [String(item.id), item] as const))

  if (sourceIds.length === 0) {
    return {
      ministerioCalendar,
      publicCalendars: publicRows,
      items: [] as ProgramacionCalendarItem[],
    }
  }

  const [linksReq, remindersReq] = await Promise.all([
    admin
      .from('evento_calendarios')
      .select('evento_id,calendar_id')
      .in('calendar_id', sourceIds),
    admin
      .from('calendar_reminders')
      .select('id,title,notes,remind_at,calendar_id')
      .in('calendar_id', sourceIds)
      .gte('remind_at', start)
      .lt('remind_at', end)
      .order('remind_at'),
  ])

  if (linksReq.error) throw linksReq.error
  if (remindersReq.error) throw remindersReq.error

  const eventCalendarMap = new Map<string, string[]>()
  for (const row of linksReq.data || []) {
    const eventId = String(row.evento_id)
    const calendarId = String(row.calendar_id)
    eventCalendarMap.set(eventId, [
      ...(eventCalendarMap.get(eventId) || []).filter((id) => id !== calendarId),
      calendarId,
    ])
  }

  const eventIds = Array.from(eventCalendarMap.keys())
  let eventRows: any[] = []
  if (eventIds.length > 0) {
    const { data, error } = await admin
      .from('eventos')
      .select('id,titulo,descripcion,ubicacion,fecha_inicio,fecha_fin,calendar_id,ministerio_id')
      .in('id', eventIds)
      .gte('fecha_inicio', start)
      .lt('fecha_inicio', end)
      .order('fecha_inicio')
    if (error) throw error
    eventRows = data || []
  }

  const publicIds = new Set(publicRows.map((item) => String(item.id)))
  const ministerioCalendarId = ministerioCalendar ? String(ministerioCalendar.id) : null

  const eventItems: ProgramacionCalendarItem[] = eventRows.map((row: any) => {
    const linkedIds = eventCalendarMap.get(String(row.id)) || [String(row.calendar_id)]
    const displayCalendarId = linkedIds.find((id) => publicIds.has(id))
      || (ministerioCalendarId && linkedIds.includes(ministerioCalendarId) ? ministerioCalendarId : null)
      || String(row.calendar_id)
    const displayCalendar = calendarMap.get(displayCalendarId) || null
    const preparado = Boolean(
      (ministerioCalendarId && linkedIds.includes(ministerioCalendarId))
      || String(row.ministerio_id || '') === ministerioId,
    )

    return {
      kind: 'event',
      id: String(row.id),
      titulo: String(row.titulo || 'Evento'),
      descripcion: row.descripcion || null,
      ubicacion: row.ubicacion || null,
      fecha_inicio: String(row.fecha_inicio),
      fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
      calendar_id: displayCalendarId,
      calendar_ids: linkedIds,
      calendar_nombre: displayCalendar?.nombre || 'Calendario',
      calendar_color: displayCalendar?.color || '#5B3DF5',
      publico: linkedIds.some((id) => publicIds.has(id)),
      preparado,
      ministerio_id: row.ministerio_id || null,
    }
  })

  const reminderItems: ProgramacionCalendarItem[] = (remindersReq.data || []).map((row: any) => {
    const calendarId = String(row.calendar_id)
    const calendar = calendarMap.get(calendarId) || null
    const startDate = new Date(row.remind_at)
    return {
      kind: 'reminder',
      id: String(row.id),
      titulo: String(row.title || 'Recordatorio'),
      descripcion: row.notes || null,
      ubicacion: null,
      fecha_inicio: startDate.toISOString(),
      fecha_fin: new Date(startDate.getTime() + 30 * 60_000).toISOString(),
      calendar_id: calendarId,
      calendar_ids: [calendarId],
      calendar_nombre: calendar?.nombre || 'Calendario',
      calendar_color: calendar?.color || '#5B3DF5',
      publico: Boolean(calendar?.es_publico),
      preparado: false,
      ministerio_id: calendar?.ministerio_id || null,
    }
  })

  return {
    ministerioCalendar,
    publicCalendars: publicRows,
    items: [...eventItems, ...reminderItems].sort(
      (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    ),
  }
}
