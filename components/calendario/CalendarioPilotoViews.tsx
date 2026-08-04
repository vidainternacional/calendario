'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Columns3,
  Grid3X3,
  List,
  MapPin,
  Rows3,
  X,
} from 'lucide-react'
import ProponerIntercambioModal from './ProponerIntercambioModal'

type Vista = 'anio' | 'mes' | 'semana' | 'dia' | 'agenda'

type Evento = {
  id: string
  titulo: string
  descripcion?: string
  ubicacion?: string
  fecha_inicio: string
  fecha_fin?: string
  todo_el_dia?: boolean
  ministerio_id?: string | null
  ministerios?: { nombre: string; color_primario?: string } | null
  asignacion_id: string
  estadoAsignacion: string
}

const vistas: Array<{ id: Vista; label: string; icon: typeof List }> = [
  { id: 'anio', label: 'Año', icon: Grid3X3 },
  { id: 'mes', label: 'Mes', icon: CalendarDays },
  { id: 'semana', label: 'Semana', icon: Rows3 },
  { id: 'dia', label: 'Día', icon: Columns3 },
  { id: 'agenda', label: 'Agenda', icon: List },
]

function ejecutarTransicion(actualizar: () => void) {
  const documento = document as Document & {
    startViewTransition?: (callback: () => void) => void
  }

  if (documento.startViewTransition) {
    documento.startViewTransition(actualizar)
    return
  }

  actualizar()
}

