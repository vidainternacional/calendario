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
import { useMemo, useRef, type ReactNode, type TouchEvent } from 'react'
import CalendarioEventRow from './CalendarioEventRow'
import {
  eventColor,
  eventKey,
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
  return [...byCalendar.values()].slice(0, 5)
}

function EventIndicator({ items, compact }: { items: EventoCalendario[]; compact: boolean }) {
  const slot = compact ? selection.compactEventSlot : `${styles.eventMarks} ${selection.monthEventSlot}`
  if (items.length === 0) return <span className={slot} />
  const colors = uniqueEventColors(items)

  if (items.length === 1) {
    const item = items[0]
    return (
      <span className={slot} aria-hidden="true">
        <span
          className={item.kind === 'reminder'
            ? spec.reminderMarker
            : compact ? selection.compactEventDot : styles.eventMarkDot}
          style={{ backgroundColor: item.kind === 'reminder' ? 'transparent' : colors[0], color: colors[0] }}
        />
      </span>
    )
  }

  return (
    <span className={slot} aria-hidden="true">
      <span className={compact ? selection.compactEventBar : selection.monthEventBar}>
        {colors.map((color) => (
          <span key={color} className={compact ? selection.compactEventSegment : selection.monthEventSegment} style={{ backgroundColor: color }} />
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

  return (
    <button
      className={compact
        ? `${styles.compactDay} ${selection.compactDayLayout}`
        : `${styles.monthDay} ${!belongs ? styles.monthDayOutside : ''}`}
      onClick={() => belongs && onSelectDay(day)}
      onDoubleClick={() => belongs && onOpenDay?.(day)}
      aria-pressed={belongs ? selected : undefined}
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
      {weeks.map((week, weekIndex) => {
        const weekItems = week.flatMap((day) => isSameMonth(day, month) ? eventosDelDia(events, day) : [])
        const colors = uniqueEventColors(weekItems)
        return (
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
            <div className={spec.monthWeekBars} aria-hidden="true">
              {colors.map((color, index) => (
                <span key={`${color}-${index}`} className={spec.monthWeekBar} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayReveal({
  selectedDay,
  events,
  onSelectDay,
  onOpenEvent,
}: {
  selectedDay: Date
  events: EventoCalendario[]
  onSelectDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const touchStart = useRef<number | null>(null)
  const dayEvents = eventosDelDia(events, selectedDay)
  const railDays = useMemo(
    () => Array.from({ length: 9 }, (_, index) => addDays(selectedDay, index - 4)),
    [selectedDay],
  )

  const touchStartHandler = (event: TouchEvent) => {
    event.stopPropagation()
    touchStart.current = event.changedTouches[0]?.clientX ?? null
  }

  const touchEndHandler = (event: TouchEvent) => {
    event.stopPropagation()
    if (touchStart.current === null) return
    const delta = event.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (Math.abs(delta) >= 52) onSelectDay(addDays(selectedDay, delta < 0 ? 1 : -1))
  }

  return (
    <section
      key={format(selectedDay, 'yyyy-MM-dd')}
      className={flow.dayReveal}
      onTouchStart={touchStartHandler}
      onTouchEnd={touchEndHandler}
      aria-label="Elementos del día seleccionado"
    >
      <header className={flow.dayRevealHeader}>
        <h2 className={flow.dayRevealTitle}>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h2>
        <span className={flow.dayRevealCount}>{dayEvents.length}</span>
      </header>

      <div className={flow.dayRail}>
        {railDays.map((day) => {
          const active = isSameDay(day, selectedDay)
          return (
            <button key={day.toISOString()} className={`${flow.dayChip} ${active ? flow.dayChipActive : ''}`} onClick={() => onSelectDay(day)} aria-pressed={active}>
              <span className={flow.dayChipName}>{format(day, 'EEE', { locale: es })}</span>
              <span className={flow.dayChipNumber}>{format(day, 'd')}</span>
            </button>
          )
        })}
      </div>

      <div className={flow.dayEventsViewport}>
        {dayEvents.length > 0
          ? dayEvents.map((event) => <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={onOpenEvent} />)
          : <div className={styles.emptyState}>No hay eventos ni recordatorios visibles este día.</div>}
      </div>
      <p className={flow.daySwipeHint}>Desliza horizontalmente para cambiar de día y verticalmente para recorrer la lista.</p>
    </section>
  )
}

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  topChrome,
  isRefreshing,
  dayPanelOpen,
  overlay = false,
  onSelectDay,
  onOpenDay,
  onOpenEvent,
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
            Toca un día para abrir sus eventos{isRefreshing ? ' · Actualizando…' : ''}
          </p>
        )}
      </div>
      <MonthWeekdayHeader />
      <div className={styles.monthScroll}>
        <section className={styles.monthSection}>
          <MonthGrid month={month} selectedDay={selectedDay} events={events} onSelectDay={onSelectDay} onOpenDay={onOpenDay} />
        </section>
        {!overlay && dayPanelOpen && (
          <DayReveal
            selectedDay={selectedDay}
            events={events}
            onSelectDay={onSelectDay}
            onOpenEvent={onOpenEvent}
          />
        )}
      </div>
    </div>
  )
}
