'use client'

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  getISOWeek,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeftRight,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Columns3,
  Grid3X3,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { eliminarElementoCalendario } from '@/app/actions/eventos'
import CalendarioEventRow from './CalendarioEventRow'
import CalendarioMonthView from './CalendarioMonthView'
import CalendarioMultiDayView from './CalendarioMultiDayView'
import CalendarioYearView from './CalendarioYearView'
import EditarElementoCalendarioModal from './EditarElementoCalendarioModal'
import NuevoEventoCalendarioModal from './NuevoEventoCalendarioModal'
import ProponerIntercambioModal from './ProponerIntercambioModal'
import {
  eventColor,
  eventKey,
  type CalendarioOrigen,
  type EventoCalendario,
  type TimelineDayCount,
  type VistaCalendario,
} from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import motion from './CalendarioMotionFix.module.css'
import native from './CalendarioNativeUX.module.css'

type ZoomState = { month: Date; selectedDay: Date; rect: DOMRect }
type ScreenTransition = 'month-out' | 'year-in' | null

const VIEW_OPTIONS: Array<{ id: VistaCalendario; label: string; icon: typeof CalendarDays }> = [
  { id: 'anio', label: 'Año', icon: Grid3X3 },
  { id: 'mes', label: 'Mes', icon: CalendarDays },
  { id: 'dia', label: 'Día', icon: Clock3 },
  { id: 'multiday', label: 'Varios días', icon: Columns3 },
  { id: 'lista', label: 'Lista', icon: List },
]

