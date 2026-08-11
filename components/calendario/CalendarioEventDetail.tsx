'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Music2,
  Palette,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  obtenerEquipoVisibleEvento,
  type EquipoEventoVisible,
  type EstadoEquipoEvento,
} from '@/app/actions/equipo-evento-visible'
import EstadoAsignacionMusico from '@/components/ministerios/EstadoAsignacionMusico'
import UserAvatar from '@/components/comunidad/UserAvatar'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioEventDetail.module.css'

const EXIT_MS = 190

type PanelServicio = 'respuesta' | 'equipo' | 'repertorio' | 'paleta'

type PanelButtonProps = {
  icon: LucideIcon
  label: string
  active: boolean
  tone: 'teal' | 'indigo' | 'rose' | 'amber'
  badge?: number | string
  onClick: () => void
}

const toneClasses = {
  teal: {
    idle: 'bg-teal-50 text-teal-700 ring-teal-100',
    active: 'bg-teal-600 text-white ring-teal-600 shadow-[0_7px_18px_rgba(13,148,136,0.22)]',
  },
  indigo: {
    idle: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    active: 'bg-indigo-600 text-white ring-indigo-600 shadow-[0_7px_18px_rgba(79,70,229,0.22)]',
  },
  rose: {
    idle: 'bg-rose-50 text-rose-600 ring-rose-100',
    active: 'bg-rose-600 text-white ring-rose-600 shadow-[0_7px_18px_rgba(225,29,72,0.2)]',
  },
  amber: {
    idle: 'bg-amber-50 text-amber-700 ring-amber-100',
    active: 'bg-amber-500 text-white ring-amber-500 shadow-[0_7px_18px_rgba(245,158,11,0.2)]',
  },
} as const

function estadoLabel(estado: EstadoEquipoEvento) {
  if (estado === 'confirmado') return 'Confirmado'
  if (estado === 'no_disponible') return 'No disponible'
  return 'Por confirmar'
}

function estadoClasses(estado: EstadoEquipoEvento) {
  if (estado === 'confirmado') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (estado === 'no_disponible') return 'bg-rose-50 text-rose-700 ring-rose-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
}

