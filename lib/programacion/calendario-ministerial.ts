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
  const sourceIdSet = new Set(sourceIds)
  const calendarMap = new Map(sourceCalendars.map((item) => [String(item.id), item] as const))

  if (sourceIds.length === 0) {
    return {
      ministerioCalendar,
      publicCalendars: publicRows,
      items: [] as ProgramacionCalendarItem[],
    }
  }

  // FASE G: primero limita por el mes visible. Antes se leían todos los vínculos
  // históricos de evento_calendarios y solo después se filtraban los eventos por fecha.
  const [eventsReq, remindersReq] = await Promise.all([
    admin
      .from('eventos')
      .select('id,titulo,descripcion,ubicacion,fecha_inicio,fecha_fin,calendar_id,ministerio_id')
      .gte('fecha_inicio', start)
      .lt('fecha_inicio', end)
      .order('fecha_inicio'),
    admin
      .from('calendar_reminders')
      .select('id,title,notes,remind_at,calendar_id')
      .in('calendar_id', sourceIds)
      .gte('remind_at', start)
      .lt('remind_at', end)
      .order('remind_at'),
  ])

  if (eventsReq.error) throw eventsReq.error
  if (remindersReq.error) throw remindersReq.error

  const candidateEvents = (eventsReq.data || []) as any[]
  const candidateIds = candidateEvents.map((row) => String(row.id)).filter(Boolean)
  let linkRows: any[] = []

  if (candidateIds.length > 0) {
    const { data = [], error } = await admin
      .from('evento_calendarios')
      .select('evento_id,calendar_id')
      .in('evento_id', candidateIds)
      .in('calendar_id', sourceIds)
    if (error) throw error
    linkRows = data || []
  }

  const eventCalendarMap = new Map<string, string[]>()
  for (const row of linkRows) {
    const eventId = String(row.evento_id)
    const calendarId = String(row.calendar_id)
    eventCalendarMap.set(eventId, [
      ...(eventCalendarMap.get(eventId) || []).filter((id) => id !== calendarId),
      calendarId,
    ])
  }

  const publicIds = new Set(publicRows.map((item) => String(item.id)))
  const ministerioCalendarId = ministerioCalendar ? String(ministerioCalendar.id) : null

  const eventItems = candidateEvents
    .map((row: any): ProgramacionCalendarItem | null => {
      const directCalendarId = row.calendar_id ? String(row.calendar_id) : ''
      const linkedIds = eventCalendarMap.get(String(row.id)) || []
      const visibleIds = Array.from(new Set([
        ...(sourceIdSet.has(directCalendarId) ? [directCalendarId] : []),
        ...linkedIds,
      ]))
      const preparadoPorMinisterio = String(row.ministerio_id || '') === ministerioId

      if (visibleIds.length === 0 && !preparadoPorMinisterio) return null

      const displayCalendarId = visibleIds.find((id) => publicIds.has(id))
        || (ministerioCalendarId && visibleIds.includes(ministerioCalendarId) ? ministerioCalendarId : '')
        || visibleIds[0]
        || directCalendarId
        || ministerioCalendarId

      if (!displayCalendarId) return null

      const displayCalendar = calendarMap.get(displayCalendarId) || null
      const preparado = Boolean(
        (ministerioCalendarId && visibleIds.includes(ministerioCalendarId))
        || preparadoPorMinisterio,
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
        calendar_ids: visibleIds.length ? visibleIds : [displayCalendarId],
        calendar_nombre: displayCalendar?.nombre || 'Calendario',
        calendar_color: displayCalendar?.color || '#5B3DF5',
        publico: visibleIds.some((id) => publicIds.has(id)),
        preparado,
        ministerio_id: row.ministerio_id || null,
      }
    })
    .filter((item): item is ProgramacionCalendarItem => item !== null)

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
