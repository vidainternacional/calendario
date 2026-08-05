'use client'

import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useMemo, useRef } from 'react'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioMultiDayView.module.css'

const HOUR_HEIGHT = 64
const DAYS_VISIBLE = 3

export default function CalendarioMultiDayView({
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
  const viewportRef = useRef<HTMLDivElement>(null)
  const days = useMemo(
    () => Array.from({ length: DAYS_VISIBLE }, (_, index) => addDays(selectedDay, index)),
    [selectedDay],
  )

  useEffect(() => {
    if (!viewportRef.current) return
    const hour = isSameDay(selectedDay, new Date()) ? Math.max(new Date().getHours() - 2, 0) : 7
    viewportRef.current.scrollTop = hour * HOUR_HEIGHT
  }, [selectedDay])

  const allDay = events.filter((event) => event.todo_el_dia && days.some((day) => isSameDay(new Date(event.fecha_inicio), day)))

  return (
    <section className={styles.surface} aria-label="Vista de varios días">
      <header className={styles.daysHeader}>
        <div className={styles.timeSpacer} />
        {days.map((day) => (
          <button key={day.toISOString()} className={styles.dayHeader} onClick={() => onSelectDay(day)}>
            <span>{format(day, 'EEE', { locale: es })}</span>
            <strong className={isSameDay(day, new Date()) ? styles.today : ''}>{format(day, 'd')}</strong>
          </button>
        ))}
      </header>

      {allDay.length > 0 && (
        <div className={styles.allDayBand}>
          <span className={styles.allDayLabel}>Todo el día</span>
          <div className={styles.allDayColumns}>
            {days.map((day) => (
              <div key={day.toISOString()} className={styles.allDayColumn}>
                {allDay.filter((event) => isSameDay(new Date(event.fecha_inicio), day)).map((event) => (
                  <button
                    key={event.asignacion_id}
                    className={styles.allDayEvent}
                    style={{ borderColor: eventColor(event), color: eventColor(event) }}
                    onClick={() => onOpenEvent(event)}
                  >
                    {event.titulo}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={viewportRef} className={styles.viewport}>
        <div className={styles.timeline} style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          <div className={styles.hours}>
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className={styles.hour} style={{ top: `${hour * HOUR_HEIGHT - 8}px` }}>
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            ))}
          </div>
          <div className={styles.columns}>
            {days.map((day) => (
              <div key={day.toISOString()} className={styles.dayColumn}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <span key={hour} className={styles.hourLine} style={{ top: `${hour * HOUR_HEIGHT}px` }} />
                ))}
                {events
                  .filter((event) => !event.todo_el_dia && isSameDay(new Date(event.fecha_inicio), day))
                  .map((event) => {
                    const start = new Date(event.fecha_inicio)
                    const end = event.fecha_fin ? new Date(event.fecha_fin) : addDays(start, 0)
                    const startMinutes = differenceInMinutes(start, startOfDay(start))
                    const duration = Math.max(differenceInMinutes(end, start), 30)
                    const color = eventColor(event)
                    return (
                      <button
                        key={event.asignacion_id}
                        className={styles.timedEvent}
                        style={{
                          top: `${(startMinutes / 60) * HOUR_HEIGHT + 2}px`,
                          height: `${Math.max((duration / 60) * HOUR_HEIGHT - 4, 34)}px`,
                          borderColor: color,
                          backgroundColor: `${color}1F`,
                        }}
                        onClick={() => onOpenEvent(event)}
                      >
                        <strong style={{ color }}>{event.titulo}</strong>
                        <span>{format(start, 'h:mm a')}</span>
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
