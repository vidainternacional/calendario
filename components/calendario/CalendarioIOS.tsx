'use client'

import {
  format,
  getDaysInMonth,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Plus,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import CalendarioAgendaView from './CalendarioAgendaView'
import CalendarioEventDetail from './CalendarioEventDetail'
import CalendarioEventRow from './CalendarioEventRow'
import CalendarioMonthView, { type MonthDisplayMode } from './CalendarioMonthView'
import CalendarioMultiDayView from './CalendarioMultiDayView'
import CalendarioYearView from './CalendarioYearView'
import NuevoEventoCalendarioModal from './NuevoEventoCalendarioModal'
import {
  AgendaViewIcon,
  CompactViewIcon,
  DayViewIcon,
  DetailsViewIcon,
  MonthListViewIcon,
  StackedViewIcon,
  TwoDayViewIcon,
} from './CalendarioViewIcons'
import {
  eventKey,
  eventosDelDia,
  type CalendarioOrigen,
  type EventoCalendario,
  type TimelineDayCount,
} from './calendario-ios-types'
import chrome from './CalendarioChrome.module.css'
import styles from './CalendarioIOS.module.css'

type CalendarView = 'anio' | 'mes' | 'dia' | 'dos-dias' | 'agenda' | 'lista'
type TimelineView = 'dia' | 'dos-dias' | 'agenda'
type MonthMenuMode = MonthDisplayMode | 'list'

type MenuOption<T extends string> = {
  id: T
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  separated?: boolean
}

const MONTH_VIEW_OPTIONS: Array<MenuOption<MonthMenuMode>> = [
  { id: 'compact', label: 'Compacto', icon: CompactViewIcon },
  { id: 'stacked', label: 'Apilado', icon: StackedViewIcon },
  { id: 'details', label: 'Detalles', icon: DetailsViewIcon },
  { id: 'list', label: 'Lista', icon: MonthListViewIcon, separated: true },
]

const TIMELINE_VIEW_OPTIONS: Array<MenuOption<TimelineView>> = [
  { id: 'dia', label: 'Día', icon: DayViewIcon },
  { id: 'dos-dias', label: '2 días', icon: TwoDayViewIcon },
  { id: 'agenda', label: 'Lista', icon: AgendaViewIcon },
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
  const [monthDisplay, setMonthDisplay] = useState<MonthMenuMode>('compact')
  const [activeDate, setActiveDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [monthScrollRequest, setMonthScrollRequest] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null)

  const puedeCrear = editableCalendars.length > 0
  const isMonthContext = view === 'mes' || view === 'lista'

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

  const selectedDayEvents = useMemo(
    () => eventosDelDia(sortedEvents, selectedDay),
    [selectedDay, sortedEvents],
  )

  const selectedDayForMonth = (month: Date) => {
    if (isSameMonth(selectedDay, month)) return selectedDay
    const today = new Date()
    if (isSameMonth(today, month)) return today
    return new Date(month.getFullYear(), month.getMonth(), Math.min(selectedDay.getDate(), getDaysInMonth(month)))
  }

  const openMonth = (month: Date, _element?: HTMLElement) => {
    const next = selectedDayForMonth(month)
    setActiveDate(next)
    setSelectedDay(next)
    setView(monthDisplay === 'list' ? 'lista' : 'mes')
  }

  const openDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
    setView('dia')
  }

  const selectDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
  }

  const changeMonthView = (nextMode: MonthMenuMode) => {
    setMonthDisplay(nextMode)
    setActiveDate(selectedDay)
    setView(nextMode === 'list' ? 'lista' : 'mes')
    setViewMenuOpen(false)
  }

  const changeTimelineView = (nextView: TimelineView) => {
    setActiveDate(selectedDay)
    setView(nextView)
    setViewMenuOpen(false)
  }

  const goBack = () => {
    if (view === 'mes' || view === 'lista') {
      setView('anio')
      return
    }
    setView(monthDisplay === 'list' ? 'lista' : 'mes')
  }

  const goToday = () => {
    const today = new Date()
    setActiveDate(today)
    setSelectedDay(today)
    if (view === 'mes' || view === 'lista') setMonthScrollRequest((request) => request + 1)
  }

  const backLabel = view === 'mes' || view === 'lista'
    ? format(activeDate, 'yyyy')
    : format(activeDate, 'MMMM', { locale: es })

  const timelineDays: TimelineDayCount | null = view === 'dia' ? 1 : view === 'dos-dias' ? 2 : null

  const currentMenuOption = isMonthContext
    ? MONTH_VIEW_OPTIONS.find((option) => option.id === monthDisplay)
    : TIMELINE_VIEW_OPTIONS.find((option) => option.id === view)
  const currentMenuLabel = currentMenuOption?.label || (isMonthContext ? 'Compacto' : 'Día')
  const CurrentMenuIcon = currentMenuOption?.icon || DayViewIcon

  const listFooter = (
    <div className={`${styles.eventList} ${chrome.eventListTheme}`}>
      <section>
        <div className={`${styles.agendaHeader} ${chrome.agendaHeaderTheme}`}>
          <h2 className={`${styles.agendaDate} ${chrome.agendaDateTheme}`}>{format(selectedDay, 'EEEE d', { locale: es })}</h2>
          <span className={`${styles.agendaCount} ${chrome.mutedTheme}`}>{selectedDayEvents.length}</span>
        </div>
        {selectedDayEvents.length > 0 ? selectedDayEvents.map((event) => (
          <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={setSelectedEvent} />
        )) : <div className={`${styles.emptyState} ${chrome.emptyTheme}`}>No hay eventos ni recordatorios para esta fecha.</div>}
      </section>
    </div>
  )

  const topChrome = (
    <div className={`${styles.topChrome} ${chrome.topChrome}`}>
      <div className={chrome.leftSlot}>
        {view !== 'anio' && (
          <button type="button" className={`${styles.chromePill} ${chrome.backButton}`} onClick={goBack} aria-label={view === 'mes' || view === 'lista' ? 'Volver al año' : 'Volver al mes'}>
            <ChevronLeft size={24} strokeWidth={2.4} />
            <span className={chrome.backText}>{backLabel}</span>
          </button>
        )}
      </div>
      <div className={`${styles.chromeGroup} ${chrome.actionsGroup}`} role="group" aria-label="Acciones del calendario">
        {view !== 'anio' && (
          <button type="button" className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`} onClick={() => setViewMenuOpen((open) => !open)} aria-label={`Cambiar vista. Vista actual: ${currentMenuLabel}`} aria-expanded={viewMenuOpen} aria-controls="calendar-view-selector">
            <CurrentMenuIcon size={25} />
          </button>
        )}
        <button type="button" className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`} onClick={() => setSearchOpen(true)} aria-label="Buscar eventos"><Search size={25} /></button>
        {puedeCrear && <button type="button" className={`${styles.chromeIconButton} ${chrome.chromeIconButton}`} onClick={() => setNewEventOpen(true)} aria-label="Crear evento o recordatorio"><Plus size={28} /></button>}
      </div>
    </div>
  )

  return (
    <div className={`${styles.calendarScreen} ${chrome.rootTheme}`}>
      <AnimatePresence initial={false} mode="sync">
        {view === 'anio' && (
          <CalendarioYearView
            key="calendar-year"
            fecha={activeDate}
            eventos={sortedEvents}
            isRefreshing={isRefreshing}
            topChrome={topChrome}
            onOpenMonth={openMonth}
            onChangeYear={(year) => setActiveDate(new Date(year, activeDate.getMonth(), Math.min(activeDate.getDate(), 28)))}
          />
        )}

        {view === 'mes' && (
          <CalendarioMonthView
            key={`calendar-month-${format(activeDate, 'yyyy-MM')}`}
            month={activeDate}
            selectedDay={selectedDay}
            events={sortedEvents}
            displayMode={monthDisplay === 'list' ? 'compact' : monthDisplay}
            topChrome={topChrome}
            isRefreshing={isRefreshing}
            dayPanelOpen={false}
            scrollRequest={monthScrollRequest}
            onSelectDay={selectDay}
            onOpenDay={openDay}
            onOpenEvent={setSelectedEvent}
          />
        )}
      </AnimatePresence>

      {timelineDays && (
        <>
          {topChrome}
          <CalendarioMultiDayView selectedDay={selectedDay} events={sortedEvents} daysVisible={timelineDays} onSelectDay={selectDay} onOpenEvent={setSelectedEvent} />
        </>
      )}

      {view === 'agenda' && (
        <>
          {topChrome}
          <CalendarioAgendaView selectedDay={selectedDay} events={sortedEvents} onSelectDay={selectDay} onOpenEvent={setSelectedEvent} />
        </>
      )}

      {view === 'lista' && (
        <CalendarioMonthView month={activeDate} selectedDay={selectedDay} events={sortedEvents} displayMode="compact" topChrome={topChrome} isRefreshing={isRefreshing} dayPanelOpen={false} scrollRequest={monthScrollRequest} showFollowingMonth={false} openDayOnSelect={false} footer={listFooter} onSelectDay={selectDay} onOpenDay={openDay} onOpenEvent={setSelectedEvent} />
      )}

      <div className={`${styles.floatingBar} ${chrome.floatingBar}`}>
        <button type="button" className={`${styles.floatingPill} ${chrome.floatingPill}`} onClick={goToday}>Hoy</button>
        <div className={`${styles.floatingGroup} ${chrome.floatingGroup}`}>
          <button type="button" className={`${styles.floatingIcon} ${chrome.floatingIcon}`} onClick={onOpenCalendars} aria-label="Abrir calendarios"><CalendarDays size={24} /></button>
        </div>
      </div>

      {mounted && viewMenuOpen && view !== 'anio' && createPortal(
        <>
          <button type="button" className={`${styles.popoverBackdrop} ${chrome.popoverBackdrop}`} onClick={() => setViewMenuOpen(false)} aria-label="Cerrar selector de vista" />
          <div id="calendar-view-selector" className={`${styles.viewPopover} ${chrome.viewPopover}`} role="menu" aria-label="Vistas del calendario">
            <div className={chrome.viewOptions}>
              {(isMonthContext ? MONTH_VIEW_OPTIONS : TIMELINE_VIEW_OPTIONS).map((option) => {
                const Icon = option.icon
                const active = isMonthContext ? option.id === monthDisplay : option.id === view
                return (
                  <div key={option.id}>
                    {option.separated && <div className={chrome.viewSeparator} aria-hidden="true" />}
                    <button
                      type="button"
                      className={`${styles.viewOption} ${chrome.viewOption} ${active ? `${styles.viewOptionActive} ${chrome.viewOptionActive}` : ''}`}
                      onClick={() => {
                        if (isMonthContext) changeMonthView(option.id as MonthMenuMode)
                        else changeTimelineView(option.id as TimelineView)
                      }}
                      role="menuitemradio"
                      aria-checked={active}
                    >
                      {active ? <Check size={20} className={chrome.viewCheck} /> : <span className={chrome.viewCheckHidden} />}
                      <Icon size={26} />
                      <span>{option.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </>, document.body,
      )}

      {mounted && searchOpen && createPortal(
        <div className={`${styles.searchOverlay} ${chrome.searchOverlayTheme}`} role="dialog" aria-modal="true" aria-label="Buscar eventos y recordatorios">
          <header className={`${styles.searchHeader} ${chrome.searchHeaderTheme}`}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={`${styles.searchField} ${chrome.searchFieldTheme}`} placeholder="Buscar" />
            <button type="button" className={`${styles.searchCancel} ${chrome.searchCancelTheme}`} onClick={() => setSearchOpen(false)}>Cancelar</button>
          </header>
          <div className={`${styles.eventList} ${chrome.eventListTheme}`}>
            {searchResults.length > 0 ? searchResults.map((event) => (
              <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={(item) => { setSearchOpen(false); setSelectedEvent(item) }} />
            )) : <div className={`${styles.emptyState} ${chrome.emptyTheme}`}>No se encontraron resultados.</div>}
          </div>
        </div>, document.body,
      )}

      <CalendarioEventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <NuevoEventoCalendarioModal isOpen={newEventOpen} onClose={() => setNewEventOpen(false)} onCreated={onRefresh} editableCalendars={editableCalendars} userId={userId} fechaInicial={selectedDay} />
    </div>
  )
}
