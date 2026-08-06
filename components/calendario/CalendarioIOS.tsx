'use client'

import {
  addDays,
  addMonths,
  addYears,
  format,
  getDaysInMonth,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Columns3,
  Grid3X3,
  List,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import CalendarioEventDetail from './CalendarioEventDetail'
import CalendarioEventRow from './CalendarioEventRow'
import CalendarioMonthView from './CalendarioMonthView'
import CalendarioMultiDayView from './CalendarioMultiDayView'
import CalendarioYearView from './CalendarioYearView'
import NuevoEventoCalendarioModal from './NuevoEventoCalendarioModal'
import {
  eventKey,
  type CalendarioOrigen,
  type EventoCalendario,
  type TimelineDayCount,
} from './calendario-ios-types'
import chrome from './CalendarioChrome.module.css'
import styles from './CalendarioIOS.module.css'

type CalendarView = 'anio' | 'mes' | 'dia' | 'tres-dias' | 'semana' | 'lista'

const VIEW_OPTIONS: Array<{
  id: CalendarView
  label: string
  icon: typeof Grid3X3
}> = [
  { id: 'anio', label: 'Año', icon: Grid3X3 },
  { id: 'mes', label: 'Mes', icon: CalendarDays },
  { id: 'dia', label: 'Día', icon: Clock3 },
  { id: 'tres-dias', label: '3 días', icon: Columns3 },
  { id: 'semana', label: 'Semana', icon: Rows3 },
  { id: 'lista', label: 'Lista', icon: List },
]

export default function CalendarioIOS({
  events,
  isRefreshing = false,
  editableCalendars = [],
  userId,
  onRefresh,
  onOpenCalendars,
  onRangeYearChange,
  externalDetail,
  onExternalDetailConsumed,
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
  const [view, setView] = useState<CalendarView>('anio')
  const [activeDate, setActiveDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null)

  const puedeCrear = editableCalendars.length > 0
  const currentView = VIEW_OPTIONS.find((option) => option.id === view) ?? VIEW_OPTIONS[0]

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    onRangeYearChange(activeDate.getFullYear())
  }, [activeDate, onRangeYearChange])

  useEffect(() => {
    if (!externalDetail) return
    setSelectedEvent(externalDetail)
    onExternalDetailConsumed?.()
  }, [externalDetail, onExternalDetailConsumed])

  useEffect(() => {
    if (!viewMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewMenuOpen])

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

  const monthEvents = useMemo(
    () => sortedEvents.filter((event) => isSameMonth(new Date(event.fecha_inicio), activeDate)),
    [activeDate, sortedEvents],
  )

  const listGroups = useMemo(() => {
    const groups = new Map<string, { date: Date; events: EventoCalendario[] }>()

    for (const event of monthEvents) {
      const date = new Date(event.fecha_inicio)
      const key = format(date, 'yyyy-MM-dd')
      const group = groups.get(key)
      if (group) {
        group.events.push(event)
      } else {
        groups.set(key, { date, events: [event] })
      }
    }

    return [...groups.values()]
  }, [monthEvents])

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

  const changeView = (nextView: CalendarView) => {
    if (nextView !== 'anio') setActiveDate(selectedDay)
    setView(nextView)
    setViewMenuOpen(false)
  }

  const goBack = () => {
    if (view === 'mes') {
      setView('anio')
      return
    }

    if (view !== 'anio') setView('mes')
  }

  const movePeriod = (direction: -1 | 1) => {
    if (view === 'anio') {
      setActiveDate((current) => addYears(current, direction))
      return
    }

    if (view === 'mes' || view === 'lista') {
      const nextMonth = addMonths(activeDate, direction)
      const nextDay = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDay.getDate(), getDaysInMonth(nextMonth)),
      )
      setActiveDate(nextDay)
      setSelectedDay(nextDay)
      return
    }

    const step = view === 'dia' ? 1 : view === 'tres-dias' ? 3 : 7
    const nextDay = addDays(selectedDay, direction * step)
    setActiveDate(nextDay)
    setSelectedDay(nextDay)
  }

  const goToday = () => {
    const today = new Date()
    setActiveDate(today)
    setSelectedDay(today)
    if (view === 'anio') setView('mes')
  }

  const selectDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
  }

  const backLabel = view === 'mes'
    ? format(activeDate, 'yyyy')
    : format(activeDate, 'MMMM', { locale: es })

  const timelineDays: TimelineDayCount | null = view === 'dia'
    ? 1
    : view === 'tres-dias'
      ? 3
      : view === 'semana'
        ? 7
        : null

  const timelineTitle = view === 'dia'
    ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
    : view === 'tres-dias'
      ? `${format(selectedDay, 'd MMM', { locale: es })} – ${format(addDays(selectedDay, 2), 'd MMM', { locale: es })}`
      : `${format(selectedDay, 'd MMM', { locale: es })} – ${format(addDays(selectedDay, 6), 'd MMM', { locale: es })}`

  const topChrome = (
    <div className={`${styles.topChrome} ${chrome.topChrome}`}>
      <div className={chrome.leftSlot}>
        {view !== 'anio' && (
          <button
            type="button"
            className={`${styles.chromePill} ${chrome.backButton}`}
            onClick={goBack}
            aria-label={view === 'mes' ? 'Volver al año' : 'Volver al mes'}
          >
            <ChevronLeft size={19} />
            <span className={chrome.backText}>{backLabel}</span>
          </button>
        )}
      </div>

      <div className={`${styles.chromeGroup} ${chrome.periodGroup}`} role="group" aria-label="Cambiar período">
        <button
          type="button"
          className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`}
          onClick={() => movePeriod(-1)}
          aria-label="Período anterior"
        >
          <ChevronLeft size={21} />
        </button>
        <button
          type="button"
          className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`}
          onClick={() => movePeriod(1)}
          aria-label="Período siguiente"
        >
          <ChevronRight size={21} />
        </button>
      </div>

      <div className={`${styles.chromeGroup} ${chrome.actionsGroup}`} role="group" aria-label="Acciones del calendario">
        <button
          type="button"
          className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`}
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar eventos"
        >
          <Search size={22} />
        </button>
        {puedeCrear && (
          <button
            type="button"
            className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`}
            onClick={() => setNewEventOpen(true)}
            aria-label="Crear evento o recordatorio"
          >
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
          onOpenEvent={setSelectedEvent}
        />
      )}

      {timelineDays && (
        <>
          {topChrome}
          <div className={styles.headerBlock}>
            <h1 className={styles.periodTitle}>{timelineTitle}</h1>
          </div>
          <CalendarioMultiDayView
            selectedDay={selectedDay}
            events={sortedEvents}
            daysVisible={timelineDays}
            onSelectDay={selectDay}
            onOpenEvent={setSelectedEvent}
          />
        </>
      )}

      {view === 'lista' && (
        <>
          {topChrome}
          <div className={styles.headerBlock}>
            <h1 className={styles.periodTitle}>{format(activeDate, 'MMMM yyyy', { locale: es })}</h1>
            <p className={styles.subTitle}>Eventos y recordatorios del mes</p>
          </div>
          <div className={styles.eventList}>
            {listGroups.length > 0 ? (
              listGroups.map((group) => (
                <section key={format(group.date, 'yyyy-MM-dd')}>
                  <div className={styles.agendaHeader}>
                    <h2 className={styles.agendaDate}>{format(group.date, 'EEEE d', { locale: es })}</h2>
                    <span className={styles.agendaCount}>{group.events.length}</span>
                  </div>
                  {group.events.map((event) => (
                    <CalendarioEventRow
                      key={eventKey(event)}
                      evento={event}
                      onOpen={setSelectedEvent}
                    />
                  ))}
                </section>
              ))
            ) : (
              <div className={styles.emptyState}>No hay eventos ni recordatorios en este mes.</div>
            )}
          </div>
        </>
      )}

      <div className={`${styles.floatingBar} ${chrome.floatingBar}`}>
        <button type="button" className={styles.floatingPill} onClick={goToday}>Hoy</button>
        <div className={`${styles.floatingGroup} ${chrome.floatingGroup}`}>
          <button
            type="button"
            className={`${styles.floatingIcon} ${chrome.viewTrigger}`}
            onClick={() => setViewMenuOpen(true)}
            aria-label={`Cambiar vista. Vista actual: ${currentView.label}`}
            aria-expanded={viewMenuOpen}
            aria-controls="calendar-view-selector"
          >
            <SlidersHorizontal size={21} />
            <span className={chrome.viewTriggerLabel}>{currentView.label}</span>
          </button>
          <button
            type="button"
            className={styles.floatingIcon}
            onClick={onOpenCalendars}
            aria-label="Abrir calendarios"
          >
            <CalendarDays size={22} />
          </button>
        </div>
      </div>

      {mounted && viewMenuOpen && createPortal(
        <>
          <button
            type="button"
            className={styles.popoverBackdrop}
            onClick={() => setViewMenuOpen(false)}
            aria-label="Cerrar selector de vista"
          />
          <div
            id="calendar-view-selector"
            className={`${styles.viewPopover} ${chrome.viewPopover}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-view-selector-title"
          >
            <header className={chrome.viewPopoverHeader}>
              <div className={chrome.viewPopoverHeading}>
                <h2 id="calendar-view-selector-title">Vista del calendario</h2>
                <p>Actual: {currentView.label}</p>
              </div>
              <button
                type="button"
                className={chrome.viewPopoverClose}
                onClick={() => setViewMenuOpen(false)}
                aria-label="Cerrar selector de vista"
              >
                <X size={20} />
              </button>
            </header>

            <div className={chrome.viewOptions} role="menu" aria-label="Vistas disponibles">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = option.id === view
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`${styles.viewOption} ${chrome.viewOption} ${active ? styles.viewOptionActive : ''}`}
                    onClick={() => changeView(option.id)}
                    role="menuitemradio"
                    aria-checked={active}
                  >
                    <Icon size={19} />
                    <span>{option.label}</span>
                    {active && <Check size={18} className={chrome.viewCheck} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>,
        document.body,
      )}

      {mounted && searchOpen && createPortal(
        <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Buscar eventos y recordatorios">
          <header className={styles.searchHeader}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={styles.searchField} placeholder="Buscar" />
            <button className={styles.searchCancel} onClick={() => setSearchOpen(false)}>Cancelar</button>
          </header>
          <div className={styles.eventList}>
            {searchResults.length > 0
              ? searchResults.map((event) => (
                  <CalendarioEventRow
                    key={eventKey(event)}
                    evento={event}
                    onOpen={(item) => {
                      setSearchOpen(false)
                      setSelectedEvent(item)
                    }}
                  />
                ))
              : <div className={styles.emptyState}>No se encontraron resultados.</div>}
          </div>
        </div>,
        document.body,
      )}

      <CalendarioEventDetail
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

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
