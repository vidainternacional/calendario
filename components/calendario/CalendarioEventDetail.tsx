'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  obtenerEquipoVisibleEvento,
  type EquipoEventoVisible,
  type EstadoEquipoEvento,
} from '@/app/actions/equipo-evento-visible'
import UserAvatar from '@/components/comunidad/UserAvatar'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioEventDetail.module.css'

const EXIT_MS = 190

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

    if (!event || event.kind !== 'event') return

    setEquipoLoading(true)
    void obtenerEquipoVisibleEvento(event.id)
      .then((result) => {
        if (!cancelled) setEquipoVisible(result)
      })
      .catch((error) => {
        console.error('[CalendarioEventDetail] No se pudo cargar el equipo del servicio', error)
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
            <section className="rounded-[18px] bg-white px-4 py-4 text-sm text-slate-400 ring-1 ring-black/[0.05]" aria-label="Cargando equipo">
              Cargando equipo del servicio…
            </section>
          )}

          {event.kind === 'event' && equipoVisible && (
            <section className="overflow-hidden rounded-[20px] bg-white ring-1 ring-black/[0.05]" aria-label="Equipo de este servicio">
              {equipoVisible.miEstado && (
                <div className="border-b border-slate-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-violet-600">Sirves en este evento</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(equipoVisible.misFunciones.length ? equipoVisible.misFunciones : ['Asignado']).map((funcion) => (
                          <span key={funcion} className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-extrabold text-white">{funcion}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 ${estadoClasses(equipoVisible.miEstado)}`}>
                      {estadoLabel(equipoVisible.miEstado)}
                    </span>
                  </div>
                  <Link
                    href="/intercambios"
                    className="mt-3 flex min-h-11 items-center justify-between rounded-xl bg-violet-600 px-3.5 text-xs font-extrabold text-white shadow-sm shadow-violet-100 transition active:scale-[0.99]"
                  >
                    <span>Preparación, respuesta y cambios</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  <h3 className="text-[13px] font-extrabold text-slate-800">Equipo de este servicio</h3>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-500">{equipoVisible.equipo.length}</span>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50/80 ring-1 ring-slate-100">
                  {equipoVisible.equipo.map((miembro, index) => (
                    <div
                      key={miembro.profileId}
                      className={`flex items-center gap-3 px-3 py-3 ${index < equipoVisible.equipo.length - 1 ? 'border-b border-slate-100' : ''}`}
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
                </div>
                <p className="mt-2 text-[9px] leading-4 text-slate-400">Verde: confirmado · amarillo: pendiente de respuesta.</p>
              </div>
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
