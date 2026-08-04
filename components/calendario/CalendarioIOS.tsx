'use client'

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Columns3,
  Grid3X3,
  List,
  MapPin,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import CalendarioEventRow from './CalendarioEventRow'
import CalendarioMonthView, { MonthGrid, MonthWeekdayHeader } from './CalendarioMonthView'
import { Timeline, WeekStrip } from './CalendarioTimelineView'
import CalendarioYearView from './CalendarioYearView'
import NuevoEventoCalendarioModal from './NuevoEventoCalendarioModal'
import ProponerIntercambioModal from './ProponerIntercambioModal'
import {
  eventosDelDia,
  monthKey,
  type EventoCalendario,
  type MinisterioGestionado,
  type VistaCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

type ZoomState = { phase: 'hold' | 'in' | 'out'; month: Date; rect: DOMRect }

const VIEW_OPTIONS: Array<{ id: VistaCalendario; label: string; icon: typeof CalendarDays }> = [
  { id: 'anio', label: 'Año', icon: Grid3X3 },
  { id: 'mes', label: 'Mes', icon: CalendarDays },
  { id: 'semana', label: 'Semana', icon: Rows3 },
  { id: 'dia', label: 'Día', icon: Columns3 },
  { id: 'agenda', label: 'Agenda', icon: List },
]

export default function CalendarioIOS({
  asignaciones,
  isRefreshing = false,
  puedeCrear = false,
  puedeCrearGlobal = false,
  ministeriosGestionados = [],
  userId,
  onRefresh,
}: {
  asignaciones: any[]
  isRefreshing?: boolean
  puedeCrear?: boolean
  puedeCrearGlobal?: boolean
  ministeriosGestionados?: MinisterioGestionado[]
  userId: string
  onRefresh: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<VistaCalendario>('anio')
  const [activeDate, setActiveDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [detail, setDetail] = useState<EventoCalendario | null>(null)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [zoom, setZoom] = useState<ZoomState | null>(null)
  const [swap, setSwap] = useState({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null as string | null })
  const touchStartX = useRef<number | null>(null)
  const zoomTimer = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
    }
  }, [])

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDetail(null)
      setViewMenuOpen(false)
      setSearchOpen(false)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  const events = useMemo<EventoCalendario[]>(
    () => asignaciones
      .filter((assignment) => assignment?.eventos)
      .map((assignment) => ({ ...assignment.eventos, asignacion_id: assignment.id, estadoAsignacion: assignment.estado }))
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [asignaciones],
  )

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    if (!needle) return events
    return events.filter((event) =>
      [event.titulo, event.ubicacion, event.descripcion, event.ministerios?.nombre]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es').includes(needle)),
    )
  }, [events, query])

  const finishZoom = (delay: number, callback?: () => void) => {
    if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
    zoomTimer.current = window.setTimeout(() => {
      callback?.()
      setZoom(null)
    }, delay)
  }

  const openMonth = (month: Date, element: HTMLElement) => {
    setZoom({ phase: 'in', month, rect: element.getBoundingClientRect() })
    setActiveDate(month)
    setSelectedDay(month)
    finishZoom(485, () => setView('mes'))
  }

  const backToYear = () => {
    if (view !== 'mes') {
      setView('anio')
      return
    }
    setZoom({ phase: 'hold', month: activeDate, rect: new DOMRect(0, 0, window.innerWidth, window.innerHeight) })
    setView('anio')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-calendar-mini="${monthKey(activeDate)}"]`)
      setZoom({ phase: 'out', month: activeDate, rect: target?.getBoundingClientRect() || new DOMRect(16, 150, 110, 140) })
      finishZoom(455)
    }))
  }

  const changeView = (next: VistaCalendario) => {
    setViewMenuOpen(false)
    if (next === 'anio') backToYear()
    else setView(next)
  }

  const movePeriod = (direction: -1 | 1) => {
    if (view === 'anio') setActiveDate((date) => direction > 0 ? addYears(date, 1) : subYears(date, 1))
    else if (view === 'mes' || view === 'agenda') {
      setActiveDate((date) => direction > 0 ? addMonths(date, 1) : subMonths(date, 1))
      setSelectedDay((date) => direction > 0 ? addMonths(date, 1) : subMonths(date, 1))
    } else if (view === 'semana') {
      setActiveDate((date) => direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1))
      setSelectedDay((date) => direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1))
    } else {
      setActiveDate((date) => direction > 0 ? addDays(date, 1) : subDays(date, 1))
      setSelectedDay((date) => direction > 0 ? addDays(date, 1) : subDays(date, 1))
    }
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

  const openDay = (day: Date) => {
    selectDay(day)
    setView('dia')
  }

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) >= 65) movePeriod(delta < 0 ? 1 : -1)
  }

  function topChrome(context: VistaCalendario, overlay = false) {
    const backYear = context === 'mes'
    const backMonth = context === 'semana' || context === 'dia' || context === 'agenda'
    return (
      <div className={styles.topChrome}>
        <div>
          {backYear && (
            <button className={styles.chromePill} onClick={overlay ? undefined : backToYear} tabIndex={overlay ? -1 : undefined}>
              <ChevronLeft size={19} /> {format(activeDate, 'yyyy')}
            </button>
          )}
          {backMonth && (
            <button className={styles.chromePill} onClick={() => setView('mes')}>
              <ChevronLeft size={19} /> {format(activeDate, 'MMM', { locale: es })}
            </button>
          )}
        </div>
        <div className={styles.chromeGroup}>
          {context !== 'anio' && (
            <button className={styles.chromeIconButton} onClick={() => !overlay && setViewMenuOpen(true)} aria-label="Cambiar vista" tabIndex={overlay ? -1 : undefined}>
              <SlidersHorizontal size={20} />
            </button>
          )}
          <button className={styles.chromeIconButton} onClick={() => !overlay && setSearchOpen(true)} aria-label="Buscar eventos" tabIndex={overlay ? -1 : undefined}>
            <Search size={22} />
          </button>
          {puedeCrear && (
            <button className={styles.chromeIconButton} onClick={() => !overlay && setNewEventOpen(true)} aria-label="Crear evento" tabIndex={overlay ? -1 : undefined}>
              <Plus size={25} />
            </button>
          )}
        </div>
      </div>
    )
  }

  const agendaView = () => {
    const dayEvents = eventosDelDia(events, selectedDay)
    return (
      <>
        {topChrome('agenda')}
        <div className={styles.headerBlock}><h1 className={styles.monthTitle}>{format(activeDate, 'MMMM', { locale: es })}</h1></div>
        <MonthWeekdayHeader />
        <section className={styles.compactMonth}>
          <MonthGrid month={activeDate} selectedDay={selectedDay} events={events} compact onSelectDay={selectDay} />
        </section>
        <header className={styles.agendaHeader}>
          <h2 className={styles.agendaDate}>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h2>
          <span className={styles.agendaCount}>{dayEvents.length}</span>
        </header>
        <div className={styles.eventList}>
          {dayEvents.length > 0
            ? dayEvents.map((event) => <CalendarioEventRow key={event.asignacion_id} evento={event} onOpen={setDetail} />)
            : <div className={styles.emptyState}>No tienes eventos asignados este día.</div>}
        </div>
      </>
    )
  }

  const dayView = () => (
    <>
      {topChrome('dia')}
      <WeekStrip selectedDay={selectedDay} onSelectDay={selectDay} />
      <div className={styles.dayHeading}>{format(selectedDay, "EEEE — d 'de' MMMM", { locale: es })}</div>
      <Timeline day={selectedDay} events={events} onOpenEvent={setDetail} />
    </>
  )

  const weekView = () => {
    const start = startOfWeek(selectedDay, { weekStartsOn: 0 })
    const end = endOfWeek(selectedDay, { weekStartsOn: 0 })
    return (
      <>
        {topChrome('semana')}
        <div className={styles.headerBlock}>
          <h1 className={styles.periodTitle}>{format(start, 'd MMM', { locale: es })} – {format(end, 'd MMM', { locale: es })}</h1>
        </div>
        <WeekStrip selectedDay={selectedDay} onSelectDay={selectDay} />
        <Timeline day={selectedDay} events={events} onOpenEvent={setDetail} />
      </>
    )
  }

  const floatingBar = (
    <div className={styles.floatingBar}>
      <button className={styles.floatingPill} onClick={goToday}>Hoy</button>
      <div className={styles.floatingGroup}>
        <button className={styles.floatingIcon} onClick={() => setViewMenuOpen(true)} aria-label="Cambiar vista"><CalendarDays size={22} /></button>
        <button className={styles.floatingIcon} onClick={() => setView('agenda')} aria-label="Ver agenda"><List size={22} /></button>
      </div>
    </div>
  )

  const portals = mounted ? (
    <>
      {viewMenuOpen && createPortal(
        <>
          <button className={styles.popoverBackdrop} onClick={() => setViewMenuOpen(false)} aria-label="Cerrar menú" />
          <div className={styles.viewPopover} role="menu" aria-label="Vista del calendario">
            {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} role="menuitem" className={`${styles.viewOption} ${view === id ? styles.viewOptionActive : ''}`} onClick={() => changeView(id)}>
                <Icon size={19} /> {label}{view === id && <Check size={17} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}

      {searchOpen && createPortal(
        <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Buscar eventos">
          <header className={styles.searchHeader}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={styles.searchField} placeholder="Buscar eventos" />
            <button className={styles.searchCancel} onClick={() => setSearchOpen(false)}>Cancelar</button>
          </header>
          <div className={styles.eventList}>
            {searchResults.length > 0
              ? searchResults.map((event) => <CalendarioEventRow key={event.asignacion_id} evento={event} onOpen={(item) => { setSearchOpen(false); setDetail(item) }} />)
              : <div className={styles.emptyState}>No se encontraron eventos.</div>}
          </div>
        </div>,
        document.body,
      )}

      {detail && createPortal(
        <div className={styles.detailOverlay} onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
          <section className={styles.detailCard} role="dialog" aria-modal="true" aria-labelledby="evento-detalle-titulo">
            <header className={styles.detailHeader}>
              <div><h2 id="evento-detalle-titulo" className={styles.detailTitle}>{detail.titulo}</h2><p className={styles.detailMinistry}>{detail.ministerios?.nombre || 'Evento general'}</p></div>
              <button className={styles.detailClose} onClick={() => setDetail(null)} aria-label="Cerrar"><X size={19} /></button>
            </header>
            <div className={styles.detailBody}>
              <div className={styles.detailLine}>
                <Clock3 size={21} color="#5b3df5" />
                <div><strong>{format(new Date(detail.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}</strong><p className={styles.detailText}>{detail.todo_el_dia ? 'Todo el día' : `${format(new Date(detail.fecha_inicio), 'h:mm a')}${detail.fecha_fin ? ` – ${format(new Date(detail.fecha_fin), 'h:mm a')}` : ''}`}</p></div>
              </div>
              {detail.ubicacion && <div className={styles.detailLine}><MapPin size={21} color="#13a06f" /><span>{detail.ubicacion}</span></div>}
              {detail.descripcion && <p className={styles.detailText}>{detail.descripcion}</p>}
            </div>
            <footer className={styles.detailFooter}>
              <button className={styles.secondaryButton} onClick={() => { setSwap({ isOpen: true, asignacion_id: detail.asignacion_id, titulo: detail.titulo, ministerio_id: detail.ministerio_id || null }); setDetail(null) }}>
                <span className="inline-flex items-center gap-2"><ArrowLeftRight size={17} /> Intercambio</span>
              </button>
              <button className={styles.primaryButton} onClick={() => setDetail(null)}>Listo</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}

      {zoom && createPortal(
        <div
          className={`${styles.zoomLayer} ${zoom.phase === 'in' ? styles.zoomEnter : zoom.phase === 'out' ? styles.zoomExit : ''}`}
          style={{
            '--zoom-x': `${zoom.rect.left}px`,
            '--zoom-y': `${zoom.rect.top}px`,
            '--zoom-scale-x': String(Math.max(zoom.rect.width / Math.max(window.innerWidth, 1), 0.05)),
            '--zoom-scale-y': String(Math.max(zoom.rect.height / Math.max(window.innerHeight, 1), 0.05)),
          } as CSSProperties}
        >
          <CalendarioMonthView month={zoom.month} selectedDay={zoom.month} events={events} topChrome={topChrome('mes', true)} isRefreshing={false} overlay onSelectDay={() => {}} onOpenDay={() => {}} />
        </div>,
        document.body,
      )}
    </>
  ) : null

  return (
    <div className={styles.calendarScreen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {view === 'anio' && <CalendarioYearView fecha={activeDate} eventos={events} isRefreshing={isRefreshing} topChrome={topChrome('anio')} onOpenMonth={openMonth} />}
      {view === 'mes' && <CalendarioMonthView month={activeDate} selectedDay={selectedDay} events={events} topChrome={topChrome('mes')} isRefreshing={isRefreshing} onSelectDay={selectDay} onOpenDay={openDay} />}
      {view === 'agenda' && agendaView()}
      {view === 'dia' && dayView()}
      {view === 'semana' && weekView()}
      {floatingBar}
      {portals}

      <NuevoEventoCalendarioModal isOpen={newEventOpen} onClose={() => setNewEventOpen(false)} onCreated={onRefresh} ministerios={ministeriosGestionados} puedeCrearGlobal={puedeCrearGlobal} userId={userId} fechaInicial={selectedDay} />
      <ProponerIntercambioModal asignacion_origen_id={swap.asignacion_id} evento_titulo={swap.titulo} ministerio_id={swap.ministerio_id} isOpen={swap.isOpen} onClose={() => setSwap({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null })} />
    </div>
  )
}
