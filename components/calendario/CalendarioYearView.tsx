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
const YEAR_BOTTOM_INSET = 96
const YEAR_CENTER_SETTLE_MS = 140

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
  const stickyChromeRef = useRef<HTMLDivElement | null>(null)
  const activeYearRef = useRef<HTMLElement | null>(null)
  const activeMonthRef = useRef<HTMLButtonElement | null>(null)
  const positionedDateRef = useRef<string | null>(null)
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
  const activeMonthKey = format(fecha, 'yyyy-MM')

  const years = useMemo(
    () => transitionPreview
      ? [activeYear]
      : Array.from(
          { length: yearRange.end - yearRange.start + 1 },
          (_, index) => yearRange.start + index,
        ),
    [activeYear, transitionPreview, yearRange.end, yearRange.start],
  )

  const visibleCalendarCenterY = () => {
    if (typeof window === 'undefined') return 0
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    const chromeBottom = stickyChromeRef.current?.getBoundingClientRect().bottom || YEAR_TOP_OFFSET
    const floatingBar = document.querySelector<HTMLElement>('[class*="floatingBar"]')
    const floatingTop = floatingBar?.getBoundingClientRect().top
    const bottomBoundary = floatingTop && floatingTop > chromeBottom
      ? Math.min(viewportHeight, floatingTop)
      : Math.max(chromeBottom + 1, viewportHeight - YEAR_BOTTOM_INSET)

    return chromeBottom + Math.max(1, bottomBoundary - chromeBottom) / 2
  }

  const centerMonthElement = (target: HTMLElement, behavior: ScrollBehavior = 'auto') => {
    if (typeof window === 'undefined') return
    const rect = target.getBoundingClientRect()
    const desiredCenterY = visibleCalendarCenterY()
    const top = Math.max(0, window.scrollY + rect.top + rect.height / 2 - desiredCenterY)
    window.scrollTo({ top, behavior })
  }

  const scrollToActiveMonth = (behavior: ScrollBehavior = 'auto') => {
    const target = activeMonthRef.current
    if (target) {
      centerMonthElement(target, behavior)
      return
    }

    const fallback = activeYearRef.current
    if (!fallback) return
    const top = Math.max(0, window.scrollY + fallback.getBoundingClientRect().top - YEAR_TOP_OFFSET)
    window.scrollTo({ top, behavior })
  }

  const scrollToMonth = (date: Date, behavior: ScrollBehavior = 'auto') => {
    const key = format(date, 'yyyy-MM')
    const target = document.querySelector<HTMLElement>(`[data-calendar-mini-month="${key}"]`)
    if (target) centerMonthElement(target, behavior)
  }

  useLayoutEffect(() => {
    if (transitionPreview) return
    if (activeYear >= yearRange.start && activeYear <= yearRange.end) return

    positionedDateRef.current = null
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
    if (positionedDateRef.current === activeMonthKey || !activeYearRef.current) return
    positionedDateRef.current = activeMonthKey

    const html = document.documentElement
    const previousBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
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
    const settleTimer = window.setTimeout(align, YEAR_CENTER_SETTLE_MS)
    void document.fonts?.ready.then(align)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(settleTimer)
      html.style.scrollBehavior = previousBehavior
    }
  }, [activeMonthKey, activeYear, transitionPreview, yearRange.end, yearRange.start])

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
    requestAnimationFrame(() => scrollToMonth(new Date(), 'smooth'))
  }, [activeYear, transitionPreview, yearRange.end, yearRange.start])

  useEffect(() => {
    if (transitionPreview) return

    const todayButton = Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Hoy')

    if (!todayButton) return

    const handleToday = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()

      const today = new Date()
      const currentYear = today.getFullYear()
      if (currentYear !== activeYear) {
        pendingTodayScrollRef.current = true
        onChangeYear(currentYear)
        return
      }

      scrollToMonth(
        today,
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      )
    }

    todayButton.addEventListener('click', handleToday, true)
    return () => todayButton.removeEventListener('click', handleToday, true)
  }, [activeYear, onChangeYear, transitionPreview])

  return (
    <div className={`${styles.yearView} ${transitionPreview ? styles.transitionPreview : ''} ${polish.yearPolish}`} aria-busy={isRefreshing || undefined}>
      <div ref={stickyChromeRef} className={styles.stickyChrome}>{topChrome}</div>

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
                              <span
                                key={day.toISOString()}
                                className={`${styles.miniDay} ${today ? styles.miniToday : ''}`}
                              >
                                {belongs ? day.getDate() : ''}
                              </span>
                            )
                          }

                          const dayEvents = belongs ? (eventosPorDia.get(dayKey(day)) || []) : []
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
