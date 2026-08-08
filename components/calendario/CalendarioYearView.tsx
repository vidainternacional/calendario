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
const INITIAL_YEARS_AROUND = 6
const YEARS_PAGE = 4
const YEAR_EDGE_THRESHOLD = 520
const YEAR_BOTTOM_INSET = 78
const YEAR_CENTER_SETTLE_MS = 220

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
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const stickyChromeRef = useRef<HTMLDivElement | null>(null)
  const activeYearRef = useRef<HTMLElement | null>(null)
  const activeMonthRef = useRef<HTMLButtonElement | null>(null)
  const positionedDateRef = useRef<string | null>(null)
  const prependHeightRef = useRef<number | null>(null)
  const edgeExpansionReadyRef = useRef(false)
  const [yearRange, setYearRange] = useState(() => ({
    start: activeYear - INITIAL_YEARS_AROUND,
    end: activeYear + INITIAL_YEARS_AROUND,
  }))

  const eventosPorDia = useMemo(
    () => transitionPreview ? new Map<string, EventoCalendario[]>() : indexarEventosPorDia(eventos),
    [eventos, transitionPreview],
  )
  const currentMonth = useMemo(() => new Date(), [])
  const activeMonthKey = format(fecha, 'yyyy-MM')

  const years = useMemo(
    () => transitionPreview
      ? [activeYear]
      : Array.from({ length: yearRange.end - yearRange.start + 1 }, (_, index) => yearRange.start + index),
    [activeYear, transitionPreview, yearRange.end, yearRange.start],
  )

  const centerMonthElement = (target: HTMLElement, behavior: ScrollBehavior = 'auto') => {
    const root = scrollRootRef.current
    if (!root) return

    const rootRect = root.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const stickyHeight = stickyChromeRef.current?.offsetHeight || 68
    const availableHeight = Math.max(1, root.clientHeight - stickyHeight - YEAR_BOTTOM_INSET)
    const targetTopInScroll = root.scrollTop + targetRect.top - rootRect.top
    const centeredOffset = stickyHeight + Math.max(0, (availableHeight - targetRect.height) / 2)
    const nextTop = Math.max(0, targetTopInScroll - centeredOffset)

    root.scrollTo({ top: nextTop, behavior })
  }

  const scrollToActiveMonth = (behavior: ScrollBehavior = 'auto') => {
    const target = activeMonthRef.current
    if (target) {
      centerMonthElement(target, behavior)
      return
    }

    const root = scrollRootRef.current
    const fallback = activeYearRef.current
    if (!root || !fallback) return
    root.scrollTo({ top: Math.max(0, fallback.offsetTop - (stickyChromeRef.current?.offsetHeight || 68)), behavior })
  }

  useLayoutEffect(() => {
    if (transitionPreview) return
    if (activeYear >= yearRange.start && activeYear <= yearRange.end) return

    positionedDateRef.current = null
    edgeExpansionReadyRef.current = false
    setYearRange({
      start: activeYear - INITIAL_YEARS_AROUND,
      end: activeYear + INITIAL_YEARS_AROUND,
    })
  }, [activeYear, transitionPreview, yearRange.end, yearRange.start])

  useLayoutEffect(() => {
    if (transitionPreview || prependHeightRef.current === null) return
    const root = scrollRootRef.current
    if (!root) return

    const previousHeight = prependHeightRef.current
    prependHeightRef.current = null
    const delta = root.scrollHeight - previousHeight
    if (delta > 0) root.scrollTop += delta
  }, [transitionPreview, yearRange.start])

  useLayoutEffect(() => {
    if (transitionPreview) return
    const root = scrollRootRef.current
    if (!root || positionedDateRef.current === activeMonthKey || !activeYearRef.current) return

    positionedDateRef.current = activeMonthKey
    edgeExpansionReadyRef.current = false
    root.scrollTop = 0

    let secondFrame = 0
    let cancelled = false
    const align = () => {
      if (!cancelled) scrollToActiveMonth('auto')
    }

    align()
    const firstFrame = window.requestAnimationFrame(() => {
      align()
      secondFrame = window.requestAnimationFrame(align)
    })
    const settleTimer = window.setTimeout(() => {
      align()
      edgeExpansionReadyRef.current = true
    }, YEAR_CENTER_SETTLE_MS)

    void document.fonts?.ready.then(align)

    return () => {
      cancelled = true
      edgeExpansionReadyRef.current = false
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(settleTimer)
    }
  }, [activeMonthKey, activeYear, transitionPreview, yearRange.end, yearRange.start])

  useEffect(() => {
    if (transitionPreview) return
    const root = scrollRootRef.current
    if (!root) return

    let frame = 0
    let extending = false

    const extendIfNeeded = () => {
      frame = 0
      if (extending || !edgeExpansionReadyRef.current) return

      const scrollTop = root.scrollTop
      const viewportBottom = scrollTop + root.clientHeight
      const scrollHeight = root.scrollHeight

      if (scrollTop <= YEAR_EDGE_THRESHOLD) {
        extending = true
        prependHeightRef.current = scrollHeight
        setYearRange((range) => ({ start: range.start - YEARS_PAGE, end: range.end }))
        window.requestAnimationFrame(() => { extending = false })
        return
      }

      if (viewportBottom >= scrollHeight - YEAR_EDGE_THRESHOLD) {
        extending = true
        setYearRange((range) => ({ start: range.start, end: range.end + YEARS_PAGE }))
        window.requestAnimationFrame(() => { extending = false })
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(extendIfNeeded)
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [transitionPreview])

  return (
    <div
      ref={scrollRootRef}
      className={`${styles.yearView} ${transitionPreview ? styles.transitionPreview : ''} ${polish.yearPolish}`}
      aria-busy={isRefreshing || undefined}
    >
      <div ref={stickyChromeRef} className={styles.stickyChrome}>{topChrome}</div>
      <div className={styles.yearsScroller}>
        {years.map((year) => {
          const yearDate = new Date(year, 0, 1)
          const months = eachMonthOfInterval({ start: startOfYear(yearDate), end: endOfYear(yearDate) })
          const isActiveYear = year === activeYear

          return (
            <section
              key={year}
              ref={isActiveYear ? activeYearRef : undefined}
              className={styles.yearSection}
              aria-label={`Año ${year}`}
              style={isActiveYear ? { contentVisibility: 'visible' } : undefined}
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
                  const isActiveMonth = isSameMonth(month, fecha)
                  const isSharedTarget = sharedTransitionTarget && isActiveMonth
                  const dataMonthKey = format(month, 'yyyy-MM')

                  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

                  return (
                    <button
                      type="button"
                      key={monthKey(month)}
                      ref={isActiveMonth ? activeMonthRef : undefined}
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
                          const today = belongs && isToday(day)

                          if (transitionPreview) {
                            return (
                              <span key={day.toISOString()} className={`${styles.miniDay} ${today ? styles.miniToday : ''}`}>
                                {belongs ? day.getDate() : ''}
                              </span>
                            )
                          }

                          const dayEvents = belongs ? (eventosPorDia.get(dayKey(day)) || []) : []
                          const visibleMarks = dayEvents.slice(0, 6)

                          return (
                            <span key={day.toISOString()} className={`${styles.miniDay} ${today ? styles.miniToday : ''}`}>
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
