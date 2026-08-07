'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { SPRING_STANDARD, VIEW_FADE } from '@/lib/motion-config'
import type { MonthTransitionAnchor } from './CalendarioIOS'
import { dayKey, eventColor, indexarEventosPorDia, WEEKDAY_LABELS, type EventoCalendario } from './calendario-ios-types'
import basic from './CalendarioBasic.module.css'
import indicator from './CalendarioMonthIndicators.module.css'
import polish from './CalendarioMonthPolish.module.css'

export type MonthDisplayMode = 'compact' | 'stacked' | 'details'

const MONTHS_AROUND = 6
const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function triggerSoftHaptic() {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  navigator.vibrate(8)
}

function weeksForMonth(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })

  return Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
}

function compactEventSegments(events: EventoCalendario[]) {
  return events.slice(0, 6).map((event) => eventColor(event))
}

export default function CalendarioMonthView({
  month,
  selectedDay,
  events,
  displayMode,
  topChrome,
  isRefreshing,
  scrollRequest = 0,
  overlay = false,
  showFollowingMonth = true,
  openDayOnSelect = true,
  footer,
  transitionAnchor = null,
  transitionPhase = null,
  onTransitionComplete,
  onVisibleMonthChange,
  onSelectDay,
  onOpenDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  displayMode: MonthDisplayMode
  topChrome: ReactNode
  isRefreshing: boolean
  dayPanelOpen: boolean
  scrollRequest?: number
  overlay?: boolean
  showFollowingMonth?: boolean
  openDayOnSelect?: boolean
  footer?: ReactNode
  transitionAnchor?: MonthTransitionAnchor | null
  transitionPhase?: 'enter' | null
  onTransitionComplete?: () => void
  onVisibleMonthChange?: (month: Date) => void
  onSelectDay: (day: Date) => void
  onOpenDay: (day: Date) => void
  onOpenEvent: (event: EventoCalendario) => void
}) {
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const stickyChromeRef = useRef<HTMLDivElement | null>(null)
  const weekdaysRef = useRef<HTMLDivElement | null>(null)
  const activeMonthRef = useRef<HTMLElement | null>(null)
  const reportedMonthRef = useRef<string | null>(null)
  const baseMonth = startOfMonth(month)
  const baseMonthKey = format(baseMonth, 'yyyy-MM')
  const eventosPorDia = useMemo(() => indexarEventosPorDia(events), [events])

  const visibleMonths = useMemo(
    () => showFollowingMonth
      ? Array.from({ length: MONTHS_AROUND * 2 + 1 }, (_, index) => addMonths(baseMonth, index - MONTHS_AROUND))
      : [baseMonth],
    [baseMonthKey, showFollowingMonth],
  )

  useLayoutEffect(() => {
    const root = scrollRootRef.current
    const target = activeMonthRef.current
    if (!root || !target) return

    const stickyHeight = (stickyChromeRef.current?.offsetHeight || 0) + (weekdaysRef.current?.offsetHeight || 0)
    const nextTop = Math.max(0, target.offsetTop - stickyHeight)
    root.scrollTo({ top: nextTop, behavior: scrollRequest > 0 ? 'smooth' : 'auto' })
  }, [baseMonthKey, displayMode, scrollRequest, showFollowingMonth])

  useEffect(() => {
    const root = scrollRootRef.current
    if (!root || !showFollowingMonth || !onVisibleMonthChange) return

    let frame = 0
    const report = () => {
      frame = 0
      const anchorY = root.getBoundingClientRect().top
        + (stickyChromeRef.current?.offsetHeight || 0)
        + (weekdaysRef.current?.offsetHeight || 0)
        + 24

      const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-calendar-month]'))
      let best: HTMLElement | null = null
      let bestDistance = Number.POSITIVE_INFINITY

      for (const section of sections) {
        const rect = section.getBoundingClientRect()
        const distance = Math.abs(rect.top - anchorY)
        if (distance < bestDistance) {
          bestDistance = distance
          best = section
        }
      }

      const value = best?.dataset.calendarMonth
      if (!value || reportedMonthRef.current === value) return
      const [year, monthIndex] = value.split('-').map(Number)
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return
      reportedMonthRef.current = value
      onVisibleMonthChange(new Date(year, monthIndex - 1, 1))
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(report)
    }

    report()
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [baseMonthKey, onVisibleMonthChange, showFollowingMonth])

  const enterMotion = transitionAnchor && transitionPhase === 'enter'
    ? {
        x: transitionAnchor.offsetX,
        y: transitionAnchor.offsetY,
        scale: 0.94,
        opacity: 0.18,
      }
    : false

  const activeMotion = {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  }

  return (
    <div
      ref={scrollRootRef}
      className={`${basic.monthView} ${polish.monthPolish} ${indicator.monthDensity}`}
      aria-hidden={overlay || undefined}
      aria-busy={isRefreshing || undefined}
    >
      <div ref={stickyChromeRef} className={polish.monthStickyChrome}>{topChrome}</div>

      <div ref={weekdaysRef} className={`${basic.weekdays} ${polish.monthWeekdays}`} aria-label="Días de la semana">
        <span className={basic.weekNumberHeader} aria-hidden="true" />
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`} aria-label={WEEKDAY_NAMES[index]}>
            {label}
          </span>
        ))}
      </div>

      <div className={basic.monthScroll}>
        {visibleMonths.map((visibleMonth) => {
          const weeks = weeksForMonth(visibleMonth)
          const isBaseMonth = isSameMonth(visibleMonth, baseMonth)
          const visibleMonthKey = format(visibleMonth, 'yyyy-MM')

          return (
            <motion.section
              key={visibleMonth.toISOString()}
              ref={isBaseMonth ? activeMonthRef : undefined}
              data-calendar-month={visibleMonthKey}
              className={`${basic.monthSection} ${isBaseMonth ? polish.activeMonthSection : ''}`}
              aria-label={format(visibleMonth, 'MMMM yyyy', { locale: es })}
              initial={isBaseMonth ? enterMotion : false}
              animate={isBaseMonth ? activeMotion : undefined}
              transition={isBaseMonth ? {
                x: SPRING_STANDARD,
                y: SPRING_STANDARD,
                scale: SPRING_STANDARD,
                opacity: VIEW_FADE,
              } : undefined}
              style={isBaseMonth ? {
                viewTransitionName: 'calendar-month-shared',
                transformOrigin: transitionAnchor ? `${transitionAnchor.originX}% ${transitionAnchor.originY}%` : '50% 42%',
                willChange: transitionPhase ? 'transform, opacity' : 'auto',
              } : undefined}
              onAnimationComplete={() => {
                if (isBaseMonth && transitionPhase) onTransitionComplete?.()
              }}
            >
              <header className={basic.monthHeader}>
                <h1 className={basic.monthTitle}>{format(visibleMonth, 'MMMM', { locale: es })}</h1>
              </header>

              <div className={`${basic.monthGrid} ${displayMode === 'details' ? basic.monthGridDetails : ''}`}>
                {weeks.map((week) => (
                  <div
                    key={week[0].toISOString()}
                    className={`${basic.monthWeekRow} ${displayMode === 'details' ? basic.monthWeekRowDetails : ''}`}
                  >
                    <span className={basic.weekNumber} aria-hidden="true">
                      {getWeek(week[0], { weekStartsOn: 0, firstWeekContainsDate: 1 })}
                    </span>

                    {week.map((day) => {
                      const belongs = isSameMonth(day, visibleMonth)
                      const selected = belongs && isSameDay(day, selectedDay)
                      const today = belongs && isToday(day)
                      const dayEvents = belongs ? (eventosPorDia.get(dayKey(day)) || []) : []
                      const compactSegments = compactEventSegments(dayEvents)

                      if (!belongs) {
                        return <span key={day.toISOString()} className={basic.monthDayEmpty} aria-hidden="true" />
                      }

                      const handleDayPress = () => {
                        triggerSoftHaptic()
                        if (openDayOnSelect) {
                          onOpenDay(day)
                          return
                        }

                        onSelectDay(day)
                      }

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          className={`${basic.monthDay} ${displayMode === 'details' ? basic.monthDayDetails : ''}`}
                          onClick={handleDayPress}
                          aria-pressed={openDayOnSelect ? undefined : selected}
                          aria-current={today ? 'date' : undefined}
                          aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}${dayEvents.length ? `, ${dayEvents.length} evento${dayEvents.length === 1 ? '' : 's'}` : ''}${openDayOnSelect ? ', abrir vista del día' : ''}`}
                        >
                          <span className={`${basic.dayNumber} ${!openDayOnSelect && selected && !today ? basic.daySelected : ''} ${today ? basic.dayToday : ''}`}>
                            {format(day, 'd')}
                          </span>

                          {displayMode === 'compact' && dayEvents.length > 0 && (
                            <span className={indicator.eventCompact} aria-hidden="true">
                              {dayEvents.length === 1 ? (
                                <span className={indicator.eventSingleDot} style={{ backgroundColor: compactSegments[0] }} />
                              ) : (
                                <span className={indicator.eventFusion} style={{ width: `${compactSegments.length * 5}px`, minWidth: 0, maxWidth: 30, overflow: 'hidden', background: 'transparent', gap: 0 }}>
                                  {compactSegments.map((color, index) => (
                                    <span
                                      key={`${color}-${index}`}
                                      className={indicator.eventFusionSegment}
                                      style={{
                                        width: 5,
                                        minWidth: 5,
                                        height: 5,
                                        flexGrow: 0,
                                        flexShrink: 0,
                                        marginLeft: 0,
                                        borderRadius: index === 0 ? '999px 0 0 999px' : index === compactSegments.length - 1 ? '0 999px 999px 0' : 0,
                                        backgroundColor: color,
                                      }}
                                    />
                                  ))}
                                </span>
                              )}
                            </span>
                          )}

                          {displayMode === 'stacked' && (
                            <span className={basic.eventBars} aria-hidden="true">
                              {dayEvents.slice(0, 3).map((event, index) => (
                                <span key={`${event.id || event.fecha_inicio}-${index}`} className={basic.eventBar} style={{ backgroundColor: eventColor(event) }} />
                              ))}
                              {dayEvents.length > 3 && <span className={basic.eventMore}>+{dayEvents.length - 3}</span>}
                            </span>
                          )}

                          {displayMode === 'details' && (
                            <span className={basic.eventDetails} aria-hidden="true">
                              {dayEvents.slice(0, 2).map((event, index) => {
                                const color = eventColor(event)
                                return (
                                  <span key={`${event.id || event.fecha_inicio}-${index}`} className={basic.eventChip} style={{ borderColor: color, color }}>
                                    {event.titulo}
                                  </span>
                                )
                              })}
                              {dayEvents.length > 2 && <span className={basic.eventMore}>+{dayEvents.length - 2}</span>}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.section>
          )
        })}

        {footer}
      </div>
    </div>
  )
}
