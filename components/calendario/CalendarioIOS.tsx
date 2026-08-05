'use client'

import { format, getDaysInMonth, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import CalendarioEventRow from './CalendarioEventRow'
import CalendarioMonthView from './CalendarioMonthView'
import CalendarioMultiDayView from './CalendarioMultiDayView'
import CalendarioYearView from './CalendarioYearView'
import NuevoEventoCalendarioModal from './NuevoEventoCalendarioModal'
import {
  eventKey,
  type CalendarioOrigen,
  type EventoCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

type BasicView = 'anio' | 'mes' | 'dia'

export default function CalendarioIOS({
  events,
  isRefreshing = false,
  editableCalendars = [],
  userId,
  onRefresh,
  onOpenCalendars,
  onRangeYearChange,
}: {
  events: EventoCalendario[]
  isRefreshing?: boolean
  editableCalendars?: CalendarioOrigen[]
  userId: string
  onRefresh: () => void
  onOpenCalendars: () => void
  onRangeYearChange: (year: number) => void
  externalDetail?: EventoCalendario | null
  onExternalDetailConsumed?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<BasicView>('anio')
  const [activeDate, setActiveDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(false)

  const puedeCrear = editableCalendars.length > 0

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    onRangeYearChange(activeDate.getFullYear())
  }, [activeDate, onRangeYearChange])

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [events],
  )

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    if (!needle) return sortedEvents
    return sortedEvents.filter((event) =>
      [event.titulo, event.ubicacion, event.descripcion, event.calendars?.nombre, event.ministerios?.nombre]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es').includes(needle)),
    )
  }, [sortedEvents, query])

  const selectedDayForMonth = (month: Date) => {
    if (isSameMonth(selectedDay, month)) return selectedDay
    const today = new Date()
    if (isSameMonth(today, month)) return today
    return new Date(
      month.getFullYear(),
      month.getMonth(),
      Math.min(selectedDay.getDate(), getDaysInMonth(month)),
    )
  }

  const openMonth = (month: Date) => {
    const next = selectedDayForMonth(month)
    setActiveDate(next)
    setSelectedDay(next)
    setView('mes')
  }

  const openDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
    setView('dia')
  }

  const goBack = () => {
    if (view === 'dia') {
      setView('mes')
      return
    }
    if (view === 'mes') setView('anio')
  }

  const goToday = () => {
    const today = new Date()
    setActiveDate(today)
    setSelectedDay(today)
    setView(view === 'dia' ? 'dia' : 'mes')
  }

  const selectDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
  }

  const backLabel = view === 'dia'
    ? format(activeDate, 'MMMM', { locale: es })
    : format(activeDate, 'yyyy')

  const topChrome = (
    <div className={styles.topChrome}>
      <div>
        {view !== 'anio' && (
          <button className={styles.chromePill} onClick={goBack} aria-label={view === 'dia' ? 'Volver al mes' : 'Volver al año'}>
            <ChevronLeft size={19} /> {backLabel}
          </button>
        )}
      </div>
      <div className={styles.chromeGroup}>
        <button className={styles.chromeIconButton} onClick={() => setSearchOpen(true)} aria-label="Buscar eventos">
          <Search size={22} />
        </button>
        {puedeCrear && (
          <button className={styles.chromeIconButton} onClick={() => setNewEventOpen(true)} aria-label="Crear evento o recordatorio">
            <Plus size={25} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.calendarScreen}>
      {view === 'anio' && (
        <CalendarioYearView
          fecha={activeDate}
          eventos={sortedEvents}
          isRefreshing={isRefreshing}
          topChrome={topChrome}
          onOpenMonth={(month) => openMonth(month)}
          onChangeYear={(year) => {
            const next = new Date(year, activeDate.getMonth(), Math.min(activeDate.getDate(), 28))
            setActiveDate(next)
          }}
        />
      )}

      {view === 'mes' && (
        <CalendarioMonthView
          month={activeDate}
          selectedDay={selectedDay}
          events={sortedEvents}
          topChrome={topChrome}
          isRefreshing={isRefreshing}
          dayPanelOpen={false}
          onSelectDay={selectDay}
          onOpenDay={openDay}
          onOpenEvent={() => {}}
        />
      )}

      {view === 'dia' && (
        <>
          {topChrome}
          <div className={styles.headerBlock}>
            <h1 className={styles.periodTitle}>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h1>
          </div>
          <CalendarioMultiDayView
            selectedDay={selectedDay}
            events={sortedEvents}
            daysVisible={1}
            onSelectDay={selectDay}
            onOpenEvent={() => {}}
          />
        </>
      )}

      <div className={styles.floatingBar}>
        <button className={styles.floatingPill} onClick={goToday}>Hoy</button>
        <div className={styles.floatingGroup}>
          <button className={styles.floatingIcon} onClick={onOpenCalendars} aria-label="Abrir calendarios">
            <CalendarDays size={22} />
          </button>
        </div>
      </div>

      {mounted && searchOpen && createPortal(
        <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Buscar eventos y recordatorios">
          <header className={styles.searchHeader}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={styles.searchField} placeholder="Buscar" />
            <button className={styles.searchCancel} onClick={() => setSearchOpen(false)}>Cancelar</button>
          </header>
          <div className={styles.eventList}>
            {searchResults.length > 0
              ? searchResults.map((event) => <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={() => setSearchOpen(false)} />)
              : <div className={styles.emptyState}>No se encontraron resultados.</div>}
          </div>
        </div>,
        document.body,
      )}

      <NuevoEventoCalendarioModal
        isOpen={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        onCreated={onRefresh}
        editableCalendars={editableCalendars}
        userId={userId}
        fechaInicial={selectedDay}
      />
    </div>
  )
}
