'use client'

import { useState } from 'react'
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import ProponerIntercambioModal from './ProponerIntercambioModal'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, ArrowLeftRight, X, Users
} from 'lucide-react'

type ViewType = 'agenda' | 'semana' | 'mes'

interface EventoDetalle {
  id: string
  titulo: string
  descripcion?: string
  ubicacion?: string
  fecha_inicio: string
  fecha_fin?: string
  todo_el_dia?: boolean
  ministerios?: { nombre: string; color_primario?: string } | null
  asignacion_id: string
  estadoAsignacion: string
  ministerio_id?: string | null
}

export default function CalendarioViews({ asignaciones }: { asignaciones: any[] }) {
  const [view, setView] = useState<ViewType>('agenda')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal de detalle (solo lectura)
  const [detalleEvento, setDetalleEvento] = useState<EventoDetalle | null>(null)

  // Modal de intercambio (solo se abre desde el detalle)
  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean
    asignacion_id: string
    titulo: string
    ministerio_id: string | null
  }>({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null })

  // Flatten y ordenar
  const eventos: EventoDetalle[] = asignaciones
    .map(a => ({
      ...a.eventos,
      asignacion_id: a.id,
      estadoAsignacion: a.estado
    }))
    .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())

  const openDetalle = (evento: EventoDetalle) => setDetalleEvento(evento)
  const closeDetalle = () => setDetalleEvento(null)

  const next = () => {
    if (view === 'semana') setCurrentDate(addWeeks(currentDate, 1))
    if (view === 'mes') setCurrentDate(addMonths(currentDate, 1))
  }
  const prev = () => {
    if (view === 'semana') setCurrentDate(subWeeks(currentDate, 1))
    if (view === 'mes') setCurrentDate(subMonths(currentDate, 1))
  }

  // ─── AGENDA VIEW ──────────────────────────────────────────────────────────
  const renderAgenda = () => {
    const futureEvents = eventos.filter(
      e => new Date(e.fecha_inicio) >= new Date(new Date().setHours(0, 0, 0, 0))
    )
    const eventosPorDia = futureEvents.reduce((acc: any, evento) => {
      const dateStr = format(new Date(evento.fecha_inicio), 'yyyy-MM-dd')
      if (!acc[dateStr]) acc[dateStr] = []
      acc[dateStr].push(evento)
      return acc
    }, {})
    const dias = Object.keys(eventosPorDia).sort()

    if (dias.length === 0) {
      return (
        <div className="text-center py-16 px-4 border border-dashed border-slate-100 rounded-[18px] bg-white mt-4">
          <CalendarIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">No tienes eventos próximos programados.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6 mt-4">
        {dias.map(diaStr => {
          const date = parseISO(diaStr)
          return (
            <div key={diaStr} className="relative">
              <h2 className="sticky top-[152px] z-20 bg-[#f4f5f9]/95 backdrop-blur-sm py-2 text-xs font-bold text-gray-500 capitalize tracking-wider mb-2 -mx-4 px-4 border-b border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <div className="space-y-3 pt-2">
                {eventosPorDia[diaStr].map((evento: EventoDetalle) => renderEventCard(evento))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ─── SEMANA VIEW ──────────────────────────────────────────────────────────
  const renderSemana = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const now = new Date()
    const currentTimeMin = now.getHours() * 60 + now.getMinutes()
    const isThisWeek = days.some(d => isToday(d))

    return (
      <div className="bg-white rounded-[18px] border border-slate-100 overflow-hidden flex flex-col h-[600px] shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
        {/* Header de días */}
        <div className="grid grid-cols-8 border-b border-slate-100 shrink-0 bg-white z-10">
          <div className="py-2 border-r border-slate-100 bg-slate-50/60" />
          {days.map(day => {
            const todayDay = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`py-2 text-center border-r border-slate-100 last:border-0 transition-colors ${
                  todayDay ? 'bg-indigo-50/60' : ''
                }`}
              >
                <div className={`text-[10px] capitalize font-bold ${
                  todayDay ? 'text-indigo-500' : 'text-gray-500'
                }`}>
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                  todayDay
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-[#171923]'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grid scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 relative" style={{ height: '1440px' }}>

            {/* Columna de horas */}
            <div className="border-r border-slate-100 relative bg-white z-10">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2 text-[10px] font-medium text-gray-400"
                  style={{ top: `${hour * 60}px`, transform: 'translateY(-50%)' }}
                >
                  {hour === 0 ? '' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {days.map((day, colIdx) => {
              const dayEvents = eventos.filter(e => isSameDay(new Date(e.fecha_inicio), day))
              const todayDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-slate-100 last:border-0 relative ${
                    todayDay ? 'bg-indigo-50/30' : 'bg-white'
                  }`}
                >
                  {/* Grid lines por hora */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="absolute w-full border-b border-slate-100"
                      style={{ top: `${hour * 60}px` }}
                    />
                  ))}

                  {/* Línea roja de hora actual (solo en columna de hoy) */}
                  {todayDay && isThisWeek && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none"
                      style={{ top: `${currentTimeMin}px` }}
                    >
                      <div className="relative flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-200 -translate-x-1/2 shrink-0" />
                        <div className="flex-1 h-[2px] bg-red-500 opacity-80" />
                      </div>
                    </div>
                  )}

                  {/* Eventos */}
                  {dayEvents.map(evento => {
                    const color = evento.ministerios?.color_primario || '#6366f1'
                    const fechaInicio = new Date(evento.fecha_inicio)
                    const fechaFin = evento.fecha_fin
                      ? new Date(evento.fecha_fin)
                      : new Date(fechaInicio.getTime() + 60 * 60 * 1000)
                    const startMin = fechaInicio.getHours() * 60 + fechaInicio.getMinutes()
                    const durationMin = Math.max(
                      (fechaFin.getTime() - fechaInicio.getTime()) / 60000,
                      30
                    )

                    return (
                      <button
                        key={evento.id}
                        onClick={() => openDetalle(evento)}
                        className="absolute left-[2px] right-[2px] rounded-[8px] text-left shadow-sm transition-all hover:brightness-95 hover:shadow-md hover:z-20 overflow-hidden"
                        style={{
                          top: `${startMin}px`,
                          height: `${durationMin}px`,
                          backgroundColor: `${color}22`,
                          borderLeft: `3px solid ${color}`,
                          zIndex: 10,
                        }}
                        title={`${formato(fechaInicio)} ${evento.titulo}`}
                      >
                        {/* Contenido adaptado a altura disponible */}
                        <div className="p-1 h-full flex flex-col justify-start overflow-hidden">
                          <div
                            className="font-bold leading-tight truncate text-[10px]"
                            style={{ color }}
                          >
                            {evento.titulo}
                          </div>
                          {durationMin >= 40 && (
                            <div className="text-[9px] font-medium text-gray-500 mt-0.5 truncate">
                              {format(fechaInicio, 'HH:mm')}–{format(fechaFin, 'HH:mm')}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Helper para title tooltip
  const formato = (d: Date) => format(d, 'HH:mm')

  // ─── MES VIEW ─────────────────────────────────────────────────────────────
  const renderMes = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="bg-white rounded-[18px] border border-slate-100 overflow-hidden shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] text-gray-400 capitalize font-bold border-r border-slate-100 last:border-0">
              {d}
            </div>
          ))}
        </div>

        {/* Grid días */}
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {days.map(day => {
            const dayEvents = eventos.filter(e => isSameDay(new Date(e.fecha_inicio), day))
            const isCurrentMonth = isSameMonth(day, monthStart)
            const todayDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-1 border-b border-slate-100 flex flex-col ${
                  !isCurrentMonth ? 'bg-slate-50/70' : todayDay ? 'bg-indigo-50/30' : ''
                }`}
              >
                {/* Número del día */}
                <div className="flex justify-center mb-1">
                  <div className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                    todayDay
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : isCurrentMonth ? 'text-[#171923]' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Eventos */}
                <div className="flex flex-col gap-[3px] flex-1">
                  {dayEvents.slice(0, 3).map(evento => {
                    const color = evento.ministerios?.color_primario || '#6366f1'
                    return (
                      <button
                        key={evento.id}
                        onClick={() => openDetalle(evento)}
                        className="group text-left w-full rounded-[5px] overflow-hidden transition-all hover:brightness-95 active:scale-[0.97]"
                        style={{ backgroundColor: `${color}18`, borderLeft: `2.5px solid ${color}` }}
                        title={`${format(new Date(evento.fecha_inicio), 'HH:mm')} — ${evento.titulo}`}
                      >
                        <div className="px-1 py-[2px] flex items-center gap-1 min-w-0">
                          <span
                            className="text-[8px] font-bold shrink-0 leading-none"
                            style={{ color }}
                          >
                            {format(new Date(evento.fecha_inicio), 'HH:mm')}
                          </span>
                          <span className="text-[8px] font-semibold text-[#171923] truncate leading-none">
                            {evento.titulo}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                  {/* +N más — abre detalle del primer evento oculto */}
                  {dayEvents.length > 3 && (
                    <button
                      onClick={() => openDetalle(dayEvents[3])}
                      className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 px-1 py-[1px] hover:bg-indigo-50 rounded transition-colors mt-auto text-left"
                    >
                      +{dayEvents.length - 3} más
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── AGENDA EVENT CARD (solo lectura + botón de intercambio) ─────────────
  const renderEventCard = (evento: EventoDetalle) => {
    const color = evento.ministerios?.color_primario || '#6366f1'
    const isEventToday = isToday(new Date(evento.fecha_inicio))
    const now = new Date()
    const isEnCurso = new Date(evento.fecha_inicio) <= now && (!evento.fecha_fin || new Date(evento.fecha_fin) >= now) && isEventToday

    return (
      <div
        key={evento.id}
        className="group relative bg-white border border-slate-100 rounded-[20px] p-4 flex gap-3 cursor-pointer hover:shadow-[0_8px_30px_rgba(20,24,40,0.08)] hover:border-slate-200 transition-all active:scale-[0.98] overflow-hidden"
        onClick={() => openDetalle(evento)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && openDetalle(evento)}
      >
        {/* Barra lateral de color */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: color }} />

        {/* Bloque de hora */}
        <div className="flex flex-col items-end justify-start min-w-[56px] pl-1 pt-0.5">
          {evento.todo_el_dia ? (
            <span className="text-[14px] font-bold text-[#171923]">Día</span>
          ) : (
            <>
              <span className="text-[14px] font-bold text-[#171923] leading-none">
                {format(new Date(evento.fecha_inicio), 'HH:mm')}
              </span>
              {evento.fecha_fin && (
                <span className="text-[11px] font-medium text-gray-400 mt-1.5 leading-none">
                  {format(new Date(evento.fecha_fin), 'HH:mm')}
                </span>
              )}
            </>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-w-0 pl-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[16px] font-bold text-[#171923] leading-tight break-words pr-2">
              {evento.titulo}
            </h3>
            {(isEventToday || isEnCurso) && (
              <div className="shrink-0 flex items-center gap-1.5">
                {isEnCurso ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                ) : null}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isEnCurso ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {isEnCurso ? 'AHORA' : 'HOY'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] whitespace-nowrap"
              style={{ color, backgroundColor: `${color}15` }}
            >
              {evento.ministerios?.nombre || 'Global'}
            </span>
          </div>

          {evento.descripcion && (
            <p className="text-[13px] text-gray-500 leading-snug line-clamp-2 mb-2">
              {evento.descripcion}
            </p>
          )}

          {evento.ubicacion && (
            <div className="flex items-center gap-1.5 mt-auto pt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[12px] font-medium text-gray-500 truncate">{evento.ubicacion}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── MODAL DE DETALLE DE EVENTO ───────────────────────────────────────────
  const renderDetalleModal = () => {
    if (!detalleEvento) return null
    const ev = detalleEvento
    const color = ev.ministerios?.color_primario || '#6366f1'
    const fechaInicio = new Date(ev.fecha_inicio)
    const fechaFin = ev.fecha_fin ? new Date(ev.fecha_fin) : null

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDetalle}
          aria-hidden="true"
        />

        {/* Bottom sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detalle del evento"
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl max-w-lg mx-auto flex flex-col max-h-[85vh]"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header con color del ministerio */}
          <div
            className="shrink-0 px-6 pt-4 pb-5 border-b border-slate-100"
            style={{ borderTop: `4px solid ${color}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#171923] leading-snug">{ev.titulo}</h2>
                {ev.ministerios?.nombre && (
                  <span
                    className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ color, backgroundColor: `${color}15` }}
                  >
                    {ev.ministerios.nombre}
                  </span>
                )}
              </div>
              <button
                onClick={closeDetalle}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0 mt-0.5 bg-slate-50"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 pb-10">
            {/* Fecha y hora */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Fecha y hora</p>
                {ev.todo_el_dia ? (
                  <p className="text-base font-semibold text-[#171923]">
                    {format(fechaInicio, "EEEE, d 'de' MMMM yyyy", { locale: es })} — Todo el día
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#171923]">
                    <span className="capitalize">{format(fechaInicio, "EEEE", { locale: es })}</span>
                    {format(fechaInicio, ", d 'de' MMMM yyyy", { locale: es })}
                    <br />
                    <span className="text-indigo-600">
                      {format(fechaInicio, 'h:mm a')}
                      {fechaFin && ` — ${format(fechaFin, 'h:mm a')}`}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Ubicación */}
            {ev.ubicacion && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Ubicación</p>
                  <p className="text-base font-semibold text-[#171923]">{ev.ubicacion}</p>
                </div>
              </div>
            )}

            {/* Ministerio */}
            {ev.ministerios?.nombre && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                  <Users className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Ministerio</p>
                  <p className="text-base font-semibold text-[#171923]">{ev.ministerios.nombre}</p>
                </div>
              </div>
            )}

            {/* Descripción */}
            {ev.descripcion && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-2">Descripción</p>
                <p className="text-[15px] text-[#171923] whitespace-pre-line leading-relaxed">{ev.descripcion}</p>
              </div>
            )}

            {/* Botón proponer intercambio */}
            {ev.asignacion_id && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    closeDetalle()
                    setSwapModal({
                      isOpen: true,
                      asignacion_id: ev.asignacion_id,
                      titulo: ev.titulo,
                      ministerio_id: ev.ministerio_id || null,
                    })
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-colors active:scale-[0.98]"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Proponer intercambio de turno
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Tabs sticky */}
      <div className="sticky top-[76px] z-30 bg-[#f4f5f9]/95 backdrop-blur-sm pt-2 pb-2 -mx-4 px-4">
        <div className="bg-white p-1.5 rounded-[20px] border border-slate-100 flex shadow-[0_4px_18px_rgba(20,24,40,0.06)]">
          {(['agenda', 'semana', 'mes'] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-[14px] capitalize transition-all duration-200 ${
                view === v
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-500 hover:text-[#171923] hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación semana/mes */}
      {view !== 'agenda' && (
        <div className="flex items-center justify-between bg-white border border-slate-100 rounded-[20px] px-4 py-3 shadow-[0_4px_18px_rgba(20,24,40,0.06)] mt-2">
          <button onClick={prev} className="p-2 hover:bg-slate-50 rounded-xl text-gray-500 hover:text-[#171923] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[15px] font-bold text-[#171923] capitalize">
            {view === 'semana'
              ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`
              : format(currentDate, 'MMMM yyyy', { locale: es })
            }
          </h2>
          <button onClick={next} className="p-2 hover:bg-slate-50 rounded-xl text-gray-500 hover:text-[#171923] transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Contenido con transición suave */}
      <div className="pb-4">
        <div className={`transition-all duration-200 ease-in-out ${
          view === 'agenda' ? 'opacity-100 translate-y-0' : 'opacity-0 absolute pointer-events-none'
        }`}>
          {renderAgenda()}
        </div>
        <div className={`transition-all duration-200 ease-in-out ${
          view === 'semana' ? 'opacity-100 translate-y-0' : 'opacity-0 absolute pointer-events-none'
        }`}>
          {view === 'semana' && renderSemana()}
        </div>
        <div className={`transition-all duration-200 ease-in-out ${
          view === 'mes' ? 'opacity-100 translate-y-0' : 'opacity-0 absolute pointer-events-none'
        }`}>
          {view === 'mes' && renderMes()}
        </div>
      </div>

      {/* Modal detalle evento */}
      {renderDetalleModal()}

      {/* Modal intercambio */}
      <ProponerIntercambioModal
        isOpen={swapModal.isOpen}
        asignacion_origen_id={swapModal.asignacion_id}
        evento_titulo={swapModal.titulo}
        ministerio_id={swapModal.ministerio_id}
        onClose={() => setSwapModal({ ...swapModal, isOpen: false })}
      />
    </div>
  )
}
