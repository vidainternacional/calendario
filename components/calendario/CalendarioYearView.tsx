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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from 'react'
import {
  eventColor,
  eventosDelDia,
  monthKey,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import spec from './CalendarioSpecCompletion.module.css'
import native from './CalendarioNativeUX.module.css'

const YEAR_MIN = 1800
const YEAR_MAX = 2200
const WINDOW_STEP = 3
const INITIAL_RADIUS = 3

function weekCalendarColors(days: Date[], month: Date, events: EventoCalendario[]) {
  const byCalendar = new Map<string, string>()
  for (const day of days) {
    if (!isSameMonth(day, month)) continue
    for (const event of eventosDelDia(events, day)) {
      if (!byCalendar.has(event.calendar_id)) byCalendar.set(event.calendar_id, eventColor(event))
    }
  }
  return [...byCalendar.values()].slice(0, 5)
}

function YearBlock({
  year,
  events,
  onOpenMonth,
}: {
  year: number
  events: EventoCalendario[]
  onOpenMonth: (month: Date, element: HTMLElement) => void
}) {
  const date = new Date(year, 0, 1)
  const months = eachMonthOfInterval({ start: startOfYear(date), end: endOfYear(date) })
  const isCurrentYear = year === new Date().getFullYear()

  return (
    <section className={native.yearBlock} data-calendar-year={year}>
      <header className={native.yearHeading}>
        <h1 className={`${styles.yearTitle} ${!isCurrentYear ? native.yearTitleInactive : ''}`}>{year}</h1>
      </header>

      <section className={styles.yearSurface}>
        <div className={styles.yearGrid}>
          {months.map((month) => {
            const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
            const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
            const days = eachDayOfInterval({ start, end })
            while (days.length < 42) days.push(addDays(days[days.length - 1], 1))
            const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7))

            return (
              <button
                key={monthKey(month)}
                data-calendar-mini={monthKey(month)}
                className={`${styles.miniMonth} ${isSameMonth(month, new Date()) ? styles.miniMonthCurrent : ''}`}
                onClick={(event) => onOpenMonth(month, event.currentTarget)}
                aria-label={`Abrir ${format(month, 'MMMM yyyy', { locale: es })}`}
              >
                <span className={styles.miniMonthName}>{format(month, 'MMM', { locale: es })}</span>
                <span className={spec.miniWeeks}>
                  {weeks.map((week, weekIndex) => {
                    const colors = weekCalendarColors(week, month, events)
                    return (
                      <span key={`${monthKey(month)}-${weekIndex}`} className={spec.miniWeek}>
                        <span className={spec.miniWeekDays}>
                          {week.map((day) => {
                            const belongs = isSameMonth(day, month)
                            const today = belongs && isToday(day)
                            return (
                              <span
                                key={day.toISOString()}
                                className={`${styles.miniDay} ${!belongs ? styles.miniDayOutside : ''} ${today ? styles.miniDayToday : ''}`}
                              >
                                {belongs ? format(day, 'd') : ''}
                              </span>
                            )
                          })}
                        </span>
                        <span className={spec.miniWeekBars} aria-hidden="true">
                          {colors.map((color, colorIndex) => (
                            <span key={`${color}-${colorIndex}`} className={spec.miniWeekBar} style={{ backgroundColor: color }} />
                          ))}
                        </span>
                      </span>
                    )
                  })}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}

export default function CalendarioYearView({
  fecha,
  eventos,
  isRefreshing,
  topChrome,
  onOpenMonth,
  onChangeYear,
}: {
  fecha: Date
  eventos: EventoCalendario[]
  isRefreshing: boolean
  topChrome: ReactNode
  onOpenMonth: (month: Date, element: HTMLElement) => void
  onChangeYear: (year: number) => void
}) {
  const initialYear = fecha.getFullYear()
  const [bounds, setBounds] = useState(() => ({
    start: Math.max(YEAR_MIN, initialYear - INITIAL_RADIUS),
    end: Math.min(YEAR_MAX, initialYear + INITIAL_RADIUS),
  }))
  const scrollRef = useRef<HTMLDivElement>(null)
  const prependHeightRef = useRef<number | null>(null)
  const lastReportedYearRef = useRef(initialYear)
  const mountedRef = useRef(false)

  const years = useMemo(
    () => Array.from({ length: bounds.end - bounds.start + 1 }, (_, index) => bounds.start + index),
    [bounds],
  )

  const scrollToYear = useCallback((year: number, behavior: ScrollBehavior = 'auto') => {
    const container = scrollRef.current
    const target = container?.querySelector<HTMLElement>(`[data-calendar-year="${year}"]`)
    if (!container || !target) return
    container.scrollTo({ top: Math.max(target.offsetTop - 4, 0), behavior })
  }, [])

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container || prependHeightRef.current === null) return
    const previousHeight = prependHeightRef.current
    prependHeightRef.current = null
    container.scrollTop += container.scrollHeight - previousHeight
  }, [bounds.start])

  useEffect(() => {
    const year = fecha.getFullYear()
    if (year < bounds.start || year > bounds.end) {
      setBounds({
        start: Math.max(YEAR_MIN, year - INITIAL_RADIUS),
        end: Math.min(YEAR_MAX, year + INITIAL_RADIUS),
      })
      window.requestAnimationFrame(() => scrollToYear(year))
      return
    }

    if (!mountedRef.current) {
      mountedRef.current = true
      window.requestAnimationFrame(() => scrollToYear(year))
      return
    }

    if (lastReportedYearRef.current !== year) {
      window.requestAnimationFrame(() => scrollToYear(year, 'smooth'))
    }
  }, [fecha, bounds.start, bounds.end, scrollToYear])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget

    if (container.scrollTop < 360 && bounds.start > YEAR_MIN && prependHeightRef.current === null) {
      prependHeightRef.current = container.scrollHeight
      setBounds((current) => ({
        ...current,
        start: Math.max(YEAR_MIN, current.start - WINDOW_STEP),
      }))
    }

    if (container.scrollTop + container.clientHeight > container.scrollHeight - 620 && bounds.end < YEAR_MAX) {
      setBounds((current) => ({
        ...current,
        end: Math.min(YEAR_MAX, current.end + WINDOW_STEP),
      }))
    }

    const probe = container.scrollTop + Math.min(180, container.clientHeight * 0.22)
    const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-calendar-year]'))
    let visibleYear = Number(sections[0]?.dataset.calendarYear || fecha.getFullYear())

    for (const section of sections) {
      if (section.offsetTop <= probe) visibleYear = Number(section.dataset.calendarYear)
      else break
    }

    if (Number.isFinite(visibleYear) && visibleYear !== lastReportedYearRef.current) {
      lastReportedYearRef.current = visibleYear
      onChangeYear(visibleYear)
    }
  }

  return (
    <>
      {topChrome}
      <div
        ref={scrollRef}
        className={native.yearScroller}
        onScroll={handleScroll}
        aria-busy={isRefreshing}
        aria-label="Calendario por años"
      >
        {years.map((year) => (
          <YearBlock key={year} year={year} events={eventos} onOpenMonth={onOpenMonth} />
        ))}
      </div>
    </>
  )
}
