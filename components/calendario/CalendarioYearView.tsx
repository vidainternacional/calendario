'use client'

import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReactNode } from 'react'
import { eventosDelDia, monthKey, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioYearView.module.css'

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
    <div className={styles.yearView} aria-busy={isRefreshing || undefined}>
      {topChrome}
      <header className={styles.yearHeader}>
        <h1 className={styles.yearTitle}>{format(fecha, 'yyyy')}</h1>
      </header>

      <div className={styles.yearGrid}>
        {months.map((month) => {
          const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
          const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
          const days = eachDayOfInterval({ start, end })
          const isCurrentMonth = isSameMonth(month, new Date())
          while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

          return (
            <button
              key={monthKey(month)}
              className={`${styles.miniMonth} ${isCurrentMonth ? styles.currentMonth : ''}`}
              onClick={(event) => onOpenMonth(month, event.currentTarget)}
              aria-label={`Abrir ${format(month, 'MMMM yyyy', { locale: es })}`}
            >
              <span className={styles.miniMonthName}>{format(month, 'MMMM', { locale: es })}</span>
              <span className={styles.miniWeekdays} aria-hidden="true">
                {MINI_WEEKDAYS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
              </span>
              <span className={styles.miniGrid}>
                {days.map((day) => {
                  const belongs = isSameMonth(day, month)
                  const dayEvents = belongs ? eventosDelDia(eventos, day) : []
                  const today = belongs && isToday(day)
                  const selected = belongs && isSameDay(day, fecha) && !today
                  const visibleMarks = dayEvents.slice(0, 3)

                  return (
                    <span
                      key={day.toISOString()}
                      className={`${styles.miniDay} ${selected ? styles.miniSelected : ''} ${today ? styles.miniToday : ''}`}
                    >
                      {belongs ? format(day, 'd') : ''}
                      {visibleMarks.length > 0 && (
                        <span className={styles.eventMarks} aria-hidden="true">
                          {visibleMarks.map((_, index) => (
                            <span
                              key={index}
                              className={`${styles.eventMark} ${dayEvents.length > 3 && index === 2 ? styles.moreMark : ''}`}
                            />
                          ))}
                        </span>
                      )}
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