export default function CalendarioPilotoViews({
  asignaciones,
  isRefreshing = false,
}: {
  asignaciones: any[]
  isRefreshing?: boolean
}) {
  const [vista, setVista] = useState<Vista>('mes')
  const [fechaActiva, setFechaActiva] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date())
  const [detalle, setDetalle] = useState<Evento | null>(null)
  const [menuVistasAbierto, setMenuVistasAbierto] = useState(false)
  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean
    asignacion_id: string
    titulo: string
    ministerio_id: string | null
  }>({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null })

  useEffect(() => {
    if (!detalle && !menuVistasAbierto) return

    const bodyOverflow = document.body.style.overflow
    if (detalle) document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetalle(null)
        setMenuVistasAbierto(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = bodyOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [detalle, menuVistasAbierto])

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

  const eventosDelDia = (dia: Date) =>
    eventos.filter((evento) => isSameDay(new Date(evento.fecha_inicio), dia))

  const cambiarVista = (nuevaVista: Vista) => {
    ejecutarTransicion(() => {
      setVista(nuevaVista)
      setMenuVistasAbierto(false)
    })
  }

  const abrirMes = (mes: Date) => {
    ejecutarTransicion(() => {
      setFechaActiva(mes)
      setDiaSeleccionado(mes)
      setVista('mes')
    })
  }

  const mover = (direccion: -1 | 1) => {
    ejecutarTransicion(() => {
      if (vista === 'anio') {
        setFechaActiva((actual) =>
          direccion > 0 ? addYears(actual, 1) : subYears(actual, 1),
        )
        return
      }
      if (vista === 'semana') {
        setFechaActiva((actual) =>
          direccion > 0 ? addWeeks(actual, 1) : subWeeks(actual, 1),
        )
        setDiaSeleccionado((actual) =>
          direccion > 0 ? addWeeks(actual, 1) : subWeeks(actual, 1),
        )
        return
      }
      if (vista === 'dia') {
        setFechaActiva((actual) => addDays(actual, direccion))
        setDiaSeleccionado((actual) => addDays(actual, direccion))
        return
      }
      setFechaActiva((actual) =>
        direccion > 0 ? addMonths(actual, 1) : subMonths(actual, 1),
      )
    })
  }

  const irAHoy = () => {
    const hoy = new Date()
    ejecutarTransicion(() => {
      setFechaActiva(hoy)
      setDiaSeleccionado(hoy)
      if (vista === 'anio') setVista('mes')
    })
  }

  const tituloPeriodo = (() => {
    if (vista === 'anio') return format(fechaActiva, 'yyyy')
    if (vista === 'semana') {
      return `${format(startOfWeek(fechaActiva, { weekStartsOn: 1 }), 'd MMM', { locale: es })} – ${format(endOfWeek(fechaActiva, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`
    }
    if (vista === 'dia') {
      return format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })
    }
    return format(fechaActiva, 'MMMM yyyy', { locale: es })
  })()

  const renderEventoFila = (evento: Evento) => {
    const color = evento.ministerios?.color_primario || '#6366f1'
    const inicio = new Date(evento.fecha_inicio)
    const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : null

    return (
      <button
        key={`${evento.asignacion_id}-${evento.id}`}
        onClick={() => setDetalle(evento)}
        className="flex w-full items-start gap-3 border-b border-slate-200/70 bg-white px-4 py-4 text-left transition active:bg-slate-50"
      >
        <span className="mt-1 h-11 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-bold leading-snug text-slate-950">{evento.titulo}</h3>
            <span className="shrink-0 text-xs font-semibold text-slate-500">
              {evento.todo_el_dia ? 'Todo el día' : format(inicio, 'h:mm a')}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold" style={{ color }}>
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

  const renderMiniMes = (mes: Date) => {
    const inicioMes = startOfMonth(mes)
    const inicioCuadricula = startOfWeek(inicioMes, { weekStartsOn: 1 })
    const finCuadricula = endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicioCuadricula, end: finCuadricula })

    return (
      <button
        key={mes.toISOString()}
        onClick={() => abrirMes(mes)}
        className="min-w-0 px-2 py-3 text-left transition active:scale-[0.97] motion-reduce:transition-none"
        style={{ viewTransitionName: `mes-${format(mes, 'yyyy-MM')}` }}
      >
        <h2 className={`mb-2 text-[17px] font-bold capitalize ${isSameMonth(mes, new Date()) ? 'text-indigo-600' : 'text-slate-950'}`}>
          {format(mes, 'MMM', { locale: es })}
        </h2>
        <div className="grid grid-cols-7 gap-y-1">
          {dias.map((dia) => {
            const pertenece = isSameMonth(dia, mes)
            const tieneEventos = eventosDelDia(dia).length > 0
            return (
              <span
                key={dia.toISOString()}
                className={`relative flex h-5 items-center justify-center text-[9px] font-semibold ${
                  pertenece ? 'text-slate-700' : 'text-transparent'
                }`}
              >
                {format(dia, 'd')}
                {pertenece && tieneEventos && (
                  <span className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-500" />
                )}
              </span>
            )
          })}
        </div>
      </button>
    )
  }

  const renderAnio = () => {
    const meses = eachMonthOfInterval({
      start: startOfYear(fechaActiva),
      end: endOfYear(fechaActiva),
    })

    return (
      <section className="bg-white px-2 pb-6 pt-1">
        <div className="grid grid-cols-3 gap-y-3">
          {meses.map(renderMiniMes)}
        </div>
      </section>
    )
  }

  const renderMes = () => {
    const inicioMes = startOfMonth(fechaActiva)
    const inicioCuadricula = startOfWeek(inicioMes, { weekStartsOn: 1 })
    const finCuadricula = endOfWeek(endOfMonth(inicioMes), { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicioCuadricula, end: finCuadricula })
    const eventosSeleccionados = eventosDelDia(diaSeleccionado)

    return (
      <div style={{ viewTransitionName: `mes-${format(fechaActiva, 'yyyy-MM')}` }}>
        <section className="border-y border-slate-200/80 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200/80 px-2 py-2.5">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, indice) => (
              <div key={`${dia}-${indice}`} className="text-center text-[11px] font-bold text-slate-400">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const delDia = eventosDelDia(dia)
              const seleccionado = isSameDay(dia, diaSeleccionado)
              const hoy = isToday(dia)
              const perteneceAlMes = isSameMonth(dia, inicioMes)

              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setDiaSeleccionado(dia)}
                  onDoubleClick={() => {
                    setFechaActiva(dia)
                    setDiaSeleccionado(dia)
                    cambiarVista('dia')
                  }}
                  className={`relative flex min-h-[72px] flex-col items-center justify-start border-b border-slate-100 px-1 py-2 transition ${
                    seleccionado ? 'bg-indigo-50/80' : 'bg-white active:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      hoy
                        ? 'bg-indigo-600 text-white'
                        : perteneceAlMes
                          ? 'text-slate-950'
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
                        style={{ backgroundColor: evento.ministerios?.color_primario || '#6366f1' }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white pt-4">
          <button
            onClick={() => cambiarVista('dia')}
            className="flex w-full items-end justify-between gap-4 px-4 pb-3 text-left active:bg-slate-50"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Día seleccionado</p>
              <h2 className="mt-1 text-xl font-bold capitalize text-slate-950">
                {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{eventosSeleccionados.length}</span>
          </button>

          {eventosSeleccionados.length > 0 ? (
            eventosSeleccionados.map(renderEventoFila)
          ) : (
            <div className="border-y border-slate-200/70 px-5 py-10 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No tienes eventos asignados este día.</p>
            </div>
          )}
        </section>
      </div>
    )
  }

  const renderLineaDeTiempo = (dia: Date) => {
    const delDia = eventosDelDia(dia)
    const horas = Array.from({ length: 24 }, (_, indice) => indice)
    const eventosTodoElDia = delDia.filter((evento) => evento.todo_el_dia)
    const eventosConHora = delDia.filter((evento) => !evento.todo_el_dia)
    const altoHora = 72

    return (
      <div className="bg-white">
        {eventosTodoElDia.length > 0 && (
          <div className="border-b border-slate-200/80 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Todo el día</p>
            <div className="space-y-2">
              {eventosTodoElDia.map(renderEventoFila)}
            </div>
          </div>
        )}

        <div className="max-h-[68dvh] overflow-y-auto overscroll-contain">
          <div className="relative" style={{ height: `${24 * altoHora}px` }}>
            {horas.map((hora) => (
              <div
                key={hora}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: `${hora * altoHora}px` }}
              >
                <span className="absolute left-3 -translate-y-1/2 bg-white pr-2 text-[10px] font-medium text-slate-400">
                  {hora === 0 ? '12 AM' : hora < 12 ? `${hora} AM` : hora === 12 ? '12 PM' : `${hora - 12} PM`}
                </span>
              </div>
            ))}

            {eventosConHora.map((evento) => {
              const inicio = new Date(evento.fecha_inicio)
              const fin = evento.fecha_fin
                ? new Date(evento.fecha_fin)
                : new Date(inicio.getTime() + 60 * 60 * 1000)
              const minutoInicio = inicio.getHours() * 60 + inicio.getMinutes()
              const duracion = Math.max((fin.getTime() - inicio.getTime()) / 60000, 30)
              const color = evento.ministerios?.color_primario || '#6366f1'

              return (
                <button
                  key={`${evento.asignacion_id}-${evento.id}`}
                  onClick={() => setDetalle(evento)}
                  className="absolute left-[74px] right-3 overflow-hidden rounded-xl px-3 py-2 text-left shadow-sm active:scale-[0.99]"
                  style={{
                    top: `${(minutoInicio / 60) * altoHora + 3}px`,
                    height: `${Math.max((duracion / 60) * altoHora - 6, 38)}px`,
                    backgroundColor: `${color}18`,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <p className="truncate text-xs font-bold" style={{ color }}>{evento.titulo}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {format(inicio, 'h:mm a')} – {format(fin, 'h:mm a')}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderSemana = () => {
    const inicio = startOfWeek(fechaActiva, { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: inicio, end: endOfWeek(inicio, { weekStartsOn: 1 }) })

    return (
      <div className="bg-white">
        <div className="grid grid-cols-7 border-y border-slate-200/80">
          {dias.map((dia) => {
            const cantidad = eventosDelDia(dia).length
            const activo = isSameDay(dia, diaSeleccionado)
            return (
              <button
                key={dia.toISOString()}
                onClick={() => setDiaSeleccionado(dia)}
                className={`min-w-0 px-1 py-3 text-center transition ${activo ? 'bg-indigo-50' : 'bg-white'}`}
              >
                <span className="block text-[9px] font-bold uppercase text-slate-400">
                  {format(dia, 'EEE', { locale: es }).slice(0, 3)}
                </span>
                <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isToday(dia) ? 'bg-indigo-600 text-white' : 'text-slate-950'}`}>
                  {format(dia, 'd')}
                </span>
                <span className="mt-1 block text-[10px] font-semibold text-slate-400">{cantidad || '•'}</span>
              </button>
            )
          })}
        </div>
        {renderLineaDeTiempo(diaSeleccionado)}
      </div>
    )
  }

  const renderDia = () => (
    <div className="bg-white">
      <div className="grid grid-cols-7 border-y border-slate-200/80">
        {eachDayOfInterval({
          start: startOfWeek(diaSeleccionado, { weekStartsOn: 1 }),
          end: endOfWeek(diaSeleccionado, { weekStartsOn: 1 }),
        }).map((dia) => (
          <button
            key={dia.toISOString()}
            onClick={() => {
              setDiaSeleccionado(dia)
              setFechaActiva(dia)
            }}
            className={`px-1 py-2.5 text-center ${isSameDay(dia, diaSeleccionado) ? 'bg-indigo-50' : 'bg-white'}`}
          >
            <span className="block text-[9px] font-bold uppercase text-slate-400">{format(dia, 'EEEEE', { locale: es })}</span>
            <span className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isToday(dia) ? 'bg-indigo-600 text-white' : 'text-slate-950'}`}>
              {format(dia, 'd')}
            </span>
          </button>
        ))}
      </div>
      {renderLineaDeTiempo(diaSeleccionado)}
    </div>
  )

  const renderAgenda = () => {
    const proximos = eventos.filter(
      (evento) => new Date(evento.fecha_inicio) >= new Date(new Date().setHours(0, 0, 0, 0)),
    )

    const porDia = proximos.reduce<Record<string, Evento[]>>((acumulado, evento) => {
      const clave = format(new Date(evento.fecha_inicio), 'yyyy-MM-dd')
      acumulado[clave] = [...(acumulado[clave] || []), evento]
      return acumulado
    }, {})

    if (proximos.length === 0) {
      return (
        <div className="border-y border-slate-200/70 bg-white px-5 py-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">No tienes eventos próximos.</p>
        </div>
      )
    }

    return (
      <section className="bg-white">
        {Object.entries(porDia).map(([fecha, items]) => (
          <div key={fecha}>
            <h2 className="sticky top-0 z-20 border-y border-slate-200/70 bg-[#f4f5f9]/95 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-md">
              {format(new Date(`${fecha}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            {items.map(renderEventoFila)}
          </div>
        ))}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header
        className="relative bg-[#f4f5f9] px-4 pb-4"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {vista === 'mes' ? (
            <button
              onClick={() => cambiarVista('anio')}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              <ChevronLeft className="h-4 w-4" /> {format(fechaActiva, 'yyyy')}
            </button>
          ) : (
            <button onClick={irAHoy} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
              Hoy
            </button>
          )}

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setMenuVistasAbierto((abierto) => !abierto)}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-slate-600 shadow-sm ring-1 ring-slate-200 active:bg-slate-100"
              aria-expanded={menuVistasAbierto}
              aria-haspopup="menu"
              aria-label="Cambiar vista del calendario"
            >
              {(() => {
                const Icono = vistas.find((item) => item.id === vista)?.icon || CalendarDays
                return <Icono className="h-4 w-4" />
              })()}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
              <button onClick={() => mover(-1)} className="rounded-full p-2 text-slate-500 active:bg-slate-100" aria-label="Periodo anterior">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => mover(1)} className="rounded-full p-2 text-slate-500 active:bg-slate-100" aria-label="Periodo siguiente">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {menuVistasAbierto && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.2)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
              >
                {vistas.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="menuitem"
                    onClick={() => cambiarVista(id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                      vista === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 active:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => vista === 'mes' && cambiarVista('anio')}
          className={`mt-5 block text-left ${vista === 'mes' ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <h1 className="text-4xl font-bold capitalize tracking-tight text-slate-950">{tituloPeriodo}</h1>
        </button>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Tus eventos y turnos asignados{isRefreshing ? ' · Actualizando…' : ''}
        </p>
      </header>

      <main key={`${vista}-${format(fechaActiva, 'yyyy-MM-dd')}`} className="animate-in fade-in zoom-in-[0.985] duration-200 motion-reduce:animate-none">
        {vista === 'anio' && renderAnio()}
        {vista === 'mes' && renderMes()}
        {vista === 'semana' && renderSemana()}
        {vista === 'dia' && renderDia()}
        {vista === 'agenda' && renderAgenda()}
      </main>

      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetalle(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-evento-titulo"
            className="flex max-h-[min(78dvh,680px)] w-full max-w-md flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="detalle-evento-titulo" className="break-words text-xl font-bold leading-snug text-slate-950">
                  {detalle.titulo}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {detalle.ministerios?.nombre || 'Evento general'}
                </p>
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="shrink-0 rounded-full bg-slate-100 p-2.5 text-slate-600 active:bg-slate-200"
                aria-label="Cerrar detalle del evento"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
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
                  <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="break-words font-semibold text-slate-700">{detalle.ubicacion}</p>
                  </div>
                )}
                {detalle.descripcion && (
                  <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {detalle.descripcion}
                  </div>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSwapModal({
                      isOpen: true,
                      asignacion_id: detalle.asignacion_id,
                      titulo: detalle.titulo,
                      ministerio_id: detalle.ministerio_id || null,
                    })
                    setDetalle(null)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3.5 text-sm font-bold text-indigo-700 active:bg-indigo-100"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Intercambio
                </button>
                <button
                  onClick={() => setDetalle(null)}
                  className="rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white active:bg-slate-800"
                >
                  Listo
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      <ProponerIntercambioModal
        asignacion_origen_id={swapModal.asignacion_id}
        evento_titulo={swapModal.titulo}
        ministerio_id={swapModal.ministerio_id}
        isOpen={swapModal.isOpen}
        onClose={() => setSwapModal({ isOpen: false, asignacion_id: '', titulo: '', ministerio_id: null })}
      />
    </div>
  )
}
