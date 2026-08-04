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
import type { ReactNode } from 'react'
import {
  eventColor,
  eventosDelDia,
  monthKey,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

export default function CalendarioYearView({
  fecha,
  eventos,
  isRefreshing,
  topChrome,
  onOpenMonth,
}: {
  fecha: Date
  eventos: EventoCalendario[]
  isRefreshing: boolean
  topChrome: ReactNode
  onOpenMonth: (month: Date, element: HTMLElement) => void
}) {
  const meses = eachMonthOfInterval({ start: startOfYear(fecha), end: endOfYear(fecha) })

  return (
    <>
      {topChrome}
      <div className={styles.headerBlock}>
        <h1 className={styles.yearTitle}>{format(fecha, 'yyyy')}</h1>
        <p className={styles.subTitle}>
          Tus eventos y turnos asignados{isRefreshing ? ' · Actualizando…' : ''}
        </p>
      </div>
      <section className={styles.yearSurface}>
        <div className={styles.yearGrid}>
          {meses.map((mes) => {
            const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 0 })
            const fin = endOfWeek(endOfMonth(mes), { weekStartsOn: 0 })
            const dias = eachDayOfInterval({ start: inicio, end: fin })
            while (dias.length < 42) dias.push(addDays(dias[dias.length - 1], 1))

            return (
              <button
                key={monthKey(mes)}
                data-calendar-mini={monthKey(mes)}
                className={`${styles.miniMonth} ${isSameMonth(mes, new Date()) ? styles.miniMonthCurrent : ''}`}
                onClick={(event) => onOpenMonth(mes, event.currentTarget)}
              >
                <span className={styles.miniMonthName}>{format(mes, 'MMM', { locale: es })}</span>
                <span className={styles.miniGrid}>
                  {dias.slice(0, 42).map((dia) => {
                    const pertenece = isSameMonth(dia, mes)
                    const today = pertenece && isToday(dia)
                    const items = pertenece ? eventosDelDia(eventos, dia) : []
                    return (
                      <span
                        key={dia.toISOString()}
                        className={`${styles.miniDay} ${!pertenece ? styles.miniDayOutside : ''} ${today ? styles.miniDayToday : ''}`}
                      >
                        {pertenece ? format(dia, 'd') : ''}
                        {items.length > 0 && !today && (
                          <span className={styles.miniEventDot} style={{ backgroundColor: eventColor(items[0]) }} />
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
    </>
  )
}
