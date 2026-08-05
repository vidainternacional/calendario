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

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  topChrome,
  isRefreshing,
  overlay = false,
  onSelectDay,
  onOpenDay,
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
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

  return (
    <div className={basic.monthView} aria-hidden={overlay || undefined} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={basic.monthHeader}>
        <h1 className={basic.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
        <p className={basic.selectedDate} aria-live="polite">
          Toca una fecha para abrir su día
        </p>
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

          if (!belongs) {
            return <span key={day.toISOString()} className={basic.monthDayEmpty} aria-hidden="true" />
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={basic.monthDay}
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
