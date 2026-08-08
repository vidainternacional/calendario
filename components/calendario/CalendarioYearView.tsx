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
const YEAR_CENTER_SETTLE_MS = 240
const YEAR_TOP_GAP = 6
const YEAR_BOTTOM_GAP = 10
const YEAR_UPWARD_BIAS = 12

export default function CalendarioYearView({
  fecha,
  eventos,
  isRefreshing,
  topChrome,
  scrollRequest = 0,
  onOpenMonth,
  onChangeYear,
  transitionPreview = false,
  sharedTransitionTarget = false,
}: {
  fecha: Date
  eventos: EventoCalendario[]
  isRefreshing: boolean
  topChrome: ReactNode
  scrollRequest?: number
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
  const handledScrollRequestRef = useRef(scrollRequest)
  const reportedYearRef = useRef<number | null>(null)
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

  const focusYear = (year: number, behavior: ScrollBehavior = 'auto') => {
    const root = scrollRootRef.current
    if (!root) return

    const target = root.querySelector<HTMLElement>(`[data-calendar-year="${year}"]`)
      || (year === activeYear ? activeYearRef.current : null)
    if (!target) return

    const rootRect = root.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const stickyHeight = stickyChromeRef.current?.offsetHeight || 68
    const floatingBar = document.querySelector<HTMLElement>('[data-calendar-floating-bar="true"]')
    const floatingTop = floatingBar?.getBoundingClientRect().top

    const visibleTop = rootRect.top + stickyHeight + YEAR_TOP_GAP
    const visibleBottom = Math.max(
      visibleTop + 1,
      Math.min(rootRect.bottom, floatingTop && floatingTop > visibleTop ? floatingTop - YEAR_BOTTOM_GAP : rootRect.bottom - 92),
    )
    const availableHeight = Math.max(1, visibleBottom - visibleTop)
    const targetTopInScroll = root.scrollTop + targetRect.top - rootRect.top

    const centeredTop = visibleTop + Math.max(0, (availableHeight - targetRect.height) / 2 - YEAR_UPWARD_BIAS)
    const maxTopThatKeepsFullYearVisible = visibleBottom - targetRect.height
    const desiredViewportTop = targetRect.height <= availableHeight
      ? Math.max(visibleTop, Math.min(centeredTop, maxTopThatKeepsFullYearVisible))
      : visibleTop

    root.scrollTo({
      top: Math.max(0, targetTopInScroll - (desiredViewportTop - rootRect.top)),
      behavior,
    })
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
    if (transitionPreview || positionedDateRef.current === activeMonthKey) return
    if (!scrollRootRef.current || !activeYearRef.current) return

    positionedDateRef.current = activeMonthKey
    edgeExpansionReadyRef.current = false

    let secondFrame = 0
    let cancelled = false
    const align = () => {
      if (!cancelled) focusYear(activeYear, 'auto')
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

  useLayoutEffect(() => {
    if (transitionPreview || handledScrollRequestRef.current === scrollRequest) return
    handledScrollRequestRef.current = scrollRequest
    edgeExpansionReadyRef.current = false

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
    let secondFrame = 0

    const firstFrame = window.requestAnimationFrame(() => {
      focusYear(activeYear, behavior)
      secondFrame = window.requestAnimationFrame(() => focusYear(activeYear, behavior))
    })
    const settleTimer = window.setTimeout(() => {
      focusYear(activeYear, 'auto')
      edgeExpansionReadyRef.current = true
    }, reduceMotion ? 80 : 460)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(settleTimer)
    }
  }, [activeYear, scrollRequest, transitionPreview, yearRange.end, yearRange.start])

  useEffect(() => {
    if (transitionPreview) return
    const root = scrollRootRef.current
    if (!root) return

    let frame = 0
    let extending = false

    const reportVisibleYear = () => {
      const rootRect = root.getBoundingClientRect()
      const stickyHeight = stickyChromeRef.current?.offsetHeight || 68
      const floatingBar = document.querySelector<HTMLElement>('[data-calendar-floating-bar="true"]')
      const floatingTop = floatingBar?.getBoundingClientRect().top
      const visibleTop = rootRect.top + stickyHeight
      const visibleBottom = Math.min(rootRect.bottom, floatingTop && floatingTop > visibleTop ? floatingTop : rootRect.bottom)
      const anchorY = visibleTop + Math.max(1, visibleBottom - visibleTop) / 2
      const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-calendar-year]'))
      let bestYear: number | null = null
      let bestDistance = Number.POSITIVE_INFINITY

      for (const section of sections) {
        const rect = section.getBoundingClientRect()
        const distance = rect.top <= anchorY && rect.bottom >= anchorY
          ? 0
          : Math.min(Math.abs(rect.top - anchorY), Math.abs(rect.bottom - anchorY))
        if (distance < bestDistance) {
          bestDistance = distance
          const year = Number(section.dataset.calendarYear)
          bestYear = Number.isFinite(year) ? year : null
        }
      }

      if (bestYear !== null && reportedYearRef.current !== bestYear) {
        reportedYearRef.current = bestYear
        onChangeYear(bestYear)
      }
    }

    const extendIfNeeded = () => {
      frame = 0
      reportVisibleYear()
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

    reportVisibleYear()
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [onChangeYear, transitionPreview])

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
              data-calendar-year={year}
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
