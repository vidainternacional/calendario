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
import type { ReactNode } from 'react'
import { eventColor, eventosDelDia, WEEKDAY_LABELS, type EventoCalendario } from './calendario-ios-types'
import basic from './CalendarioBasic.module.css'

export type MonthDisplayMode = 'compact' | 'stacked' | 'details'

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
  const baseMonth = startOfMonth(month)
  const visibleMonths = showFollowingMonth ? [baseMonth, addMonths(baseMonth, 1)] : [baseMonth]

  return (
    <div className={basic.monthView} aria-hidden={overlay || undefined} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={basic.monthHeader}>
        <h1 className={basic.monthTitle}>{format(baseMonth, 'MMMM', { locale: es })}</h1>
      </header>

      <div className={basic.weekdays} aria-hidden="true">
        <span className={basic.weekNumberHeader} />
        {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>

      <div className={basic.monthScroll}>
        {visibleMonths.map((visibleMonth, monthIndex) => {
          const weeks = weeksForMonth(visibleMonth)

          return (
            <section key={visibleMonth.toISOString()} className={basic.monthSection}>
              {monthIndex > 0 && (
                <h2 className={basic.followingMonthTitle}>{format(visibleMonth, 'MMMM', { locale: es })}</h2>
              )}

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
