'use client'

import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { BellRing } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  eventColor,
  eventKey,
  type EventoCalendario,
  type TimelineDayCount,
} from './calendario-ios-types'
import styles from './CalendarioMultiDayView.module.css'

const HOUR_HEIGHT = 64
const MIN_EVENT_MINUTES = 30
const TIME_COLUMN_WIDTH = 58

type PositionedItem = {
  event: EventoCalendario
  start: Date
  end: Date
  column: number
  columns: number
}

function itemEnd(event: EventoCalendario) {
  const start = new Date(event.fecha_inicio)
  if (!event.fecha_fin) return new Date(start.getTime() + MIN_EVENT_MINUTES * 60 * 1000)
  const end = new Date(event.fecha_fin)
  if (Number.isNaN(end.getTime()) || end <= start) {
    return new Date(start.getTime() + MIN_EVENT_MINUTES * 60 * 1000)
  }
  return end
}

function layoutOverlaps(items: EventoCalendario[]): PositionedItem[] {
  const sorted = items
    .map((event) => ({ event, start: new Date(event.fecha_inicio), end: itemEnd(event) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime())

  const groups: Array<typeof sorted> = []
  let current: typeof sorted = []
  let currentEnd = 0

  for (const item of sorted) {
    const startTime = item.start.getTime()
    if (current.length > 0 && startTime >= currentEnd) {
      groups.push(current)
      current = []
      currentEnd = 0
    }
    current.push(item)
    currentEnd = Math.max(currentEnd, item.end.getTime())
  }
  if (current.length > 0) groups.push(current)

  return groups.flatMap((group) => {
    const columnEnds: number[] = []
    const assigned = group.map((item) => {
      let column = columnEnds.findIndex((end) => end <= item.start.getTime())
      if (column === -1) column = columnEnds.length
      columnEnds[column] = item.end.getTime()
      return { ...item, column }
    })
    const columns = Math.max(columnEnds.length, 1)
    return assigned.map((item) => ({ ...item, columns }))
  })
}

function minimumDayWidth(daysVisible: TimelineDayCount) {
  if (daysVisible === 7) return 56
  if (daysVisible === 5) return 76
  if (daysVisible === 3) return 104
  return 132
}

export default function CalendarioMultiDayView({
  selectedDay,
  events,
  daysVisible,
  onSelectDay,
  onOpenEvent,
}: {
  selectedDay: Date
  events: EventoCalendario[]
  daysVisible: TimelineDayCount
  onSelectDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => new Date())
  const days = useMemo(
    () => Array.from({ length: daysVisible }, (_, index) => addDays(selectedDay, index)),
    [selectedDay, daysVisible],
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!viewportRef.current) return
    const hour = isSameDay(selectedDay, new Date()) ? Math.max(new Date().getHours() - 2, 0) : 7
    viewportRef.current.scrollTo({ top: hour * HOUR_HEIGHT, behavior: 'auto' })
  }, [selectedDay, daysVisible])

  const allDay = events.filter(
    (event) => Boolean(event.todo_el_dia) && days.some((day) => isSameDay(new Date(event.fecha_inicio), day)),
  )
  const minimumWidth = TIME_COLUMN_WIDTH + daysVisible * minimumDayWidth(daysVisible)
  const gridTemplate = `${TIME_COLUMN_WIDTH}px repeat(${daysVisible}, minmax(0, 1fr))`
  const todayVisible = days.some((day) => isSameDay(day, now))
  const nowMinutes = differenceInMinutes(now, startOfDay(now))
  const rangeLabel = daysVisible === 1
    ? format(selectedDay, "EEEE — d 'de' MMMM", { locale: es })
    : `${format(days[0], 'd MMM', { locale: es })} – ${format(days[days.length - 1], 'd MMM', { locale: es })}`

  return (
    <section className={styles.surface} aria-label={daysVisible === 1 ? 'Vista de un día' : `Vista de ${daysVisible} días`}>
      <div className={styles.timelineTitle}>{rangeLabel}</div>
      <div className={styles.horizontalScroller}>
        <div className={styles.canvas} style={{ minWidth: `${minimumWidth}px` }}>
          <header className={styles.daysHeader} style={{ gridTemplateColumns: gridTemplate }}>
            <div className={styles.timeSpacer}>
              <span>{format(selectedDay, 'MMM', { locale: es })}</span>
            </div>
            {days.map((day) => {
              const today = isSameDay(day, now)
              const selected = isSameDay(day, selectedDay)
              return (
                <button key={day.toISOString()} className={styles.dayHeader} onClick={() => onSelectDay(day)}>
                  <span>{format(day, 'EEE', { locale: es })}</span>
                  <strong className={today ? styles.today : selected ? styles.selected : ''}>{format(day, 'd')}</strong>
                </button>
              )
            })}
          </header>

          {allDay.length > 0 && (
            <div className={styles.allDayBand} style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px 1fr` }}>
              <span className={styles.allDayLabel}>Todo el día</span>
              <div className={styles.allDayColumns} style={{ gridTemplateColumns: `repeat(${daysVisible}, minmax(0, 1fr))` }}>
                {days.map((day) => (
                  <div key={day.toISOString()} className={styles.allDayColumn}>
                    {allDay.filter((event) => isSameDay(new Date(event.fecha_inicio), day)).map((event) => (
                      <button
                        key={eventKey(event)}
                        className={styles.allDayEvent}
                        style={{ borderColor: eventColor(event), color: eventColor(event) }}
                        onClick={() => onOpenEvent(event)}
                      >
                        {event.kind === 'reminder' && <BellRing size={12} className="mr-1 inline" />}
                        {event.titulo}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={viewportRef} className={styles.viewport}>
            <div className={styles.timeline} style={{ height: `${24 * HOUR_HEIGHT}px`, gridTemplateColumns: `${TIME_COLUMN_WIDTH}px 1fr` }}>
              <div className={styles.hours}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <span key={hour} className={styles.hour} style={{ top: `${hour * HOUR_HEIGHT - 8}px` }}>
                    {hour === 0 ? '12 a. m.' : hour < 12 ? `${hour} a. m.` : hour === 12 ? '12 p. m.' : `${hour - 12} p. m.`}
                  </span>
                ))}
              </div>

              <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${daysVisible}, minmax(0, 1fr))` }}>
                {days.map((day) => {
                  const positioned = layoutOverlaps(
                    events.filter((event) => !event.todo_el_dia && isSameDay(new Date(event.fecha_inicio), day)),
                  )

                  return (
                    <div key={day.toISOString()} className={styles.dayColumn}>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <span key={hour} className={styles.hourLine} style={{ top: `${hour * HOUR_HEIGHT}px` }} />
                      ))}

                      {positioned.map(({ event, start, end, column, columns }) => {
                        const startMinutes = differenceInMinutes(start, startOfDay(start))
                        const duration = Math.max(differenceInMinutes(end, start), MIN_EVENT_MINUTES)
                        const color = eventColor(event)
                        const width = 100 / columns
                        const left = column * width

                        return (
                          <button
                            key={eventKey(event)}
                            className={styles.timedEvent}
                            style={{
                              top: `${(startMinutes / 60) * HOUR_HEIGHT + 2}px`,
                              height: `${Math.max((duration / 60) * HOUR_HEIGHT - 4, 34)}px`,
                              left: `calc(${left}% + 3px)`,
                              width: `calc(${width}% - 6px)`,
                              borderColor: color,
                              backgroundColor: `${color}24`,
                            }}
                            onClick={() => onOpenEvent(event)}
                          >
                            <strong style={{ color }}>
                              {event.kind === 'reminder' && <BellRing size={11} className="mr-1 inline" />}
                              {event.titulo}
                            </strong>
                            <span>{format(start, 'h:mm a')}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {todayVisible && (
                <span className={styles.currentTimeLine} style={{ top: `${(nowMinutes / 60) * HOUR_HEIGHT}px` }} aria-hidden="true">
                  <span className={styles.currentTimeLabel}>{format(now, 'h:mm')}</span>
                  <span className={styles.currentTimeDot} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
