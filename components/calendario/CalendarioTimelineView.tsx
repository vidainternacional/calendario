'use client'

import {
  addHours,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useRef } from 'react'
import CalendarioEventRow from './CalendarioEventRow'
import {
  eventColor,
  eventosDelDia,
  HOUR_HEIGHT,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import selection from './CalendarioSelection.module.css'

export function WeekStrip({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: Date
  onSelectDay: (day: Date) => void
}) {
  const start = startOfWeek(selectedDay, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 0 }) })

  return (
    <div className={styles.weekStrip}>
      {days.map((day) => {
        const selected = isSameDay(day, selectedDay)
        const today = isToday(day)
        const numberClass = today
          ? `${styles.weekDayNumber} ${selection.todayFilled}`
          : selected
            ? `${styles.weekDayNumber} ${selection.weekNumberSelectedRing}`
            : styles.weekDayNumber

        return (
          <button
            key={day.toISOString()}
            className={styles.weekDay}
            onClick={() => onSelectDay(day)}
            aria-pressed={selected}
          >
            <span className={styles.weekDayName}>{format(day, 'EEEEE', { locale: es })}</span>
            <span className={numberClass}>{format(day, 'd')}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Timeline({
  day,
  events,
  onOpenEvent,
}: {
  day: Date
  events: EventoCalendario[]
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dayEvents = eventosDelDia(events, day)
  const allDay = dayEvents.filter((event) => event.todo_el_dia)
  const timed = dayEvents.filter((event) => !event.todo_el_dia)
  const now = new Date()
  const currentTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT

  useEffect(() => {
    if (!viewportRef.current) return
    viewportRef.current.scrollTop = (isToday(day) ? Math.max(new Date().getHours() - 2, 0) : 7) * HOUR_HEIGHT
  }, [day])

  return (
    <>
      {allDay.length > 0 && (
        <div className={styles.allDayBand}>
          <p className={styles.allDayLabel}>Todo el día</p>
          {allDay.map((event) => (
            <CalendarioEventRow key={event.asignacion_id} evento={event} onOpen={onOpenEvent} />
          ))}
        </div>
      )}
      <div ref={viewportRef} className={styles.timelineViewport}>
        <div className={styles.timeline} style={{ minHeight: `${24 * HOUR_HEIGHT}px` }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour}>
              <span className={styles.hourLabel} style={{ top: `${hour * HOUR_HEIGHT}px` }}>
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
              <span className={styles.hourLine} style={{ top: `${hour * HOUR_HEIGHT}px` }} />
            </div>
          ))}

          {timed.map((event) => {
            const start = new Date(event.fecha_inicio)
            const end = event.fecha_fin ? new Date(event.fecha_fin) : addHours(start, 1)
            const minutes = start.getHours() * 60 + start.getMinutes()
            const duration = Math.max((end.getTime() - start.getTime()) / 60000, 30)
            const color = eventColor(event)
            return (
              <button
                key={event.asignacion_id}
                className={styles.timelineEvent}
                onClick={() => onOpenEvent(event)}
                style={{
                  top: `${(minutes / 60) * HOUR_HEIGHT + 3}px`,
                  height: `${Math.max((duration / 60) * HOUR_HEIGHT - 6, 38)}px`,
                  borderLeft: `4px solid ${color}`,
                  backgroundColor: `${color}1d`,
                }}
              >
                <span className={styles.timelineEventTitle} style={{ color }}>{event.titulo}</span>
                <span className={styles.timelineEventTime}>{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</span>
              </button>
            )
          })}

          {isToday(day) && (
            <div className={styles.currentTimeLine} style={{ top: `${currentTop}px` }}>
              <span className={styles.currentTimeDot} />
              <span className={styles.currentTimeLabel}>{format(now, 'h:mm')}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
