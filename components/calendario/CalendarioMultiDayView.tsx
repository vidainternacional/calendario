'use client'

import { addDays, differenceInMinutes, format, isSameDay, startOfDay, startOfWeek } from 'date-fns'
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

const HOUR_HEIGHT = 66
const MIN_EVENT_MINUTES = 30
const MIN_DAY_WIDTH = 112
const TIME_COLUMN_WIDTH = 54

function triggerSoftHaptic() {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  navigator.vibrate(9)
}

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

function layoutOverlaps(items: EventoCalendario[], day: Date): PositionedItem[] {
  const dayStart = startOfDay(day)
  const nextDay = addDays(dayStart, 1)
  const sorted = items
    .map((event) => {
      const start = new Date(event.fecha_inicio)
      const rawEnd = itemEnd(event)
      return { event, start, end: rawEnd > nextDay ? nextDay : rawEnd }
    })
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
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const [now, setNow] = useState(() => new Date())
  const days = useMemo(
    () => Array.from({ length: daysVisible }, (_, index) => addDays(selectedDay, index)),
    [selectedDay, daysVisible],
  )
  const headerDays = useMemo(() => {
    if (daysVisible !== 1) return days
    const weekStart = startOfWeek(selectedDay, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [days, daysVisible, selectedDay])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    window.scrollTo({ top: 0, behavior: 'auto' })
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const referenceNow = new Date()
    const timedEvents = events
      .filter((event) => !event.todo_el_dia && isSameDay(new Date(event.fecha_inicio), selectedDay))
      .map((event) => new Date(event.fecha_inicio))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    let targetMinutes = 7 * 60
    if (timedEvents.length > 0) {
      let targetEvent = timedEvents[0]
      if (isSameDay(selectedDay, referenceNow)) {
        targetEvent = timedEvents.reduce((closest, candidate) => {
          const closestDistance = Math.abs(closest.getTime() - referenceNow.getTime())
          const candidateDistance = Math.abs(candidate.getTime() - referenceNow.getTime())
          return candidateDistance < closestDistance ? candidate : closest
        }, timedEvents[0])
      }
      targetMinutes = Math.max(differenceInMinutes(targetEvent, startOfDay(selectedDay)) - 45, 0)
    } else if (isSameDay(selectedDay, referenceNow)) {
      targetMinutes = Math.max(differenceInMinutes(referenceNow, startOfDay(referenceNow)) - 90, 0)
    }

    const targetTop = Math.max(0, (targetMinutes / 60) * HOUR_HEIGHT)
    const frame = window.requestAnimationFrame(() => {
      viewport.scrollTo({ top: targetTop, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedDay, daysVisible, events])

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (daysVisible !== 1 || event.touches.length !== 1) return
    swipeStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (daysVisible !== 1 || !start || event.changedTouches.length !== 1) return

    const end = event.changedTouches[0]
    const deltaX = end.clientX - start.x
    const deltaY = end.clientY - start.y
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return

    triggerSoftHaptic()
    onSelectDay(addDays(selectedDay, deltaX < 0 ? 1 : -1))
  }

  const allDay = events.filter(
    (event) => Boolean(event.todo_el_dia) && days.some((day) => isSameDay(new Date(event.fecha_inicio), day)),
  )
  const minimumWidth = daysVisible >= 5 ? TIME_COLUMN_WIDTH + daysVisible * MIN_DAY_WIDTH : undefined
  const headerGridTemplate = `${TIME_COLUMN_WIDTH}px repeat(${headerDays.length}, minmax(0, 1fr))`
  const currentMinutes = differenceInMinutes(now, startOfDay(now))
  const showCurrentTime = days.some((day) => isSameDay(day, now))
  const dayTitle = daysVisible === 1 ? format(selectedDay, 'EEEE – d MMM yyyy', { locale: es }) : null

  return (
    <section
      className={styles.surface}
      aria-label={daysVisible === 1 ? 'Vista de un día' : `Vista de ${daysVisible} días`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.horizontalScroller}>
        <div className={styles.canvas} style={{ minWidth: minimumWidth ? `${minimumWidth}px` : '100%' }}>
          <header className={styles.daysHeader} style={{ gridTemplateColumns: headerGridTemplate }}>
            <div className={styles.timeSpacer} />
            {headerDays.map((day) => {
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentDay = isSameDay(day, now)

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={styles.dayHeader}
                  onClick={() => { triggerSoftHaptic(); onSelectDay(day) }}
                  aria-label={format(day, "EEEE d 'de' MMMM", { locale: es })}
                  aria-pressed={isSelected}
                  aria-current={isCurrentDay ? 'date' : undefined}
                >
                  <span>{format(day, 'EEEEE', { locale: es })}</span>
                  <strong className={isCurrentDay ? styles.today : ''}>{format(day, 'd')}</strong>
                </button>
              )
            })}
          </header>

          {dayTitle && <div className={styles.dayTitle}>{dayTitle}</div>}

          {allDay.length > 0 && (
            <div className={styles.allDayBand} style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px 1fr` }}>
              <span className={styles.allDayLabel}>Todo el día</span>
              <div className={styles.allDayColumns} style={{ gridTemplateColumns: `repeat(${daysVisible}, minmax(0, 1fr))` }}>
                {days.map((day) => (
                  <div key={day.toISOString()} className={styles.allDayColumn}>
                    {allDay.filter((event) => isSameDay(new Date(event.fecha_inicio), day)).map((event) => (
                      <button
                        type="button"
                        key={eventKey(event)}
                        className={styles.allDayEvent}
                        style={{ borderColor: eventColor(event), color: eventColor(event) }}
                        onClick={() => { triggerSoftHaptic(); onOpenEvent(event) }}
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
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                ))}
              </div>

              {showCurrentTime && (
                <div className={styles.currentTimeLine} style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px`, left: `${TIME_COLUMN_WIDTH}px` }} aria-hidden="true">
                  <span className={styles.currentTimeLabel}>{format(now, 'h:mm')}</span>
                  <span className={styles.currentTimeDot} />
                </div>
              )}

              <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${daysVisible}, minmax(0, 1fr))` }}>
                {days.map((day) => {
                  const positioned = layoutOverlaps(
                    events.filter((event) => !event.todo_el_dia && isSameDay(new Date(event.fecha_inicio), day)),
                    day,
                  )

                  return (
                    <div key={day.toISOString()} className={styles.dayColumn}>
                      {Array.from({ length: 24 }, (_, hour) => (
                        <span key={hour} className={styles.hourLine} style={{ top: `${hour * HOUR_HEIGHT}px` }} />
                      ))}

                      {positioned.map(({ event, start, end, column, columns }) => {
                        const startMinutes = differenceInMinutes(start, startOfDay(start))
                        const rawDuration = Math.max(differenceInMinutes(end, start), 1)
                        const availableMinutes = Math.max(24 * 60 - startMinutes, 1)
                        const duration = Math.min(Math.max(rawDuration, MIN_EVENT_MINUTES), availableMinutes)
                        const color = eventColor(event)
                        const width = 100 / columns
                        const left = column * width
                        const naturalHeight = (duration / 60) * HOUR_HEIGHT - 4
                        const maximumHeight = (availableMinutes / 60) * HOUR_HEIGHT - 2
                        const eventHeight = Math.max(12, Math.min(Math.max(naturalHeight, 34), maximumHeight))

                        return (
                          <button
                            type="button"
                            key={eventKey(event)}
                            className={styles.timedEvent}
                            style={{
                              top: `${(startMinutes / 60) * HOUR_HEIGHT + 2}px`,
                              height: `${eventHeight}px`,
                              left: `calc(${left}% + 3px)`,
                              width: `calc(${width}% - 6px)`,
                              borderColor: color,
                              backgroundColor: `${color}16`,
                            }}
                            onClick={() => { triggerSoftHaptic(); onOpenEvent(event) }}
                            aria-label={`${event.titulo}, ${format(start, 'h:mm a')}`}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
