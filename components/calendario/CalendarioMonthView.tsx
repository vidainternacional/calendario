'use client'

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
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

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  displayMode,
  topChrome,
  isRefreshing,
  overlay = false,
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
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

  return (
    <div className={basic.monthView} aria-hidden={overlay || undefined} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={basic.monthHeader}>
        <h1 className={basic.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
      </header>

      <div className={basic.weekdays} aria-hidden="true">
        {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>

      <div className={`${basic.monthGrid} ${displayMode === 'details' ? basic.monthGridDetails : ''}`}>
        {days.map((day) => {
          const belongs = isSameMonth(day, month)
          const selected = belongs && isSameDay(day, selectedDay)
          const today = belongs && isToday(day)
          const dayEvents = belongs ? eventosDelDia(events, day) : []
          const uniqueColors = [...new Map(dayEvents.map((event) => [event.calendar_id, eventColor(event)])).values()]

          if (!belongs) {
            return <span key={day.toISOString()} className={basic.monthDayEmpty} aria-hidden="true" />
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`${basic.monthDay} ${displayMode === 'details' ? basic.monthDayDetails : ''}`}
              onClick={() => {
                onSelectDay(day)
                onOpenDay(day)
              }}
              aria-pressed={selected}
              aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}, abrir vista del día`}
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
    </div>
  )
}
