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
import { MapPin, X } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import CalendarioEventRow from './CalendarioEventRow'
import {
  eventColor,
  eventosDelDia,
  WEEKDAY_LABELS,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import selection from './CalendarioSelection.module.css'
import flow from './CalendarioFlow.module.css'

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
  return [...new Set(items.map((item) => eventColor(item)))].slice(0, 3)
}

function EventIndicator({ items, compact }: { items: EventoCalendario[]; compact: boolean }) {
  const slot = compact ? selection.compactEventSlot : `${styles.eventMarks} ${selection.monthEventSlot}`
  if (items.length === 0) return <span className={slot} />
  const colors = uniqueEventColors(items)

  if (items.length === 1) {
    return (
      <span className={slot} aria-hidden="true">
        <span className={compact ? selection.compactEventDot : styles.eventMarkDot} style={{ backgroundColor: colors[0] }} />
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

  const className = compact ? styles.compactGrid : styles.monthWeeks

  return (
    <div className={className}>
      {days.map((day) => {
        const belongs = isSameMonth(day, month)
        const selected = belongs && isSameDay(day, selectedDay)
        const today = belongs && isToday(day)
        const items = belongs ? eventosDelDia(events, day) : []

        return (
          <button
            key={day.toISOString()}
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
      })}
    </div>
  )
}

function DayReveal({
  selectedDay,
  events,
  onSelectDay,
}: {
  selectedDay: Date
  events: EventoCalendario[]
  onSelectDay: (day: Date) => void
}) {
  const [detail, setDetail] = useState<EventoCalendario | null>(null)
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
      aria-label="Eventos del día seleccionado"
    >
      <header className={flow.dayRevealHeader}>
        <h2 className={flow.dayRevealTitle}>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h2>
        <span className={flow.dayRevealCount}>{dayEvents.length}</span>
      </header>

      <div className={flow.dayRail}>
        {railDays.map((day) => {
          const active = isSameDay(day, selectedDay)
          return (
            <button
              key={day.toISOString()}
              className={`${flow.dayChip} ${active ? flow.dayChipActive : ''}`}
              onClick={() => onSelectDay(day)}
              aria-pressed={active}
            >
              <span className={flow.dayChipName}>{format(day, 'EEE', { locale: es })}</span>
              <span className={flow.dayChipNumber}>{format(day, 'd')}</span>
            </button>
          )
        })}
      </div>

      <div className={flow.dayEventsViewport}>
        {dayEvents.length > 0
          ? dayEvents.map((event) => (
              <CalendarioEventRow key={event.asignacion_id} evento={event} onOpen={setDetail} />
            ))
          : <div className={styles.emptyState}>No tienes eventos asignados este día.</div>}
      </div>
      <p className={flow.daySwipeHint}>Desliza horizontalmente para cambiar de día y verticalmente para recorrer los eventos.</p>

      {detail && typeof document !== 'undefined' && createPortal(
        <div className={flow.eventDetailOverlay} onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
          <article className={flow.eventDetailCard} role="dialog" aria-modal="true" aria-labelledby="month-event-title">
            <header className={flow.eventDetailHeader}>
              <div>
                <h3 id="month-event-title" className={flow.eventDetailTitle}>{detail.titulo}</h3>
                <p className={flow.eventDetailMeta}>{detail.ministerios?.nombre || 'Evento general'}</p>
              </div>
              <button className={flow.eventDetailClose} onClick={() => setDetail(null)} aria-label="Cerrar ficha"><X size={19} /></button>
            </header>
            <div className={flow.eventDetailBody}>
              <p><strong>{format(new Date(detail.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}</strong></p>
              <p>{detail.todo_el_dia ? 'Todo el día' : `${format(new Date(detail.fecha_inicio), 'h:mm a')}${detail.fecha_fin ? ` – ${format(new Date(detail.fecha_fin), 'h:mm a')}` : ''}`}</p>
              {detail.ubicacion && <p><MapPin size={17} className="inline mr-2" />{detail.ubicacion}</p>}
              {detail.descripcion && <p>{detail.descripcion}</p>}
            </div>
            <footer className={flow.eventDetailFooter}>
              <button className={flow.eventDetailDone} onClick={() => setDetail(null)}>Listo</button>
            </footer>
          </article>
        </div>,
        document.body,
      )}
    </section>
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
  return (
    <div className={`${styles.calendarScreen} ${flow.monthFlow} ${!overlay ? flow.elasticMonth : ''}`} aria-hidden={overlay || undefined}>
      {topChrome}
      <div className={styles.headerBlock}>
        <h1 className={styles.monthTitle}>{format(month, 'MMMM', { locale: es })}</h1>
        {!overlay && (
          <p className={styles.subTitle}>
            Selecciona un día para ver sus eventos{isRefreshing ? ' · Actualizando…' : ''}
          </p>
        )}
      </div>
      <MonthWeekdayHeader />
      <div className={styles.monthScroll}>
        <section className={styles.monthSection}>
          <MonthGrid month={month} selectedDay={selectedDay} events={events} onSelectDay={onSelectDay} onOpenDay={onOpenDay} />
        </section>
        {!overlay && <DayReveal selectedDay={selectedDay} events={events} onSelectDay={onSelectDay} />}
      </div>
    </div>
  )
}
