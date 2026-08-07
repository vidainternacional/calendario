'use client'

import { format, isBefore, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useMemo } from 'react'
import CalendarioEventRow from './CalendarioEventRow'
import { eventKey, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioAgendaView.module.css'

type AgendaGroup = {
  key: string
  day: Date
  events: EventoCalendario[]
}

export default function CalendarioAgendaView({
  selectedDay,
  events,
  onSelectDay,
  onOpenEvent,
}: {
  selectedDay: Date
  events: EventoCalendario[]
  onSelectDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const groups = useMemo<AgendaGroup[]>(() => {
    const start = startOfDay(selectedDay)
    const byDay = new Map<string, AgendaGroup>()

    for (const event of events) {
      const date = new Date(event.fecha_inicio)
      if (Number.isNaN(date.getTime()) || isBefore(date, start)) continue

      const key = format(date, 'yyyy-MM-dd')
      const current = byDay.get(key)
      if (current) {
        current.events.push(event)
      } else {
        byDay.set(key, { key, day: startOfDay(date), events: [event] })
      }
    }

    return [...byDay.values()]
      .sort((a, b) => a.day.getTime() - b.day.getTime())
      .map((group) => ({
        ...group,
        events: [...group.events].sort(
          (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
        ),
      }))
  }, [events, selectedDay])

  if (groups.length === 0) {
    return <div className={styles.empty}>No hay eventos próximos desde esta fecha.</div>
  }

  return (
    <div className={styles.agenda} aria-label="Lista de eventos próximos">
      {groups.map((group) => (
        <section key={group.key} className={styles.section}>
          <button
            type="button"
            className={`${styles.dateHeader} ${isToday(group.day) ? styles.dateHeaderToday : ''}`}
            onClick={() => onSelectDay(group.day)}
            aria-label={`Seleccionar ${format(group.day, "EEEE d 'de' MMMM", { locale: es })}`}
          >
            {format(group.day, 'EEEE – d MMM', { locale: es })}
          </button>
          {group.events.map((event) => (
            <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={onOpenEvent} />
          ))}
        </section>
      ))}
    </div>
  )
}
