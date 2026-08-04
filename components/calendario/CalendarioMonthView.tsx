'use client'

import {
  addMonths,
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
import type { CSSProperties, ReactNode } from 'react'
import {
  eventColor,
  eventosDelDia,
  monthKey,
  WEEKDAY_LABELS,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

const TODAY_RING_STYLE: CSSProperties = {
  boxShadow: 'inset 0 0 0 2px #5b3df5',
  color: '#5b3df5',
}

export function MonthWeekdayHeader() {
  return (
    <div className={styles.weekdayHeader}>
      {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
    </div>
  )
}

export function MonthGrid({
  month,
  selectedDay,
  events,
  compact = false,
  onSelectDay,
  onOpenDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  compact?: boolean
  onSelectDay: (day: Date) => void
  onOpenDay?: (day: Date) => void
}) {
  const inicio = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const fin = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: inicio, end: fin })

  if (compact) {
    return (
      <div className={styles.compactGrid}>
        {days.map((day) => {
          const belongs = isSameMonth(day, month)
          const selected = belongs && isSameDay(day, selectedDay)
          const today = belongs && isToday(day)
          const items = belongs ? eventosDelDia(events, day) : []
          return (
            <button
              key={day.toISOString()}
              className={`${styles.compactDay} ${selected ? styles.compactSelected : ''}`}
              onClick={() => belongs && onSelectDay(day)}
              aria-pressed={belongs ? selected : undefined}
            >
              {belongs && (
                <span
                  className={`${styles.dayNumber} ${selected ? styles.dayNumberToday : ''}`}
                  style={!selected && today ? TODAY_RING_STYLE : undefined}
                >
                  {format(day, 'd')}
                </span>
              )}
              {items.length > 0 && (
                <span className={styles.compactDot} style={{ backgroundColor: eventColor(items[0]) }} />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.monthWeeks}>
      {days.map((day) => {
        const belongs = isSameMonth(day, month)
        const selected = belongs && isSameDay(day, selectedDay)
        const today = belongs && isToday(day)
        const items = belongs ? eventosDelDia(events, day) : []
        return (
          <button
            key={day.toISOString()}
            className={`${styles.monthDay} ${!belongs ? styles.monthDayOutside : ''} ${selected ? styles.monthDaySelected : ''}`}
            onClick={() => belongs && onSelectDay(day)}
            onDoubleClick={() => belongs && onOpenDay?.(day)}
            aria-pressed={belongs ? selected : undefined}
          >
            {belongs && (
              <>
                <span
                  className={`${styles.dayNumber} ${selected ? styles.dayNumberToday : ''}`}
                  style={!selected && today ? TODAY_RING_STYLE : undefined}
                >
                  {format(day, 'd')}
                </span>
                <span className={styles.eventMarks}>
                  {items.length === 1 && (
                    <span className={styles.eventMarkDot} style={{ backgroundColor: eventColor(items[0]) }} />
                  )}
                  {items.length > 1 && (
                    <span className={styles.eventMarkBar} style={{ backgroundColor: eventColor(items[0]) }} />
                  )}
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

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
  overlay?: boolean
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
}) {
  const months = [month, addMonths(month, 1), addMonths(month, 2)]

  return (
    <div className={styles.calendarScreen} aria-hidden={overlay || undefined}>
      {topChrome}
      <div className={styles.headerBlock}>
        <h1 className={styles.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
        {!overlay && (
          <p className={styles.subTitle}>
            Tus eventos y turnos asignados{isRefreshing ? ' · Actualizando…' : ''}
          </p>
        )}
      </div>
      <MonthWeekdayHeader />
      <div className={styles.monthScroll}>
        {months.map((item, index) => (
          <section key={monthKey(item)} className={styles.monthSection}>
            {index > 0 && <h2 className={styles.followingMonthTitle}>{format(item, 'MMM', { locale: es })}</h2>}
            <MonthGrid
              month={item}
              selectedDay={selectedDay}
              events={events}
              onSelectDay={onSelectDay}
              onOpenDay={onOpenDay}
            />
          </section>
        ))}
      </div>
    </div>
  )
}
