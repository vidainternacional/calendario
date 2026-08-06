'use client'

import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { eventosDelDia, monthKey, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioYearView.module.css'

const MINI_WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const YEARS_BEFORE = 20
const YEARS_AFTER = 20
const STICKY_HEADER_OFFSET = 68

const easeInOutCubic = (progress: number) => (
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
)

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
  const activeYearRef = useRef<HTMLElement | null>(null)
  const hasPositionedRef = useRef(false)
  const scrollFrameRef = useRef<number | null>(null)
  const activeYear = fecha.getFullYear()

  const years = useMemo(
    () => Array.from(
      { length: YEARS_BEFORE + YEARS_AFTER + 1 },
      (_, index) => activeYear - YEARS_BEFORE + index,
    ),
    [activeYear],
  )

  const cancelAnimatedScroll = () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current)
      scrollFrameRef.current = null
    }
  }

  const animateToActiveYear = () => {
    const target = activeYearRef.current
    if (!target) return

    cancelAnimatedScroll()

    const startY = window.scrollY
    const targetY = Math.max(
      0,
      startY + target.getBoundingClientRect().top - STICKY_HEADER_OFFSET,
    )
    const distance = targetY - startY

    if (Math.abs(distance) < 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: targetY, behavior: 'auto' })
      return
    }

    // Apple no publica la duración exacta de Calendario. Esta escala mantiene
    // una transición perceptible y suave sin convertir recorridos largos en saltos.
    const duration = Math.min(1050, Math.max(650, 560 + Math.sqrt(Math.abs(distance)) * 7))
    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      window.scrollTo(0, startY + distance * easeInOutCubic(progress))

      if (progress < 1) {
        scrollFrameRef.current = window.requestAnimationFrame(step)
      } else {
        scrollFrameRef.current = null
      }
    }

    scrollFrameRef.current = window.requestAnimationFrame(step)
  }

  useEffect(() => {
    if (hasPositionedRef.current || !activeYearRef.current) return
    hasPositionedRef.current = true
    activeYearRef.current.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [])

  useEffect(() => {
    const todayButton = Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Hoy')

    if (!todayButton) return

    const handleToday = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()

      const currentYear = new Date().getFullYear()
      if (currentYear !== activeYear) {
        onChangeYear(currentYear)
        requestAnimationFrame(() => requestAnimationFrame(animateToActiveYear))
        return
      }

      animateToActiveYear()
    }

    todayButton.addEventListener('click', handleToday, true)
    window.addEventListener('wheel', cancelAnimatedScroll, { passive: true })
    window.addEventListener('touchstart', cancelAnimatedScroll, { passive: true })
    window.addEventListener('pointerdown', cancelAnimatedScroll, { passive: true })

    return () => {
      todayButton.removeEventListener('click', handleToday, true)
      window.removeEventListener('wheel', cancelAnimatedScroll)
      window.removeEventListener('touchstart', cancelAnimatedScroll)
      window.removeEventListener('pointerdown', cancelAnimatedScroll)
    }
  }, [activeYear, onChangeYear])

  useEffect(() => () => cancelAnimatedScroll(), [])

  return (
    <div className={styles.yearView} aria-busy={isRefreshing || undefined}>
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
                  const isCurrentMonth = isSameMonth(month, new Date())
                  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))

                  return (
                    <button
                      type="button"
                      key={monthKey(month)}
                      className={`${styles.miniMonth} ${isCurrentMonth ? styles.currentMonth : ''}`}
                      onClick={(event) => onOpenMonth(month, event.currentTarget)}
                      aria-label={`Abrir ${format(month, 'MMMM yyyy', { locale: es })}`}
                    >
                      <span className={styles.miniMonthName}>{format(month, 'MMMM', { locale: es })}</span>
                      <span className={styles.miniWeekdays} aria-hidden="true">
                        {MINI_WEEKDAYS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
                      </span>
                      <span className={styles.miniGrid}>
                        {days.map((day) => {
                          const belongs = isSameMonth(day, month)
                          const dayEvents = belongs ? eventosDelDia(eventos, day) : []
                          const today = belongs && isToday(day)
                          const selected = belongs && isSameDay(day, fecha) && !today
                          const visibleMarks = dayEvents.slice(0, 3)

                          return (
                            <span
                              key={day.toISOString()}
                              className={`${styles.miniDay} ${selected ? styles.miniSelected : ''} ${today ? styles.miniToday : ''}`}
                            >
                              {belongs ? format(day, 'd') : ''}
                              {visibleMarks.length > 0 && (
                                <span className={styles.eventMarks} aria-hidden="true">
                                  {visibleMarks.map((_, index) => (
                                    <span
                                      key={index}
                                      className={`${styles.eventMark} ${dayEvents.length > 3 && index === 2 ? styles.moreMark : ''}`}
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
