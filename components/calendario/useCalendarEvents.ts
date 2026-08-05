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

        const visibleCalendarIds = normalizedSubscriptions
          .filter((item) => item.visible && item.calendars)
          .map((item) => item.calendar_id)

        if (cancelled) return
        setSubscriptions(normalizedSubscriptions)

        if (visibleCalendarIds.length === 0) {
          setEvents([])
          return
        }

        const [eventsResult, remindersResult] = await Promise.all([
          db
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
              calendars!inner (
                id,
                nombre,
                color,
                owner_id,
                tipo_cuenta,
                es_publico,
                ministerio_id
              ),
              ministerios (nombre)
            `)
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

        if (eventsResult.error) throw eventsResult.error
        if (remindersResult.error) throw remindersResult.error

        const eventRows = (eventsResult.data || []) as any[]
        const eventIds = eventRows.map((item) => item.id)
        const assignmentMap = new Map<string, { id: string; estado: string }>()

        if (eventIds.length > 0) {
          const { data: assignmentsData, error: assignmentsError } = await db
            .from('evento_asignaciones')
            .select('id, evento_id, estado')
            .eq('profile_id', userId)
            .in('evento_id', eventIds)

          if (assignmentsError) throw assignmentsError
          for (const assignment of assignmentsData || []) {
            assignmentMap.set(String(assignment.evento_id), {
              id: String(assignment.id),
              estado: String(assignment.estado || 'asignado'),
            })
          }
        }

        const eventItems: EventoCalendario[] = eventRows.map((row) => {
          const assignment = assignmentMap.get(String(row.id))
          return {
            kind: 'event',
            id: String(row.id),
            titulo: String(row.titulo),
            descripcion: row.descripcion || null,
            ubicacion: row.ubicacion || null,
            fecha_inicio: String(row.fecha_inicio),
            fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
            todo_el_dia: Boolean(row.todo_el_dia),
            tiempo_viaje_minutos: Number(row.tiempo_viaje_minutos || 0),
            calendar_id: String(row.calendar_id),
            calendars: asCalendar(row.calendars),
            ministerio_id: row.ministerio_id || null,
            ministerios: row.ministerios || null,
            asignacion_id: assignment?.id || null,
            estadoAsignacion: assignment?.estado || null,
          }
        })

        const reminderItems: EventoCalendario[] = (remindersResult.data || []).map((row: any) => ({
          kind: 'reminder',
          id: String(row.id),
          titulo: String(row.title),
          descripcion: row.notes || null,
          ubicacion: null,
          fecha_inicio: String(row.remind_at),
          fecha_fin: null,
          todo_el_dia: true,
          tiempo_viaje_minutos: 0,
          calendar_id: String(row.calendar_id),
          calendars: asCalendar(row.calendars),
          ministerio_id: row.calendars?.ministerio_id || null,
          ministerios: null,
          asignacion_id: null,
          estadoAsignacion: null,
        }))

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
