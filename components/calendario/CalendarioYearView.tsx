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
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dayKey, eventColor, indexarEventosPorDia, monthKey, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioYearView.module.css'
import polish from './CalendarioYearPolish.module.css'

const MINI_WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const INITIAL_YEARS_AROUND = 1
const YEARS_PAGE = 3
const YEAR_EDGE_THRESHOLD = 460
const YEAR_TOP_OFFSET = 68

export default function CalendarioYearView({
  fecha,
  eventos,
  isRefreshing,
  topChrome,
  onOpenMonth,
  onChangeYear,
  transitionPreview = false,
  sharedTransitionTarget = false,
}: {
  fecha: Date
  eventos: EventoCalendario[]
  isRefreshing: boolean
  topChrome: ReactNode
  onOpenMonth: (month: Date, element: HTMLElement) => void
  onChangeYear: (year: number) => void
  transitionPreview?: boolean
  sharedTransitionTarget?: boolean
}) {
  const activeYear = fecha.getFullYear()
  const activeYearRef = useRef<HTMLElement | null>(null)
  const positionedYearRef = useRef<number | null>(null)
  const pendingTodayScrollRef = useRef(false)
  const prependHeightRef = useRef<number | null>(null)
  const [yearRange, setYearRange] = useState(() => ({
    start: activeYear - INITIAL_YEARS_AROUND,
    end: activeYear + INITIAL_YEARS_AROUND,
  }))
  const eventosPorDia = useMemo(
    () => transitionPreview ? new Map<string, EventoCalendario[]>() : indexarEventosPorDia(eventos),
    [eventos, transitionPreview],
  )
  const currentMonth = useMemo(() => new Date(), [])

  const years = useMemo(
    () => transitionPreview
      ? [activeYear]
      : Array.from(
          { length: yearRange.end - yearRange.start + 1 },
          (_, index) => yearRange.start + index,
        ),
    [activeYear, transitionPreview, yearRange.end, yearRange.start],
  )

  const scrollToActiveYear = (behavior: ScrollBehavior = 'auto') => {
    const target = activeYearRef.current
    if (!target) return

    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - YEAR_TOP_OFFSET)
    window.scrollTo({ top, behavior })
  }

  useLayoutEffect(() => {
    if (transitionPreview) return
    if (activeYear >= yearRange.start && activeYear <= yearRange.end) return

    positionedYearRef.current = null
    setYearRange({
      start: activeYear - INITIAL_YEARS_AROUND,
      end: activeYear + INITIAL_YEARS_AROUND,
    })
  }, [activeYear, transitionPreview, yearRange.end, yearRange.start])

  useLayoutEffect(() => {
    if (transitionPreview || prependHeightRef.current === null) return

    const previousHeight = prependHeightRef.current
    prependHeightRef.current = null
    const delta = document.documentElement.scrollHeight - previousHeight
    if (delta > 0) window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
  }, [transitionPreview, yearRange.start])

  useLayoutEffect(() => {
    if (transitionPreview) return
    if (positionedYearRef.current === activeYear || !activeYearRef.current) return
    positionedYearRef.current = activeYear

    const html = document.documentElement
    const previousBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    scrollToActiveYear('auto')
    const frame = window.requestAnimationFrame(() => scrollToActiveYear('auto'))

    return () => {
      window.cancelAnimationFrame(frame)
      html.style.scrollBehavior = previousBehavior
    }
  }, [activeYear, transitionPreview, yearRange.end, yearRange.start])

  useEffect(() => {
    if (transitionPreview) return

    let frame = 0
    let extending = false

    const extendIfNeeded = () => {
      frame = 0
      if (extending) return

      const root = document.documentElement
      const scrollTop = window.scrollY
      const viewportBottom = scrollTop + window.innerHeight
      const scrollHeight = root.scrollHeight

      if (scrollTop <= YEAR_EDGE_THRESHOLD) {
        extending = true
        prependHeightRef.current = scrollHeight
        setYearRange((range) => ({
          start: range.start - YEARS_PAGE,
          end: range.end,
        }))
        window.requestAnimationFrame(() => { extending = false })
        return
      }

      if (viewportBottom >= scrollHeight - YEAR_EDGE_THRESHOLD) {
        extending = true
        setYearRange((range) => ({
          start: range.start,
          end: range.end + YEARS_PAGE,
        }))
        window.requestAnimationFrame(() => { extending = false })
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(extendIfNeeded)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [transitionPreview])

  useEffect(() => {
    if (transitionPreview) return
    if (!pendingTodayScrollRef.current || !activeYearRef.current) return
    pendingTodayScrollRef.current = false
    requestAnimationFrame(() => scrollToActiveYear('smooth'))
  }, [activeYear, transitionPreview, yearRange.end, yearRange.start])

  useEffect(() => {
    if (transitionPreview) return

    const todayButton = Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Hoy')

    if (!todayButton) return

    const handleToday = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()

      const currentYear = new Date().getFullYear()
      if (currentYear !== activeYear) {
        pendingTodayScrollRef.current = true
        onChangeYear(currentYear)
        return
      }

      scrollToActiveYear(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      )
    }

    todayButton.addEventListener('click', handleToday, true)
    return () => todayButton.removeEventListener('click', handleToday, true)
  }, [activeYear, onChangeYear, transitionPreview])

  return (
    <div className={`${styles.yearView} ${polish.yearPolish}`} aria-busy={isRefreshing || undefined}>
      <div className={styles.stickyChrome}>{topChrome}</div>

      <div className={styles.yearsScroller}>
        {years.map((year) => {
          const yearDate = new Date(year, 0, 1)
          const months = eachMonthOfInterval({
            start: startOfYear(yearDate),
            end: endOfYear(yearDate),
          })
          const isActiveYear = year === activeYear

          return (
            <section
              key={year}
              ref={isActiveYear ? activeYearRef : undefined}
              className={styles.yearSection}
              aria-label={`Año ${year}`}
            >
              <header className={styles.yearHeader}>
                <h1 className={`${styles.yearTitle} ${isActiveYear ? styles.activeYearTitle : ''}`}>{year}</h1>
              </header>

              <div className={styles.yearGrid}>
                {months.map((month) => {
                  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
                  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
                  const days = eachDayOfInterval({ start, end })
                  const isCurrentMonth = isSameMonth(month, currentMonth)
                  const isSharedTarget = sharedTransitionTarget && isSameMonth(month, fecha)
                  const dataMonthKey = format(month, 'yyyy-MM')
                  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

                  return (
                    <button
                      type="button"
                      key={monthKey(month)}
                      data-calendar-mini-month={dataMonthKey}
                      className={`${styles.miniMonth} ${isCurrentMonth ? styles.currentMonth : ''}`}
                      style={isSharedTarget ? { viewTransitionName: 'calendar-month-shared' } : undefined}
                      onClick={transitionPreview ? undefined : (event) => onOpenMonth(month, event.currentTarget)}
                      tabIndex={transitionPreview ? -1 : undefined}
                      aria-hidden={transitionPreview || undefined}
                      aria-label={transitionPreview ? undefined : `Abrir ${format(month, 'MMMM yyyy', { locale: es })}`}
                    >
                      <span className={styles.miniMonthName}>{format(month, 'MMMM', { locale: es })}</span>
                      <span className={styles.miniWeekdays} aria-hidden="true">
                        {MINI_WEEKDAYS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
                      </span>
                      <span className={styles.miniGrid}>
                        {days.map((day) => {
                          const belongs = isSameMonth(day, month)
                          const dayEvents = belongs ? (eventosPorDia.get(dayKey(day)) || []) : []
                          const today = belongs && isToday(day)
                          const visibleMarks = dayEvents.slice(0, 6)

                          return (
                            <span
                              key={day.toISOString()}
                              className={`${styles.miniDay} ${today ? styles.miniToday : ''}`}
                            >
                              <span className={styles.miniDayLabel}>{belongs ? format(day, 'd') : ''}</span>
                              {visibleMarks.length > 0 && (
                                <span className={`${styles.eventMarks} ${visibleMarks.length > 1 ? styles.eventMarksFusion : ''}`} aria-hidden="true">
                                  {visibleMarks.map((event, index) => (
                                    <span
                                      key={`${event.id || event.fecha_inicio}-${index}`}
                                      className={`${styles.eventMark} ${visibleMarks.length === 1 ? styles.eventMarkSingle : styles.eventMarkSegment}`}
                                      style={{ backgroundColor: today ? '#ffffff' : eventColor(event) }}
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
            </section>
          )
        })}
      </div>
    </div>
  )
}
