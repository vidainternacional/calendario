'use client'

import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { eventosDelDia, monthKey, type EventoCalendario } from './calendario-ios-types'
import basic from './CalendarioBasic.module.css'

const MINI_WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export default function CalendarioYearView({
  fecha,
  eventos,
  isRefreshing,
  topChrome,
  onOpenMonth,
}: {
  fecha: Date
  eventos: EventoCalendario[]
  isRefreshing: boolean
  topChrome: ReactNode
  onOpenMonth: (month: Date, element: HTMLElement) => void
  onChangeYear: (year: number) => void
}) {
  const months = eachMonthOfInterval({
    start: startOfYear(fecha),
    end: endOfYear(fecha),
  })

  return (
    <div className={basic.yearView} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={basic.yearHeader}>
        <h1 className={basic.yearTitle}>{format(fecha, 'yyyy')}</h1>
      </header>

      <div className={basic.yearGrid}>
        {months.map((month) => {
          const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
          const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
          const days = eachDayOfInterval({ start, end })
          while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

          return (
            <button
              key={monthKey(month)}
              className={basic.miniMonth}
              onClick={(event) => onOpenMonth(month, event.currentTarget)}
              aria-label={`Abrir ${format(month, 'MMMM yyyy', { locale: es })}`}
            >
              <span className={basic.miniMonthName}>{format(month, 'MMMM', { locale: es })}</span>
              <span className={basic.miniWeekdays} aria-hidden="true">
                {MINI_WEEKDAYS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
              </span>
              <span className={basic.miniGrid}>
                {days.map((day) => {
                  const belongs = isSameMonth(day, month)
                  const hasEvents = belongs && eventosDelDia(eventos, day).length > 0
                  const today = belongs && isToday(day)

                  return (
                    <span
                      key={day.toISOString()}
                      className={`${basic.miniDay} ${today ? basic.miniToday : ''}`}
                    >
                      {belongs ? format(day, 'd') : ''}
                      {hasEvents && <span className={basic.miniDot} aria-hidden="true" />}
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
