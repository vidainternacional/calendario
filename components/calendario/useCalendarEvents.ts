'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CalendarioOrigen, EventoCalendario } from './calendario-ios-types'

export type CalendarSubscription = {
  calendar_id: string
  visible: boolean
  can_edit: boolean
  calendars: CalendarioOrigen | null
}

type UseCalendarEventsArgs = {
  userId: string
  rangeStart: Date
  rangeEnd: Date
  refreshToken?: number
}

function asCalendar(value: any): CalendarioOrigen | null {
  if (!value?.id) return null
  return {
    id: String(value.id),
    nombre: String(value.nombre || 'Calendario'),
    color: String(value.color || '#5B3DF5'),
    tipo_cuenta: value.tipo_cuenta || 'interno',
    es_publico: Boolean(value.es_publico),
    ministerio_id: value.ministerio_id || null,
    owner_id: value.owner_id || null,
  }
}

const EVENT_SELECT = `
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
`

export function useCalendarEvents({
  userId,
  rangeStart,
  rangeEnd,
  refreshToken = 0,
}: UseCalendarEventsArgs) {
  const [events, setEvents] = useState<EventoCalendario[]>([])
  const [subscriptions, setSubscriptions] = useState<CalendarSubscription[]>([])
  const [isRefreshing, setIsRefreshing] = useState(true)
  const [error, setError] = useState('')
  const [localRefresh, setLocalRefresh] = useState(0)

  const reload = useCallback(() => setLocalRefresh((value) => value + 1), [])

  // Un calendario compartido puede cambiar mientras la PWA permanece abierta.
  // Revalidamos al volver a primer plano/recuperar conexión y de forma periódica
  // mientras esta pantalla está visible para que ningún usuario quede con una
  // agenda obsoleta por haber dejado la app abierta.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    const handleFocus = () => reload()
    const handleOnline = () => reload()

    const interval = window.setInterval(refreshIfVisible, 30_000)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [reload])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsRefreshing(true)
      setError('')
      const db = createClient() as any

      try {
        const { data: subscriptionsData, error: subscriptionsError } = await db
          .from('calendar_subscriptions')
          .select(`
            calendar_id,
            visible,
            can_edit,
            calendars (
              id,
              nombre,
              color,
              owner_id,
              tipo_cuenta,
              es_publico,
              ministerio_id
            )
          `)
          .eq('user_id', userId)
          .order('created_at')

        if (subscriptionsError) throw subscriptionsError

        const normalizedSubscriptions = (subscriptionsData || []).map((item: any) => ({
          calendar_id: String(item.calendar_id),
          visible: Boolean(item.visible),
          can_edit: Boolean(item.can_edit),
          calendars: asCalendar(item.calendars),
        })) as CalendarSubscription[]

        const visibleSubscriptions = normalizedSubscriptions.filter((item) => item.visible && item.calendars)
        const visibleCalendarIds = visibleSubscriptions.map((item) => item.calendar_id)
        const calendarLookup = new Map(
          normalizedSubscriptions
            .filter((item) => item.calendars)
            .map((item) => [item.calendar_id, item.calendars!] as const),
        )

        if (cancelled) return
        setSubscriptions(normalizedSubscriptions)

        if (visibleCalendarIds.length === 0) {
          setEvents([])
          return
        }

        // Cargamos por las dos rutas válidas del modelo:
        // 1) evento_calendarios para eventos compartidos entre calendarios;
        // 2) eventos.calendar_id como respaldo del calendario principal.
        // Así un vínculo auxiliar incompleto nunca vuelve invisible una fecha real.
        const [linksResult, directEventsResult, remindersResult] = await Promise.all([
          db
            .from('evento_calendarios')
            .select('evento_id, calendar_id')
            .in('calendar_id', visibleCalendarIds),
          db
            .from('eventos')
            .select(EVENT_SELECT)
            .in('calendar_id', visibleCalendarIds)
            .gte('fecha_inicio', rangeStart.toISOString())
            .lt('fecha_inicio', rangeEnd.toISOString())
            .order('fecha_inicio', { ascending: true }),
          db
            .from('calendar_reminders')
            .select(`
              id,
              title,
              notes,
              remind_at,
              calendar_id,
              calendars!inner (
                id,
                nombre,
                color,
                owner_id,
                tipo_cuenta,
                es_publico,
                ministerio_id
              )
            `)
            .in('calendar_id', visibleCalendarIds)
            .gte('remind_at', rangeStart.toISOString())
            .lt('remind_at', rangeEnd.toISOString())
            .order('remind_at', { ascending: true }),
        ])

        if (linksResult.error) throw linksResult.error
        if (directEventsResult.error) throw directEventsResult.error
        if (remindersResult.error) throw remindersResult.error

        const eventCalendarMap = new Map<string, string[]>()
        for (const link of linksResult.data || []) {
          const eventId = String(link.evento_id)
          const calendarId = String(link.calendar_id)
          const current = eventCalendarMap.get(eventId) || []
          if (!current.includes(calendarId)) current.push(calendarId)
          eventCalendarMap.set(eventId, current)
        }

        const directEventRows = directEventsResult.data || []
        const directEventIds = new Set<string>()
        for (const row of directEventRows) {
          const eventId = String(row.id)
          const calendarId = String(row.calendar_id)
          directEventIds.add(eventId)
          const current = eventCalendarMap.get(eventId) || []
          if (calendarId && !current.includes(calendarId)) current.push(calendarId)
          eventCalendarMap.set(eventId, current)
        }

        const linkedOnlyEventIds = Array.from(eventCalendarMap.keys()).filter((id) => !directEventIds.has(id))
        let linkedEventRows: any[] = []

        if (linkedOnlyEventIds.length > 0) {
          const { data: eventsData, error: eventsError } = await db
            .from('eventos')
            .select(EVENT_SELECT)
            .in('id', linkedOnlyEventIds)
            .gte('fecha_inicio', rangeStart.toISOString())
            .lt('fecha_inicio', rangeEnd.toISOString())
            .order('fecha_inicio', { ascending: true })

          if (eventsError) throw eventsError
          linkedEventRows = eventsData || []
        }

        const rowsById = new Map<string, any>()
        for (const row of [...directEventRows, ...linkedEventRows]) {
          rowsById.set(String(row.id), row)
        }
        const eventRows = Array.from(rowsById.values())

        const eventIds = eventRows.map((item) => String(item.id))
        const assignmentMap = new Map<string, { id: string; estado: string }>()
        if (eventIds.length > 0) {
          const { data: assignmentsData, error: assignmentsError } = await db
            .from('evento_asignaciones')
            .select('id, evento_id, estado')
            .eq('profile_id', userId)
            .in('evento_id', eventIds)

          if (assignmentsError) throw assignmentsError
          for (const assignment of assignmentsData || []) {
            const eventId = String(assignment.evento_id)
            if (!assignmentMap.has(eventId)) {
              assignmentMap.set(eventId, {
                id: String(assignment.id),
                estado: String(assignment.estado || 'asignado'),
              })
            }
          }
        }

        const eventItems: EventoCalendario[] = eventRows.map((row) => {
          const eventId = String(row.id)
          const assignment = assignmentMap.get(eventId)
          const linkedCalendarIds = eventCalendarMap.get(eventId) || [String(row.calendar_id)]
          const visibleLinkedCalendarId = linkedCalendarIds.find((id) => visibleCalendarIds.includes(id))
          const displayCalendarId = visibleCalendarIds.includes(String(row.calendar_id))
            ? String(row.calendar_id)
            : (visibleLinkedCalendarId || String(row.calendar_id))

          return {
            kind: 'event',
            id: eventId,
            titulo: String(row.titulo),
            descripcion: row.descripcion || null,
            ubicacion: row.ubicacion || null,
            fecha_inicio: String(row.fecha_inicio),
            fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
            todo_el_dia: Boolean(row.todo_el_dia),
            tiempo_viaje_minutos: Number(row.tiempo_viaje_minutos || 0),
            calendar_id: displayCalendarId,
            calendar_ids: linkedCalendarIds,
            calendars: calendarLookup.get(displayCalendarId) || null,
            ministerio_id: row.ministerio_id || null,
            ministerios: row.ministerios || null,
            asignacion_id: assignment?.id || null,
            estadoAsignacion: assignment?.estado || null,
          }
        })

        const reminderItems: EventoCalendario[] = (remindersResult.data || []).map((row: any) => {
          const remindAt = new Date(row.remind_at)
          return {
            kind: 'reminder',
            id: String(row.id),
            titulo: String(row.title),
            descripcion: row.notes || null,
            ubicacion: null,
            fecha_inicio: remindAt.toISOString(),
            fecha_fin: new Date(remindAt.getTime() + 30 * 60 * 1000).toISOString(),
            todo_el_dia: false,
            tiempo_viaje_minutos: 0,
            calendar_id: String(row.calendar_id),
            calendar_ids: [String(row.calendar_id)],
            calendars: asCalendar(row.calendars),
            ministerio_id: row.calendars?.ministerio_id || null,
            ministerios: null,
            asignacion_id: null,
            estadoAsignacion: null,
          }
        })

        if (!cancelled) {
          setEvents([...eventItems, ...reminderItems].sort(
            (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
          ))
        }
      } catch (loadError) {
        console.error('[useCalendarEvents]', loadError)
        if (!cancelled) {
          setEvents([])
          setError('No fue posible cargar los calendarios y eventos.')
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, rangeStart.getTime(), rangeEnd.getTime(), refreshToken, localRefresh])

  const editableCalendars = useMemo(
    () => subscriptions
      .filter((item) => item.can_edit && item.calendars)
      .map((item) => ({ ...item.calendars!, can_edit: true, visible: item.visible })),
    [subscriptions],
  )

  return {
    events,
    subscriptions,
    editableCalendars,
    isRefreshing,
    error,
    reload,
  }
}