const DAY_COUNTS: TimelineDayCount[] = [1, 2, 3, 5, 7]

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
  const [view, setView] = useState<VistaCalendario>('anio')
  const [timelineDays, setTimelineDays] = useState<TimelineDayCount>(3)
  const [activeDate, setActiveDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [monthDayOpen, setMonthDayOpen] = useState(false)
  const [detail, setDetail] = useState<EventoCalendario | null>(null)
  const [editingItem, setEditingItem] = useState<EventoCalendario | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [zoom, setZoom] = useState<ZoomState | null>(null)
  const [screenTransition, setScreenTransition] = useState<ScreenTransition>(null)
  const [swap, setSwap] = useState({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null as string | null })
  const touchStartX = useRef<number | null>(null)
  const zoomTimer = useRef<number | null>(null)
  const screenTimer = useRef<number | null>(null)

  const puedeCrear = editableCalendars.length > 0
  const activeTimelineDays: TimelineDayCount = view === 'dia' ? 1 : timelineDays

  useEffect(() => {
    setMounted(true)
    return () => {
      if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
      if (screenTimer.current) window.clearTimeout(screenTimer.current)
    }
  }, [])

  useEffect(() => {
    onRangeYearChange(activeDate.getFullYear())
  }, [activeDate.getFullYear(), onRangeYearChange])

  useEffect(() => {
    if (!externalDetail) return
    setDetail(externalDetail)
    setDetailError('')
    onExternalDetailConsumed?.()
  }, [externalDetail?.kind, externalDetail?.id, onExternalDetailConsumed])

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDetail(null)
      setEditingItem(null)
      setViewMenuOpen(false)
      setSearchOpen(false)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

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

  const monthListGroups = useMemo(() => {
    const start = startOfMonth(activeDate)
    const end = endOfMonth(activeDate)
    const monthEvents = sortedEvents.filter((event) => {
      const date = new Date(event.fecha_inicio)
      return date >= start && date <= end
    })
    return [...new Set(monthEvents.map((event) => format(new Date(event.fecha_inicio), 'yyyy-MM-dd')))]
      .map((key) => ({
        key,
        day: new Date(`${key}T12:00:00`),
        events: monthEvents.filter((event) => format(new Date(event.fecha_inicio), 'yyyy-MM-dd') === key),
      }))
  }, [activeDate, sortedEvents])

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

  const openMonth = (month: Date, element: HTMLElement) => {
    const nextSelectedDay = selectedDayForMonth(month)
    setZoom({ month, selectedDay: nextSelectedDay, rect: element.getBoundingClientRect() })
    setActiveDate(nextSelectedDay)
    setSelectedDay(nextSelectedDay)
    setMonthDayOpen(false)

    if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
    zoomTimer.current = window.setTimeout(() => {
      setView('mes')
      setZoom(null)
    }, 485)
  }

  const changeYear = (year: number) => {
    const safeYear = Math.min(2200, Math.max(1800, year))
    setActiveDate((date) => {
      const month = date.getMonth()
      return new Date(safeYear, month, Math.min(date.getDate(), getDaysInMonth(new Date(safeYear, month, 1))))
    })
  }

  const backToYear = () => {
    if (view === 'anio') return
    setMonthDayOpen(false)
    if (screenTimer.current) window.clearTimeout(screenTimer.current)
    setScreenTransition('month-out')
    screenTimer.current = window.setTimeout(() => {
      setView('anio')
      setScreenTransition('year-in')
      screenTimer.current = window.setTimeout(() => setScreenTransition(null), 270)
    }, 150)
  }

  const changeView = (next: VistaCalendario) => {
    setViewMenuOpen(false)

    if (next === 'anio') {
      backToYear()
      return
    }

    if (next === 'dia') {
      setTimelineDays(1)
      setView('dia')
      return
    }

    if (next === 'multiday') {
      setTimelineDays((current) => current === 1 ? 3 : current)
      setView('multiday')
      return
    }

    if (next === 'mes') setMonthDayOpen(false)
    setView(next)
  }

  const changeTimelineDays = (count: TimelineDayCount) => {
    setTimelineDays(count)
    setView(count === 1 ? 'dia' : 'multiday')
    setViewMenuOpen(false)
  }

  const movePeriod = (direction: -1 | 1) => {
    if (view === 'anio') return

    if (view === 'dia' || view === 'multiday') {
      const next = addDays(selectedDay, direction * activeTimelineDays)
      setSelectedDay(next)
      setActiveDate(next)
      return
    }

    const next = direction > 0 ? addMonths(activeDate, 1) : subMonths(activeDate, 1)
    setActiveDate(next)
    setSelectedDay(selectedDayForMonth(next))
    setMonthDayOpen(false)
  }

  const goToday = () => {
    const today = new Date()
    setActiveDate(today)
    setSelectedDay(today)
    setMonthDayOpen(false)
    if (view === 'anio') setView('mes')
  }

  const selectTimelineDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
  }

  const openMonthDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
    setMonthDayOpen(true)
  }

  const onTouchStart = (event: TouchEvent) => {
    if (view === 'anio') return
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (view === 'anio' || touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) >= 65) movePeriod(delta < 0 ? 1 : -1)
  }

  const openDetail = (item: EventoCalendario) => {
    setDetail(item)
    setDetailError('')
  }

  async function deleteFromDetail() {
    if (!detail) return
    const confirmed = window.confirm(
      detail.kind === 'reminder'
        ? '¿Eliminar este recordatorio?'
        : '¿Eliminar este evento? Las asignaciones relacionadas también dejarán de mostrarse.',
    )
    if (!confirmed) return

    const formData = new FormData()
    formData.set('item_id', detail.id)
    formData.set('item_type', detail.kind)

    setDeleting(true)
    setDetailError('')
    const result = await eliminarElementoCalendario(formData)
    setDeleting(false)

    if (!result.success) {
      setDetailError(result.error || 'No fue posible eliminar.')
      return
    }

    setDetail(null)
    onRefresh()
  }

  function topChrome(context: VistaCalendario, overlay = false) {
    const backYear = context !== 'anio'
    const ActiveIcon = VIEW_OPTIONS.find((option) => option.id === view)?.icon || CalendarDays

    return (
      <div className={styles.topChrome}>
        <div>
          {backYear && (
            <button className={styles.chromePill} onClick={overlay ? undefined : backToYear} tabIndex={overlay ? -1 : undefined}>
              <ChevronLeft size={19} /> {format(activeDate, 'yyyy')}
            </button>
          )}
        </div>
        <div className={styles.chromeGroup}>
          {context !== 'anio' && (
            <button className={styles.chromeIconButton} onClick={() => !overlay && setViewMenuOpen(true)} aria-label="Cambiar vista" tabIndex={overlay ? -1 : undefined}>
              <ActiveIcon size={21} />
            </button>
          )}
          <button className={styles.chromeIconButton} onClick={() => !overlay && setSearchOpen(true)} aria-label="Buscar eventos" tabIndex={overlay ? -1 : undefined}>
            <Search size={22} />
          </button>
          {puedeCrear && (
            <button className={styles.chromeIconButton} onClick={() => !overlay && setNewEventOpen(true)} aria-label="Crear evento o recordatorio" tabIndex={overlay ? -1 : undefined}>
              <Plus size={25} />
            </button>
          )}
        </div>
      </div>
    )
  }

  const listView = () => (
    <>
      {topChrome('lista')}
      <div className={styles.headerBlock}>
        <h1 className={styles.monthTitle}>{format(activeDate, 'MMMM yyyy', { locale: es })}</h1>
        <p className={styles.subTitle}>Eventos y recordatorios agrupados por día</p>
      </div>
      <div className={styles.eventList}>
        {monthListGroups.length > 0 ? monthListGroups.map((group) => (
          <section key={group.key}>
            <header className={styles.agendaHeader}>
              <h2 className={styles.agendaDate}>{format(group.day, "EEEE d 'de' MMMM", { locale: es })}</h2>
              <span className={styles.agendaCount}>W{getISOWeek(group.day)}</span>
            </header>
            {group.events.map((event) => (
              <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={openDetail} />
            ))}
          </section>
        )) : <div className={styles.emptyState}>No hay elementos visibles en este mes.</div>}
      </div>
    </>
  )

  const timelineView = (context: 'dia' | 'multiday') => {
    const count: TimelineDayCount = context === 'dia' ? 1 : timelineDays
    const end = addDays(selectedDay, count - 1)
    const title = count === 1
      ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
      : `${format(selectedDay, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })}`

    return (
      <>
        {topChrome(context)}
        <div className={styles.headerBlock}>
          <h1 className={styles.periodTitle}>{title}</h1>
          <p className={styles.subTitle}>{count === 7 ? 'Semana completa' : count === 1 ? 'Un solo día' : `${count} días visibles`}</p>
        </div>
        <CalendarioMultiDayView
          selectedDay={selectedDay}
          events={sortedEvents}
          daysVisible={count}
          onSelectDay={selectTimelineDay}
          onOpenEvent={openDetail}
        />
      </>
    )
  }

  const floatingBar = (
    <div className={styles.floatingBar}>
      <button className={styles.floatingPill} onClick={goToday}>Hoy</button>
      <div className={styles.floatingGroup}>
        <button className={styles.floatingIcon} onClick={onOpenCalendars} aria-label="Abrir calendarios"><CalendarDays size={22} /></button>
        <button className={styles.floatingIcon} onClick={() => setView('lista')} aria-label="Ver lista"><List size={22} /></button>
      </div>
    </div>
  )

  const canEditDetail = detail
    ? editableCalendars.some((calendar) => calendar.id === detail.calendar_id)
    : false

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
            <div className={native.timelineCountSelector} aria-label="Cantidad de días visibles">
              {DAY_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`${native.timelineCountButton} ${activeTimelineDays === count ? native.timelineCountButtonActive : ''}`}
                  onClick={() => changeTimelineDays(count)}
                  aria-pressed={activeTimelineDays === count}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body,
      )}

      {searchOpen && createPortal(
        <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Buscar eventos y recordatorios">
          <header className={styles.searchHeader}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className={styles.searchField} placeholder="Buscar" />
            <button className={styles.searchCancel} onClick={() => setSearchOpen(false)}>Cancelar</button>
          </header>
          <div className={styles.eventList}>
            {searchResults.length > 0
              ? searchResults.map((event) => <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={(item) => { setSearchOpen(false); openDetail(item) }} />)
              : <div className={styles.emptyState}>No se encontraron resultados.</div>}
          </div>
        </div>,
        document.body,
      )}

      {detail && createPortal(
        <div className={styles.detailOverlay} onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
          <section className={styles.detailCard} role="dialog" aria-modal="true" aria-labelledby="evento-detalle-titulo">
            <header className={styles.detailHeader}>
              <div>
                <h2 id="evento-detalle-titulo" className={styles.detailTitle}>{detail.titulo}</h2>
                <p className={styles.detailMinistry} style={{ color: eventColor(detail) }}>
                  {detail.calendars?.nombre || 'Vida Internacional'}
                </p>
              </div>
              <button className={styles.detailClose} onClick={() => setDetail(null)} aria-label="Cerrar"><X size={19} /></button>
            </header>
            <div className={styles.detailBody}>
              <div className={styles.detailLine}>
                {detail.kind === 'reminder' ? <BellRing size={21} color={eventColor(detail)} /> : <Clock3 size={21} color={eventColor(detail)} />}
                <div>
                  <strong>{format(new Date(detail.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}</strong>
                  <p className={styles.detailText}>
                    {detail.kind === 'reminder'
                      ? `Recordatorio · ${format(new Date(detail.fecha_inicio), 'h:mm a')}`
                      : detail.todo_el_dia
                        ? 'Todo el día'
                        : `${format(new Date(detail.fecha_inicio), 'h:mm a')}${detail.fecha_fin ? ` – ${format(new Date(detail.fecha_fin), 'h:mm a')}` : ''}`}
                  </p>
                </div>
              </div>
              {detail.tiempo_viaje_minutos ? (
                <p className={styles.detailText}>Tiempo de viaje: {detail.tiempo_viaje_minutos} minutos</p>
              ) : null}
              {detail.ubicacion && <div className={styles.detailLine}><MapPin size={21} color="#13a06f" /><span>{detail.ubicacion}</span></div>}
              {detail.descripcion && <p className={styles.detailText}>{detail.descripcion}</p>}
            </div>
            {detailError && <p className={native.detailError}>{detailError}</p>}
            <footer className={styles.detailFooter}>
              <div className={native.detailActionGroup}>
                {canEditDetail && (
                  <>
                    <button className={native.detailEditButton} onClick={() => setEditingItem(detail)}>
                      <Pencil size={16} /> Editar
                    </button>
                    <button className={native.detailDeleteButton} onClick={deleteFromDetail} disabled={deleting}>
                      <Trash2 size={16} /> {deleting ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </>
                )}
                {detail.kind === 'event' && detail.asignacion_id && (
                  <button className={styles.secondaryButton} onClick={() => {
                    setSwap({
                      isOpen: true,
                      asignacion_id: detail.asignacion_id || '',
                      titulo: detail.titulo,
                      ministerio_id: detail.ministerio_id || null,
                    })
                    setDetail(null)
                  }}>
                    <span className="inline-flex items-center gap-2"><ArrowLeftRight size={17} /> Intercambio</span>
                  </button>
                )}
              </div>
              <button className={styles.primaryButton} onClick={() => setDetail(null)}>Listo</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}

      {zoom && createPortal(
        <div
          className={`${styles.zoomLayer} ${styles.zoomEnter}`}
          style={{
            '--zoom-x': `${zoom.rect.left}px`,
            '--zoom-y': `${zoom.rect.top}px`,
            '--zoom-scale-x': String(Math.max(zoom.rect.width / Math.max(window.innerWidth, 1), 0.05)),
            '--zoom-scale-y': String(Math.max(zoom.rect.height / Math.max(window.innerHeight, 1), 0.05)),
          } as CSSProperties}
        >
          <CalendarioMonthView
            month={zoom.month}
            selectedDay={zoom.selectedDay}
            events={sortedEvents}
            topChrome={topChrome('mes', true)}
            isRefreshing={false}
            dayPanelOpen={false}
            overlay
            onSelectDay={() => {}}
            onOpenDay={() => {}}
            onOpenEvent={() => {}}
          />
        </div>,
        document.body,
      )}
    </>
  ) : null

  const transitionClass = screenTransition === 'month-out'
    ? motion.monthToYearOut
    : screenTransition === 'year-in'
      ? motion.yearReveal
      : ''

  return (
    <div className={`${styles.calendarScreen} ${transitionClass}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {view === 'anio' && (
        <CalendarioYearView
          fecha={activeDate}
          eventos={sortedEvents}
          isRefreshing={isRefreshing}
          topChrome={topChrome('anio')}
          onOpenMonth={openMonth}
          onChangeYear={changeYear}
        />
      )}
      {view === 'mes' && (
        <CalendarioMonthView
          month={activeDate}
          selectedDay={selectedDay}
          events={sortedEvents}
          topChrome={topChrome('mes')}
          isRefreshing={isRefreshing}
          dayPanelOpen={monthDayOpen}
          onSelectDay={openMonthDay}
          onOpenDay={openMonthDay}
          onOpenEvent={openDetail}
        />
      )}
      {view === 'dia' && timelineView('dia')}
      {view === 'multiday' && timelineView('multiday')}
      {view === 'lista' && listView()}
      {floatingBar}
      {portals}

      <NuevoEventoCalendarioModal
        isOpen={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        onCreated={onRefresh}
        editableCalendars={editableCalendars}
        userId={userId}
        fechaInicial={selectedDay}
      />

      <EditarElementoCalendarioModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSaved={() => {
          setEditingItem(null)
          setDetail(null)
          onRefresh()
        }}
      />

      <ProponerIntercambioModal
        asignacion_origen_id={swap.asignacion_id}
        evento_titulo={swap.titulo}
        ministerio_id={swap.ministerio_id}
        isOpen={swap.isOpen}
        onClose={() => setSwap({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null })}
      />
    </div>
  )
}
