'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  MapPin,
  Rows3,
  X,
} from 'lucide-react'

type Vista = 'agenda' | 'semana' | 'mes'

type Evento = {
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
}

const vistas: Array<{ id: Vista; label: string; icon: typeof List }> = [
  { id: 'agenda', label: 'Agenda', icon: List },
  { id: 'semana', label: 'Semana', icon: Rows3 },
  { id: 'mes', label: 'Mes', icon: CalendarDays },
]

export default function CalendarioPilotoViews({ asignaciones }: { asignaciones: any[] }) {
  const [vista, setVista] = useState<Vista>('mes')
  const [fechaActiva, setFechaActiva] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date())
  const [detalle, setDetalle] = useState<Evento | null>(null)

  const eventos = useMemo<Evento[]>(
    () =>
      asignaciones
        .map((asignacion) => ({
          ...asignacion.eventos,
          asignacion_id: asignacion.id,
          estadoAsignacion: asignacion.estado,
        }))
        .sort(
          (a, b) =>
            new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
        ),
    [asignaciones],
  )

  const mover = (direccion: -1 | 1) => {
    if (vista === 'semana') {
      setFechaActiva((actual) =>
        direccion > 0 ? addWeeks(actual, 1) : subWeeks(actual, 1),
      )
      return
    }

    setFechaActiva((actual) =>
      direccion > 0 ? addMonths(actual, 1) : subMonths(actual, 1),
    )
  }

  const irAHoy = () => {
    const hoy = new Date()
    setFechaActiva(hoy)
    setDiaSeleccionado(hoy)
  }

  const eventosDelDia = (dia: Date) =>
    eventos.filter((evento) => isSameDay(new Date(evento.fecha_inicio), dia))

  const tituloPeriodo =
    vista === 'semana'
      ? `${format(startOfWeek(fechaActiva, { weekStartsOn: 1 }), 'd MMM', { locale: es })} – ${format(endOfWeek(fechaActiva, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`
      : format(fechaActiva, 'MMMM yyyy', { locale: es })

  const renderEventoCompacto = (evento: Evento) => {
    const color = evento.ministerios?.color_primario || '#6366f1'
    const inicio = new Date(evento.fecha_inicio)
    const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : null

    return (
      <button
        key={`${evento.asignacion_id}-${evento.id}`}
        onClick={() => setDetalle(evento)}
        className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_6px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-200 active:scale-[0.99]"
      >
        <span
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="break-words text-[15px] font-bold leading-snug text-slate-900">
              {evento.titulo}
            </h3>
            <span className="shrink-0 text-xs font-semibold text-slate-500">
              {evento.todo_el_dia ? 'Todo el día' : format(inicio, 'h:mm a')}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{ color, backgroundColor: `${color}14` }}
            >
              {evento.ministerios?.nombre || 'General'}
            </span>
            {fin && !evento.todo_el_dia && (
              <span>{format(inicio, 'h:mm a')} – {format(fin, 'h:mm a')}</span>
            )}
          </div>
          {evento.ubicacion && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{evento.ubicacion}</span>
            </div>
          )}
        </div>
      </button>
    )
  }

  const renderMes = () => {
    const inicioMes = startOfMonth(fechaActiva)
    const inicioCuadricula = startOfWeek(inicioMes, { weekStartsOn: 1 })
    const finCuadricula = endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicioCuadricula, end: finCuadricula })
    const eventosSeleccionados = eventosDelDia(diaSeleccionado)

    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-7 border-b border-slate-100 px-2 py-3">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, indice) => (
              <div key={`${dia}-${indice}`} className="text-center text-[11px] font-bold text-slate-400">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-2 pb-3 pt-2">
            {dias.map((dia) => {
              const delDia = eventosDelDia(dia)
              const seleccionado = isSameDay(dia, diaSeleccionado)
              const hoy = isToday(dia)
              const perteneceAlMes = isSameMonth(dia, inicioMes)

              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`relative flex min-h-[70px] flex-col items-center rounded-2xl px-1 py-2 transition ${
                    seleccionado ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      hoy
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : perteneceAlMes
                          ? 'text-slate-900'
                          : 'text-slate-300'
                    }`}
                  >
                    {format(dia, 'd')}
                  </span>

                  <span className="mt-2 flex h-2 items-center justify-center gap-1">
                    {delDia.slice(0, 3).map((evento) => (
                      <span
                        key={`${evento.asignacion_id}-${evento.id}`}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            evento.ministerios?.color_primario || '#6366f1',
                        }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Día seleccionado
              </p>
              <h2 className="mt-1 text-xl font-bold capitalize text-slate-900">
                {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
              {eventosSeleccionados.length}
            </span>
          </div>

          {eventosSeleccionados.length > 0 ? (
            <div className="space-y-3">
              {eventosSeleccionados.map(renderEventoCompacto)}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                No tienes eventos asignados este día.
              </p>
            </div>
          )}
        </section>
      </div>
    )
  }

  const renderSemana = () => {
    const inicio = startOfWeek(fechaActiva, { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicio, end: endOfWeek(inicio, { weekStartsOn: 1 }) })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1">
          {dias.map((dia) => {
            const cantidad = eventosDelDia(dia).length
            const activo = isSameDay(dia, diaSeleccionado)
            return (
              <button
                key={dia.toISOString()}
                onClick={() => setDiaSeleccionado(dia)}
                className={`min-w-[58px] rounded-2xl border px-2 py-3 text-center transition ${
                  activo
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                  {format(dia, 'EEE', { locale: es })}
                </span>
                <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isToday(dia) ? 'bg-indigo-600 text-white' : 'text-slate-900'}`}>
                  {format(dia, 'd')}
                </span>
                <span className="mt-2 block text-[10px] font-semibold text-slate-400">
                  {cantidad || '—'}
                </span>
              </button>
            )
          })}
        </div>
        <div className="space-y-3">
          {eventosDelDia(diaSeleccionado).length > 0 ? (
            eventosDelDia(diaSeleccionado).map(renderEventoCompacto)
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500">
              Sin eventos asignados para este día.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAgenda = () => {
    const proximos = eventos.filter(
      (evento) => new Date(evento.fecha_inicio) >= new Date(new Date().setHours(0, 0, 0, 0)),
    )

    return proximos.length > 0 ? (
      <div className="space-y-3">{proximos.map(renderEventoCompacto)}</div>
    ) : (
      <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-500">No tienes eventos próximos.</p>
      </div>
    )
  }

  return (
    <div className="pb-5 pt-4">
      <section className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={irAHoy}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
          >
            Hoy
          </button>

          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button onClick={() => mover(-1)} className="rounded-full p-2 text-slate-500 hover:bg-slate-50" aria-label="Periodo anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => mover(1)} className="rounded-full p-2 text-slate-500 hover:bg-slate-50" aria-label="Periodo siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h2 className="mt-5 text-3xl font-bold capitalize tracking-tight text-slate-950">
          {tituloPeriodo}
        </h2>

        <div className="mt-4 grid grid-cols-3 rounded-[18px] border border-slate-100 bg-white p-1.5 shadow-[0_5px_20px_rgba(15,23,42,0.05)]">
          {vistas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setVista(id)}
              className={`flex items-center justify-center gap-2 rounded-[13px] px-2 py-2.5 text-xs font-bold transition ${
                vista === id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {vista === 'mes' && renderMes()}
      {vista === 'semana' && renderSemana()}
      {vista === 'agenda' && renderAgenda()}

      {detalle && (
        <>
          <button
            aria-label="Cerrar detalle"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setDetalle(null)}
          />
          <section className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[82vh] max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" />
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{detalle.titulo}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {detalle.ministerios?.nombre || 'Evento general'}
                </p>
              </div>
              <button onClick={() => setDetalle(null)} className="rounded-full bg-slate-100 p-2 text-slate-500" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Clock3 className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-bold capitalize text-slate-900">
                    {format(new Date(detalle.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {detalle.todo_el_dia
                      ? 'Todo el día'
                      : `${format(new Date(detalle.fecha_inicio), 'h:mm a')}${detalle.fecha_fin ? ` – ${format(new Date(detalle.fecha_fin), 'h:mm a')}` : ''}`}
                  </p>
                </div>
              </div>

              {detalle.ubicacion && (
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <p className="font-semibold text-slate-700">{detalle.ubicacion}</p>
                </div>
              )}

              {detalle.descripcion && (
                <div className="rounded-2xl border border-slate-100 p-4 text-sm leading-relaxed text-slate-600">
                  {detalle.descripcion}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