function PanelButton({ icon: Icon, label, active, tone, badge, onClick }: PanelButtonProps) {
  const palette = toneClasses[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition active:scale-[0.97]"
      aria-expanded={active}
    >
      <span className={`relative grid h-12 w-12 place-items-center rounded-full ring-1 transition ${active ? palette.active : palette.idle}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
        {badge !== undefined && badge !== null && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-slate-900 px-1 text-[8px] font-black leading-none text-white">
            {badge}
          </span>
        )}
      </span>
      <span className={`max-w-full truncate text-[10px] font-extrabold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
      <ChevronDown className={`h-3 w-3 text-slate-300 transition-transform ${active ? 'rotate-180 text-slate-500' : ''}`} aria-hidden="true" />
    </button>
  )
}

export default function CalendarioEventDetail({
  event,
  onClose,
  backLabel,
  backAriaLabel,
}: {
  event: EventoCalendario | null
  onClose: () => void
  backLabel?: string
  backAriaLabel?: string
}) {
  const [closing, setClosing] = useState(false)
  const [equipoVisible, setEquipoVisible] = useState<EquipoEventoVisible | null>(null)
  const [equipoLoading, setEquipoLoading] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState<PanelServicio | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const closingRef = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      onCloseRef.current()
    }, EXIT_MS)
  }, [])

  useEffect(() => {
    if (!event) return
    closingRef.current = false
    setClosing(false)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') requestClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      closingRef.current = false
    }
  }, [event, requestClose])

  useEffect(() => {
    let cancelled = false
    setEquipoVisible(null)
    setEquipoLoading(false)
    setPanelAbierto(null)

    if (!event || event.kind !== 'event') return

    setEquipoLoading(true)
    void obtenerEquipoVisibleEvento(event.id)
      .then((result) => {
        if (cancelled) return
        setEquipoVisible(result)
        if (result) {
          setPanelAbierto(result.miEstado ? 'respuesta' : 'equipo')
        }
      })
      .catch((error) => {
        console.error('[CalendarioEventDetail] No se pudo cargar la preparación del servicio', error)
      })
      .finally(() => {
        if (!cancelled) setEquipoLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [event?.id, event?.kind])

  if (!event) return null

  const start = new Date(event.fecha_inicio)
  const end = event.fecha_fin ? new Date(event.fecha_fin) : null
  const color = eventColor(event)
  const calendarName = event.calendars?.nombre || 'Vida Internacional'
  const dateText = format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  const timeText = event.todo_el_dia
    ? 'Todo el día'
    : end
      ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
      : format(start, 'h:mm a')
  const dayLabel = format(start, 'd MMM', { locale: es })
  const dayAriaLabel = format(start, "EEEE d 'de' MMMM", { locale: es })
  const resolvedBackLabel = backLabel || dayLabel
  const resolvedBackAriaLabel = backAriaLabel || `Volver al día ${dayAriaLabel}`

  const togglePanel = (panel: PanelServicio) => {
    setPanelAbierto((actual) => actual === panel ? null : panel)
  }

  const actualizarMiEstado = (nuevo: EstadoEquipoEvento) => {
    setEquipoVisible((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        miEstado: nuevo,
        equipo: actual.equipo.map((miembro) => miembro.esYo ? { ...miembro, estado: nuevo } : miembro),
      }
    })
  }

  return (
    <div className={`${styles.backdrop} ${closing ? styles.closing : ''}`} role="presentation">
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-detail-title"
      >
        <header className={styles.topbar}>
          <button type="button" className={styles.backButton} onClick={requestClose} aria-label={resolvedBackAriaLabel}>
            <ChevronLeft size={25} strokeWidth={2.25} aria-hidden="true" />
            <span>{resolvedBackLabel}</span>
          </button>
          <p className={styles.topbarTitle}>{event.kind === 'reminder' ? 'Recordatorio' : 'Evento'}</p>
          <span className={styles.topbarSpacer} aria-hidden="true" />
        </header>

        <div className={styles.body}>
          <div className={styles.summary}>
            <div className={styles.titleLine}>
              <span className={styles.calendarDot} style={{ backgroundColor: color }} aria-hidden="true" />
              <h2 id="calendar-event-detail-title" className={styles.title}>{event.titulo}</h2>
            </div>
            <p className={styles.calendarName}>{calendarName}</p>
          </div>

          <section className={styles.group} aria-label="Fecha y hora">
            <DetailRow label="Fecha" value={dateText} />
            <DetailRow label="Hora" value={timeText} />
            {Boolean(event.tiempo_viaje_minutos) && (
              <DetailRow label="Tiempo de viaje" value={`${event.tiempo_viaje_minutos} minutos`} />
            )}
          </section>

          {(event.ministerios?.nombre || event.ubicacion) && (
            <section className={styles.group} aria-label="Información adicional">
              {event.ubicacion && <DetailRow label="Ubicación" value={event.ubicacion} />}
              {event.ministerios?.nombre && <DetailRow label="Ministerio" value={event.ministerios.nombre} />}
            </section>
          )}

          {event.descripcion && (
            <section className={`${styles.group} ${styles.descriptionGroup}`} aria-label="Notas">
              <DetailRow label="Notas" value={event.descripcion} />
            </section>
          )}

          {event.kind === 'event' && equipoLoading && (
            <section className="rounded-[20px] bg-white px-4 py-5 ring-1 ring-black/[0.05]" aria-label="Cargando preparación">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                <span className="min-w-0 flex-1">
                  <span className="block h-3 w-32 animate-pulse rounded-full bg-slate-100" />
                  <span className="mt-2 block h-2.5 w-52 max-w-full animate-pulse rounded-full bg-slate-100" />
                </span>
              </div>
            </section>
          )}

          {event.kind === 'event' && equipoVisible && (
            <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.055)] ring-1 ring-black/[0.045]" aria-label="Preparación del servicio">
              <div className="border-b border-slate-100 px-4 pb-3 pt-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-600">Servicio ministerial</p>
                    <h3 className="mt-1 text-[15px] font-extrabold tracking-[-0.02em] text-slate-900">Todo lo que necesitas está aquí</h3>
                    <p className="mt-1 text-[10px] leading-4 text-slate-400">Toca un círculo para desplegar cada parte sin salir del evento.</p>
                  </div>
                  {equipoVisible.miEstado && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 ${estadoClasses(equipoVisible.miEstado)}`}>
                      {estadoLabel(equipoVisible.miEstado)}
                    </span>
                  )}
                </div>

                <div className={`mt-3 grid gap-1 ${equipoVisible.miEstado ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {equipoVisible.miEstado && equipoVisible.ministerioIdRespuesta && (
                    <PanelButton
                      icon={BadgeCheck}
                      label="Mi servicio"
                      active={panelAbierto === 'respuesta'}
                      tone="teal"
                      onClick={() => togglePanel('respuesta')}
                    />
                  )}
                  <PanelButton
                    icon={UsersRound}
                    label="Equipo"
                    badge={equipoVisible.equipo.length}
                    active={panelAbierto === 'equipo'}
                    tone="indigo"
                    onClick={() => togglePanel('equipo')}
                  />
                  <PanelButton
                    icon={Music2}
                    label="Repertorio"
                    badge={equipoVisible.repertorio.length || undefined}
                    active={panelAbierto === 'repertorio'}
                    tone="rose"
                    onClick={() => togglePanel('repertorio')}
                  />
                  <PanelButton
                    icon={Palette}
                    label="Paleta"
                    badge={equipoVisible.paletas.length || undefined}
                    active={panelAbierto === 'paleta'}
                    tone="amber"
                    onClick={() => togglePanel('paleta')}
                  />
                </div>
              </div>

              {panelAbierto && (
                <div className="bg-slate-50/55 p-3 sm:p-4">
                  {panelAbierto === 'respuesta' && equipoVisible.miEstado && equipoVisible.ministerioIdRespuesta && (
                    <div className="rounded-[20px] bg-gradient-to-br from-teal-50 via-white to-emerald-50/60 p-4 ring-1 ring-teal-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-teal-700">Tu asignación</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(equipoVisible.misFunciones.length ? equipoVisible.misFunciones : ['Asignado']).map((funcion) => (
                              <span key={funcion} className="rounded-full bg-teal-700 px-2.5 py-1 text-[9px] font-extrabold text-white">{funcion}</span>
                            ))}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 ${estadoClasses(equipoVisible.miEstado)}`}>
                          {estadoLabel(equipoVisible.miEstado)}
                        </span>
                      </div>
                      <div className="mt-4 border-t border-teal-100 pt-4">
                        <EstadoAsignacionMusico
                          ministerioId={equipoVisible.ministerioIdRespuesta}
                          eventoId={event.id}
                          initialEstado={equipoVisible.miEstado}
                          onEstadoChange={actualizarMiEstado}
                        />
                      </div>
                    </div>
                  )}

                  {panelAbierto === 'equipo' && (
                    <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                        <span>
                          <span className="block text-[12px] font-extrabold text-slate-800">Equipo de este servicio</span>
                          <span className="mt-0.5 block text-[9px] text-slate-400">Con quién te tocará servir y en qué función.</span>
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-extrabold text-indigo-600">{equipoVisible.equipo.length}</span>
                      </div>
                      {equipoVisible.equipo.map((miembro, index) => (
                        <div
                          key={miembro.profileId}
                          className={`flex items-center gap-3 px-3.5 py-3 ${index < equipoVisible.equipo.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                          <UserAvatar nombre={miembro.nombre} avatarUrl={miembro.avatarUrl} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-xs font-extrabold text-slate-800">{miembro.esYo ? `${miembro.nombre} · Tú` : miembro.nombre}</p>
                              {miembro.estado === 'no_disponible' && (
                                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[8px] font-extrabold text-rose-600">No disponible</span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              {miembro.funciones.length ? miembro.funciones.join(' · ') : 'Servidor'}
                            </p>
                          </div>
                          {miembro.estado !== 'no_disponible' && (
                            <span className={`h-2 w-2 shrink-0 rounded-full ${miembro.estado === 'confirmado' ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-label={estadoLabel(miembro.estado)} />
                          )}
                        </div>
                      ))}
                      <p className="border-t border-slate-100 px-4 py-2.5 text-[9px] leading-4 text-slate-400">Verde: confirmado · amarillo: pendiente de respuesta.</p>
                    </div>
                  )}

                  {panelAbierto === 'repertorio' && (
                    <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-[12px] font-extrabold text-slate-800">Repertorio</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">Canciones, tonalidades, enlaces y notas de preparación.</p>
                      </div>
                      {equipoVisible.repertorio.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-400">Todavía no hay canciones publicadas para este servicio.</p>
                      ) : (
                        <div>
                          {equipoVisible.repertorio.map((cancion, index) => (
                            <div key={cancion.id} className={`px-4 py-3.5 ${index < equipoVisible.repertorio.length - 1 ? 'border-b border-slate-100' : ''}`}>
                              <div className="flex items-start gap-3">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 text-[10px] font-extrabold text-rose-600">{cancion.orden || index + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <p className="truncate text-xs font-extrabold text-slate-800">{cancion.titulo}</p>
                                    {cancion.tonalidad && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-extrabold text-slate-600">{cancion.tonalidad}</span>}
                                  </div>
                                  {cancion.artista && <p className="mt-0.5 truncate text-[10px] text-slate-400">{cancion.artista}</p>}
                                  {(cancion.spotifyUrl || cancion.youtubeUrl || cancion.enlace) && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {cancion.spotifyUrl && <ExternalButton href={cancion.spotifyUrl} label="Spotify" />}
                                      {cancion.youtubeUrl && <ExternalButton href={cancion.youtubeUrl} label="YouTube" />}
                                      {cancion.enlace && <ExternalButton href={cancion.enlace} label="Enlace" />}
                                    </div>
                                  )}
                                  {cancion.notas && <p className="mt-2 text-[10px] leading-4 text-slate-500">{cancion.notas}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {panelAbierto === 'paleta' && (
                    <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-[12px] font-extrabold text-slate-800">Paleta de colores</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">Referencia visual y observaciones para este servicio.</p>
                      </div>
                      {equipoVisible.paletas.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-400">Todavía no hay una paleta publicada para este servicio.</p>
                      ) : (
                        <div className="space-y-3 p-4">
                          {equipoVisible.paletas.map((paleta) => (
                            <div key={paleta.id} className="rounded-2xl bg-amber-50/55 p-3 ring-1 ring-amber-100/70">
                              {paleta.colores.length > 0 && (
                                <div className="flex min-h-12 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                                  {paleta.colores.map((tono, index) => (
                                    <span key={`${paleta.id}-${tono}-${index}`} className="min-w-8 flex-1" style={{ backgroundColor: tono }} aria-label={`Color ${tono}`} />
                                  ))}
                                </div>
                              )}
                              {paleta.observaciones && <p className="mt-3 text-[10px] leading-4 text-slate-600">{paleta.observaciones}</p>}
                              {paleta.referenciaUrl && (
                                <a href={paleta.referenciaUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[9px] font-extrabold text-amber-700 ring-1 ring-amber-100">
                                  Ver referencia <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-600 ring-1 ring-slate-100">
      {label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}
