'use client'

import {
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

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  topChrome,
  isRefreshing,
  overlay = false,
  onSelectDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
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

  return (
    <div className={basic.monthView} aria-hidden={overlay || undefined} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={basic.monthHeader}>
        <h1 className={basic.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
      </header>

      <div className={basic.weekdays} aria-hidden="true">
        {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>

      <div className={basic.monthGrid}>
        {days.map((day) => {
          const belongs = isSameMonth(day, month)
          const selected = belongs && isSameDay(day, selectedDay)
          const today = belongs && isToday(day)
          const dayEvents = belongs ? eventosDelDia(events, day) : []
          const colors = [...new Map(dayEvents.map((event) => [event.calendar_id, eventColor(event)])).values()].slice(0, 3)

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`${basic.monthDay} ${!belongs ? basic.monthDayOutside : ''}`}
              onClick={() => belongs && onSelectDay(day)}
              disabled={!belongs}
              aria-pressed={belongs ? selected : undefined}
              aria-label={belongs ? format(day, "EEEE d 'de' MMMM", { locale: es }) : undefined}
            >
              <span className={`${basic.dayNumber} ${selected ? basic.daySelected : ''} ${today ? basic.dayToday : ''}`}>
                {format(day, 'd')}
              </span>
              <span className={basic.eventDots} aria-hidden="true">
                {colors.map((color, index) => (
                  <span key={`${color}-${index}`} className={basic.eventDot} style={{ backgroundColor: color }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
