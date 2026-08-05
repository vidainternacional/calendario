'use client'

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  getWeek,
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
import CalendarioMonthView, { type MonthPresentation } from './CalendarioMonthView'
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
import native from './CalendarioNativeUX.module.css'

type ZoomState = {
  month: Date
  selectedDay: Date
  rect: DOMRect
  direction: 'in' | 'out'
}

type MonthOption = {
  id: MonthPresentation | 'list'
  label: string
  icon: typeof CalendarDays
}

const MONTH_OPTIONS: MonthOption[] = [
  { id: 'compact', label: 'Compacta', icon: Grid3X3 },
  { id: 'stacked', label: 'Apilada', icon: Columns3 },
  { id: 'details', label: 'Detalles', icon: CalendarDays },
  { id: 'list', label: 'Lista', icon: List },
]

const TIMELINE_OPTIONS: Array<{ count: TimelineDayCount; label: string }> = [
  { count: 1, label: 'Día' },
  { count: 2, label: '2 días' },
  { count: 3, label: '3 días' },
  { count: 5, label: '5 días' },
  { count: 7, label: 'Semana' },
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

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
  const [monthPresentation, setMonthPresentation] = useState<MonthPresentation>('stacked')
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
  const [monthOrigin, setMonthOrigin] = useState<{ month: Date; rect: DOMRect } | null>(null)
  const [swap, setSwap] = useState({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null as string | null })
  const touchStartX = useRef<number | null>(null)
  const zoomTimer = useRef<number | null>(null)

  const puedeCrear = editableCalendars.length > 0
  const activeTimelineDays: TimelineDayCount = view === 'dia' ? 1 : timelineDays

  useEffect(() => {
    setMounted(true)
    return () => {
      if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
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
    const rect = element.getBoundingClientRect()
    setMonthOrigin({ month, rect })
    setZoom({ month, selectedDay: nextSelectedDay, rect, direction: 'in' })
    setActiveDate(nextSelectedDay)
    setSelectedDay(nextSelectedDay)
    setMonthPresentation('stacked')
    setMonthDayOpen(false)

    if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
    zoomTimer.current = window.setTimeout(() => {
      setView('mes')
      setZoom(null)
    }, 560)
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
    setViewMenuOpen(false)
    setMonthDayOpen(false)

    if (monthOrigin && isSameMonth(monthOrigin.month, activeDate)) {
      setView('anio')
      setZoom({
        month: new Date(activeDate.getFullYear(), activeDate.getMonth(), 1),
        selectedDay,
        rect: monthOrigin.rect,
        direction: 'out',
      })
      if (zoomTimer.current) window.clearTimeout(zoomTimer.current)
      zoomTimer.current = window.setTimeout(() => setZoom(null), 520)
      return
    }

    setView('anio')
  }

  const backToMonth = () => {
    setViewMenuOpen(false)
    setView('mes')
    setMonthPresentation('stacked')
    setMonthDayOpen(false)
  }

  const changeTimelineDays = (count: TimelineDayCount) => {
    setTimelineDays(count)
    setView(count === 1 ? 'dia' : 'multiday')
    setViewMenuOpen(false)
  }

  const changeMonthPresentation = (next: MonthPresentation | 'list') => {
    setViewMenuOpen(false)
    if (next === 'list') {
      setView('lista')
      return
    }

    setView('mes')
    setMonthPresentation(next)
    setMonthDayOpen(next === 'details')
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
    setMonthPresentation('stacked')
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
    setMonthPresentation('details')
    setMonthDayOpen(true)
  }

  const openTimelineDay = (day: Date) => {
    setSelectedDay(day)
    setActiveDate(day)
    setTimelineDays(1)
    setMonthDayOpen(false)
    setView('dia')
  }

  const onTouchStart = (event: TouchEvent) => {
    if (view === 'anio' || viewMenuOpen || detail) return
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (view === 'anio' || touchStartX.current === null || viewMenuOpen || detail) return
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
    const hasBack = context !== 'anio'
    const backLabel = context === 'mes'
      ? format(activeDate, 'yyyy')
      : capitalize(format(activeDate, 'MMMM', { locale: es }))
    const ActiveIcon = context === 'mes'
      ? MONTH_OPTIONS.find((option) => option.id === monthPresentation)?.icon || CalendarDays
      : context === 'lista'
        ? List
        : context === 'dia'
          ? Clock3
          : Columns3

    const handleBack = context === 'mes' ? backToYear : backToMonth

    return (
      <div className={styles.topChrome}>
        <div>
          {hasBack && (
            <button
              className={styles.chromePill}
              onClick={overlay ? undefined : handleBack}
              tabIndex={overlay ? -1 : undefined}
            >
              <ChevronLeft size={20} strokeWidth={2.25} />
              <span>{backLabel}</span>
            </button>
          )}
        </div>
        <div className={styles.chromeGroup}>
          {context !== 'anio' && (
            <button
              className={styles.chromeIconButton}
              onClick={() => !overlay && setViewMenuOpen(true)}
              aria-label="Cambiar vista"
              tabIndex={overlay ? -1 : undefined}
            >
              <ActiveIcon size={21} strokeWidth={2} />
            </button>
          )}
          <button
            className={styles.chromeIconButton}
            onClick={() => !overlay && setSearchOpen(true)}
            aria-label="Buscar eventos"
            tabIndex={overlay ? -1 : undefined}
          >
            <Search size={22} strokeWidth={2.1} />
          </button>
          {puedeCrear && (
            <button
              className={styles.chromeIconButton}
              onClick={() => !overlay && setNewEventOpen(true)}
              aria-label="Crear evento o recordatorio"
              tabIndex={overlay ? -1 : undefined}
            >
              <Plus size={26} strokeWidth={2} />
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
        <h1 className={styles.monthTitle}>{format(activeDate, 'MMMM', { locale: es })}</h1>
      </div>
      <div className={styles.eventList}>
        {monthListGroups.length > 0 ? monthListGroups.map((group) => (
          <section key={group.key}>
            <header className={styles.agendaHeader}>
              <h2 className={styles.agendaDate}>{format(group.day, "EEEE d 'de' MMMM", { locale: es })}</h2>
              <span className={styles.agendaCount}>S{getWeek(group.day, { weekStartsOn: 0, firstWeekContainsDate: 1 })}</span>
            </header>
            {group.events.map((event) => (
              <CalendarioEventRow key={eventKey(event)} evento={event} onOpen={openDetail} />
            ))}
          </section>
        )) : <div className={styles.emptyState}>No hay eventos ni recordatorios visibles en este mes.</div>}
      </div>
    </>
  )

  const timelineView = (context: 'dia' | 'multiday') => {
    const count: TimelineDayCount = context === 'dia' ? 1 : timelineDays
    return (
      <>
        {topChrome(context)}
        <CalendarioMultiDayView
          key={`${context}-${format(selectedDay, 'yyyy-MM-dd')}-${count}`}
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

  const monthMenuActive = view === 'lista' ? 'list' : monthPresentation

  const portals = mounted ? (
    <>
      {viewMenuOpen && createPortal(
        <>
          <button className={styles.popoverBackdrop} onClick={() => setViewMenuOpen(false)} aria-label="Cerrar menú" />
          <div className={styles.viewPopover} role="menu" aria-label="Vista del calendario">
            {(view === 'mes' || view === 'lista') ? (
              MONTH_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="menuitemradio"
                  aria-checked={monthMenuActive === id}
                  className={`${styles.viewOption} ${monthMenuActive === id ? styles.viewOptionActive : ''}`}
                  onClick={() => changeMonthPresentation(id)}
                >
                  <span className={styles.viewOptionCheck}>{monthMenuActive === id && <Check size={18} />}</span>
                  <Icon className={styles.viewOptionIcon} size={21} />
                  <span className={styles.viewOptionLabel}>{label}</span>
                </button>
              ))
            ) : (
              <>
                {TIMELINE_OPTIONS.map(({ count, label }) => (
                  <button
                    key={count}
                    role="menuitemradio"
                    aria-checked={activeTimelineDays === count}
                    className={`${styles.viewOption} ${activeTimelineDays === count ? styles.viewOptionActive : ''}`}
                    onClick={() => changeTimelineDays(count)}
                  >
                    <span className={styles.viewOptionCheck}>{activeTimelineDays === count && <Check size={18} />}</span>
                    {count === 1 ? <Clock3 className={styles.viewOptionIcon} size={21} /> : <Columns3 className={styles.viewOptionIcon} size={21} />}
                    <span className={styles.viewOptionLabel}>{label}</span>
                  </button>
                ))}
                <div className={styles.viewDivider} />
                <button className={styles.viewOption} onClick={() => { setView('lista'); setViewMenuOpen(false) }}>
                  <span className={styles.viewOptionCheck} />
                  <List className={styles.viewOptionIcon} size={21} />
                  <span className={styles.viewOptionLabel}>Lista</span>
                </button>
              </>
            )}
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
            <span className={styles.sheetGrabber} aria-hidden="true" />
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
          className={`${styles.zoomLayer} ${zoom.direction === 'in' ? styles.zoomEnter : styles.zoomExit}`}
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
            presentation="stacked"
            dayPanelOpen={false}
            overlay
            onSelectDay={() => {}}
            onOpenDay={() => {}}
            onOpenEvent={() => {}}
            onOpenTimelineDay={() => {}}
          />
        </div>,
        document.body,
      )}
    </>
  ) : null

  return (
    <div className={styles.calendarScreen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {view === 'anio' && (
        <div className={styles.viewStage}>
          <CalendarioYearView
            fecha={activeDate}
            eventos={sortedEvents}
            isRefreshing={isRefreshing}
            topChrome={topChrome('anio')}
            onOpenMonth={openMonth}
            onChangeYear={changeYear}
          />
        </div>
      )}
      {view === 'mes' && (
        <div className={styles.viewStage}>
          <CalendarioMonthView
            month={activeDate}
            selectedDay={selectedDay}
            events={sortedEvents}
            topChrome={topChrome('mes')}
            isRefreshing={isRefreshing}
            presentation={monthPresentation}
            dayPanelOpen={monthDayOpen}
            onSelectDay={openMonthDay}
            onOpenDay={openMonthDay}
            onOpenEvent={openDetail}
            onOpenTimelineDay={openTimelineDay}
          />
        </div>
      )}
      {view === 'dia' && <div className={styles.viewStage}>{timelineView('dia')}</div>}
      {view === 'multiday' && <div className={styles.viewStage}>{timelineView('multiday')}</div>}
      {view === 'lista' && <div className={styles.viewStage}>{listView()}</div>}
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
