'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { eventColor, eventosDelDia, WEEKDAY_LABELS, type EventoCalendario } from './calendario-ios-types'
import basic from './CalendarioBasic.module.css'

export type MonthDisplayMode = 'compact' | 'stacked' | 'details'

const MONTHS_BEFORE = 6
const MONTHS_AFTER = 18
const MONTH_TOP_OFFSET = 116

function weeksForMonth(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })

  return Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
}

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  displayMode,
  topChrome,
  isRefreshing,
  overlay = false,
  showFollowingMonth = true,
  openDayOnSelect = true,
  footer,
  onSelectDay,
  onOpenDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  displayMode: MonthDisplayMode
  topChrome: ReactNode
  isRefreshing: boolean
  dayPanelOpen: boolean
  overlay?: boolean
  showFollowingMonth?: boolean
  openDayOnSelect?: boolean
  footer?: ReactNode
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const monthViewRef = useRef<HTMLDivElement | null>(null)
  const activeMonthRef = useRef<HTMLElement | null>(null)
  const positionedMonthRef = useRef<string | null>(null)
  const baseMonth = startOfMonth(month)
  const baseMonthKey = format(baseMonth, 'yyyy-MM')

  const visibleMonths = useMemo(() => {
    if (!showFollowingMonth) return [baseMonth]

    return Array.from(
      { length: MONTHS_BEFORE + MONTHS_AFTER + 1 },
      (_, index) => addMonths(baseMonth, index - MONTHS_BEFORE),
    )
  }, [baseMonthKey, showFollowingMonth])

  useLayoutEffect(() => {
    if (positionedMonthRef.current === baseMonthKey || !activeMonthRef.current) return
    positionedMonthRef.current = baseMonthKey

    const html = document.documentElement
    const previousBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    const align = () => {
      const target = activeMonthRef.current
      if (!target) return
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - MONTH_TOP_OFFSET)
      window.scrollTo({ top, behavior: 'auto' })
    }

    align()
    const firstFrame = window.requestAnimationFrame(() => {
      align()
      window.requestAnimationFrame(align)
    })
    const settleTimer = window.setTimeout(align, 140)
    void document.fonts?.ready.then(align)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.clearTimeout(settleTimer)
      html.style.scrollBehavior = previousBehavior
    }
  }, [baseMonthKey])

  return (
    <div ref={monthViewRef} className={basic.monthView} aria-hidden={overlay || undefined} aria-busy={isRefreshing || undefined}>
      <div className={basic.monthStickyChrome}>{topChrome}</div>

      <div className={basic.weekdays} aria-hidden="true">
        <span className={basic.weekNumberHeader} />
        {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>

      <div className={basic.monthScroll}>
        {visibleMonths.map((visibleMonth) => {
          const weeks = weeksForMonth(visibleMonth)
          const isBaseMonth = isSameMonth(visibleMonth, baseMonth)

          return (
            <section
              key={visibleMonth.toISOString()}
              ref={isBaseMonth ? activeMonthRef : undefined}
              className={`${basic.monthSection} ${isBaseMonth ? basic.activeMonthSection : ''}`}
              aria-label={format(visibleMonth, 'MMMM yyyy', { locale: es })}
            >
              <header className={basic.monthHeader}>
                <h1 className={basic.monthTitle}>{format(visibleMonth, 'MMMM', { locale: es })}</h1>
              </header>

              <div className={`${basic.monthGrid} ${displayMode === 'details' ? basic.monthGridDetails : ''}`}>
                {weeks.map((week) => (
                  <div
                    key={week[0].toISOString()}
                    className={`${basic.monthWeekRow} ${displayMode === 'details' ? basic.monthWeekRowDetails : ''}`}
                  >
                    <span className={basic.weekNumber} aria-hidden="true">
                      {getWeek(week[0], { weekStartsOn: 0, firstWeekContainsDate: 1 })}
                    </span>

                    {week.map((day) => {
                      const belongs = isSameMonth(day, visibleMonth)
                      const selected = belongs && isSameDay(day, selectedDay)
                      const today = belongs && isToday(day)
                      const dayEvents = belongs ? eventosDelDia(events, day) : []
                      const uniqueColors = [...new Map(dayEvents.map((event) => [event.calendar_id, eventColor(event)])).values()]

                      if (!belongs) {
                        return <span key={day.toISOString()} className={basic.monthDayEmpty} aria-hidden="true" />
                      }

                      const handleDayPress = () => {
                        if (selected && openDayOnSelect) {
                          onOpenDay(day)
                          return
                        }

                        onSelectDay(day)
                      }

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          className={`${basic.monthDay} ${displayMode === 'details' ? basic.monthDayDetails : ''}`}
                          onClick={handleDayPress}
                          aria-pressed={selected}
                          aria-current={today ? 'date' : undefined}
                          aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}${selected && openDayOnSelect ? ', volver a tocar para abrir vista del día' : ''}`}
                        >
                          <span className={`${basic.dayNumber} ${selected && !today ? basic.daySelected : ''} ${today ? basic.dayToday : ''}`}>
                            {format(day, 'd')}
                          </span>

                          {displayMode === 'compact' && (
                            <span className={basic.eventDots} aria-hidden="true">
                              {uniqueColors.slice(0, 3).map((color, index) => (
                                <span key={`${color}-${index}`} className={basic.eventDot} style={{ backgroundColor: color }} />
                              ))}
                            </span>
                          )}

                          {displayMode === 'stacked' && (
                            <span className={basic.eventBars} aria-hidden="true">
                              {dayEvents.slice(0, 3).map((event, index) => (
                                <span
                                  key={`${event.id || event.fecha_inicio}-${index}`}
                                  className={basic.eventBar}
                                  style={{ backgroundColor: eventColor(event) }}
                                />
                              ))}
                              {dayEvents.length > 3 && <span className={basic.eventMore}>+{dayEvents.length - 3}</span>}
                            </span>
                          )}

                          {displayMode === 'details' && (
                            <span className={basic.eventDetails} aria-hidden="true">
                              {dayEvents.slice(0, 2).map((event, index) => {
                                const color = eventColor(event)
                                return (
                                  <span
                                    key={`${event.id || event.fecha_inicio}-${index}`}
                                    className={basic.eventChip}
                                    style={{ borderColor: color, color }}
                                  >
                                    {event.titulo}
                                  </span>
                                )
                              })}
                              {dayEvents.length > 2 && <span className={basic.eventMore}>+{dayEvents.length - 2}</span>}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {footer}
      </div>
    </div>
  )
}
