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
import {
  eventColor,
  eventosDelDia,
  WEEKDAY_LABELS,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import selection from './CalendarioSelection.module.css'
import flow from './CalendarioFlow.module.css'
import spec from './CalendarioSpecCompletion.module.css'

export function MonthWeekdayHeader() {
  return (
    <div className={styles.weekdayHeader}>
      {WEEKDAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
    </div>
  )
}

function dayNumberClass(today: boolean, selected: boolean) {
  if (today) return `${styles.dayNumber} ${selection.todayFilled}`
  if (selected) return `${styles.dayNumber} ${selection.selectedRing}`
  return styles.dayNumber
}

function uniqueEventColors(items: EventoCalendario[]) {
  const byCalendar = new Map<string, string>()
  for (const item of items) {
    if (!byCalendar.has(item.calendar_id)) byCalendar.set(item.calendar_id, eventColor(item))
  }
  return [...byCalendar.values()].slice(0, 3)
}

function EventIndicator({ items, compact }: { items: EventoCalendario[]; compact: boolean }) {
  const slot = compact ? selection.compactEventSlot : `${styles.eventMarks} ${selection.monthEventSlot}`
  if (items.length === 0) return <span className={slot} />

  const colors = uniqueEventColors(items)

  return (
    <span className={slot} aria-hidden="true">
      <span className={compact ? selection.compactEventBar : selection.monthEventBar}>
        {colors.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className={compact ? selection.compactEventSegment : selection.monthEventSegment}
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
    </span>
  )
}

function DayButton({
  day,
  month,
  selectedDay,
  events,
  compact,
  onSelectDay,
  onOpenDay,
}: {
  day: Date
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  compact: boolean
  onSelectDay: (day: Date) => void
  onOpenDay?: (day: Date) => void
}) {
  const belongs = isSameMonth(day, month)
  const selected = belongs && isSameDay(day, selectedDay)
  const today = belongs && isToday(day)
  const items = belongs ? eventosDelDia(events, day) : []

  const openDay = () => {
    if (!belongs) return
    onSelectDay(day)
    onOpenDay?.(day)
  }

  return (
    <button
      className={compact
        ? `${styles.compactDay} ${selection.compactDayLayout}`
        : `${styles.monthDay} ${!belongs ? styles.monthDayOutside : ''}`}
      onClick={openDay}
      aria-pressed={belongs ? selected : undefined}
      aria-label={belongs ? format(day, "EEEE d 'de' MMMM", { locale: es }) : undefined}
    >
      {belongs && (
        <>
          <span className={dayNumberClass(today, selected)}>{format(day, 'd')}</span>
          <EventIndicator items={items} compact={compact} />
        </>
      )}
    </button>
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
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))

  if (compact) {
    return (
      <div className={styles.compactGrid}>
        {days.map((day) => (
          <DayButton
            key={day.toISOString()}
            day={day}
            month={month}
            selectedDay={selectedDay}
            events={events}
            compact
            onSelectDay={onSelectDay}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={spec.monthWeeks}>
      {weeks.map((week, weekIndex) => (
        <div key={`${format(month, 'yyyy-MM')}-${weekIndex}`} className={spec.monthWeek}>
          <div className={spec.monthWeekDays}>
            {week.map((day) => (
              <DayButton
                key={day.toISOString()}
                day={day}
                month={month}
                selectedDay={selectedDay}
                events={events}
                compact={false}
                onSelectDay={onSelectDay}
                onOpenDay={onOpenDay}
              />
            ))}
          </div>
        </div>
      ))}
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
  dayPanelOpen: boolean
  overlay?: boolean
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  return (
    <div className={`${styles.calendarScreen} ${flow.monthFlow} ${!overlay ? flow.elasticMonth : ''}`} aria-hidden={overlay || undefined}>
      {topChrome}
      <div className={styles.headerBlock}>
        <h1 className={styles.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
        {!overlay && (
          <p className={styles.subTitle}>
            Selecciona un día para ver su agenda{isRefreshing ? ' · Actualizando…' : ''}
          </p>
        )}
      </div>
      <MonthWeekdayHeader />
      <div className={styles.monthScroll}>
        <section className={styles.monthSection}>
          <MonthGrid
            month={month}
            selectedDay={selectedDay}
            events={events}
            onSelectDay={onSelectDay}
            onOpenDay={onOpenDay}
          />
        </section>
      </div>
    </div>
  )
}
