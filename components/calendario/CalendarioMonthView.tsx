'use client'

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
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

export type MonthPresentation = 'compact' | 'stacked' | 'details'

export function MonthWeekdayHeader() {
  return (
    <div className={styles.weekdayHeader}>
      <span className={spec.weekNumberHeader}>S</span>
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
}: {
  day: Date
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  compact: boolean
  onSelectDay: (day: Date) => void
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
      aria-pressed={belongs ? selected : undefined}
      tabIndex={belongs ? 0 : -1}
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
  presentation,
  onSelectDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  presentation: MonthPresentation
  onSelectDay: (day: Date) => void
}) {
  const inicio = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const fin = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: inicio, end: fin })
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const compact = presentation === 'compact'

  return (
    <div className={`${spec.monthWeeks} ${compact ? spec.monthWeeksCompact : ''}`}>
      {weeks.map((week, weekIndex) => {
        const weekItems = week.flatMap((day) => isSameMonth(day, month) ? eventosDelDia(events, day) : [])
        const colors = uniqueEventColors(weekItems)
        return (
          <div key={`${format(month, 'yyyy-MM')}-${weekIndex}`} className={spec.monthWeek}>
            <span className={spec.weekNumber}>{getISOWeek(week[0])}</span>
            <div className={spec.monthWeekContent}>
              <div className={spec.monthWeekDays}>
                {week.map((day) => (
                  <DayButton
                    key={day.toISOString()}
                    day={day}
                    month={month}
                    selectedDay={selectedDay}
                    events={events}
                    compact={compact}
                    onSelectDay={onSelectDay}
                  />
                ))}
              </div>
              {!compact && (
                <div className={spec.monthWeekBars} aria-hidden="true">
                  {colors.map((color, index) => (
                    <span key={`${color}-${index}`} className={spec.monthWeekBar} style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
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
      <span className={flow.dayRevealGrabber} aria-hidden="true" />
      <div className={flow.dayRail}>
        {railDays.map((day) => {
          const active = isSameDay(day, selectedDay)
          const today = isToday(day)
          return (
            <button key={day.toISOString()} className={flow.dayChip} onClick={() => onSelectDay(day)} aria-pressed={active}>
              <span className={flow.dayChipName}>{format(day, 'EEE', { locale: es })}</span>
              <span className={`${flow.dayChipNumber} ${today ? flow.dayChipToday : ''} ${active && !today ? flow.dayChipSelected : ''}`}>
                {format(day, 'd')}
              </span>
            </button>
          )
        })}
      </div>

      <header className={flow.dayRevealHeader}>
        <h2 className={flow.dayRevealTitle}>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h2>
        <span className={flow.dayRevealCount}>{dayEvents.length === 1 ? '1 evento' : `${dayEvents.length} eventos`}</span>
      </header>

      <div className={flow.dayEventsViewport}>
        {dayEvents.length > 0
          ? dayEvents.map((event) => <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={onOpenEvent} />)
          : <div className={styles.emptyState}>No hay eventos ni recordatorios visibles este día.</div>}
      </div>
    </section>
  )
}

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  topChrome,
  isRefreshing,
  presentation,
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
  presentation: MonthPresentation
  dayPanelOpen: boolean
  overlay?: boolean
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const selectDay = (day: Date) => {
    onSelectDay(day)
    onOpenDay(day)
  }

  return (
    <div className={`${styles.calendarScreen} ${flow.monthFlow} ${!overlay ? flow.elasticMonth : ''}`} aria-hidden={overlay || undefined}>
      {topChrome}
      <div className={styles.headerBlock}>
        <h1 className={styles.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
        {isRefreshing && !overlay && <span className={styles.inlineStatus}>Actualizando…</span>}
      </div>
      <MonthWeekdayHeader />
      <div className={styles.monthScroll}>
        <section className={`${styles.monthSection} ${styles[`monthSection${presentation.charAt(0).toUpperCase()}${presentation.slice(1)}`] || ''}`}>
          <MonthGrid
            month={month}
            selectedDay={selectedDay}
            events={events}
            presentation={presentation}
            onSelectDay={selectDay}
          />
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
