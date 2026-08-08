'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BellRing,
  CalendarDays,
  CarFront,
  ChevronLeft,
  Clock3,
  MapPin,
  NotebookText,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioEventDetail.module.css'

export default function CalendarioEventDetail({
  event,
  onClose,
}: {
  event: EventoCalendario | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!event) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [event, onClose])

  if (!event) return null

  const start = new Date(event.fecha_inicio)
  const end = event.fecha_fin ? new Date(event.fecha_fin) : null
  const color = eventColor(event)
  const calendarName = event.calendars?.nombre || 'Vida Internacional'
  const dateText = format(start, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  const timeText = event.todo_el_dia
    ? 'Todo el día'
    : end
      ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
      : format(start, 'h:mm a')
  const monthText = format(start, 'MMMM', { locale: es })
  const monthLabel = monthText.charAt(0).toUpperCase() + monthText.slice(1)

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}
    >
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-detail-title"
      >
        <header className={styles.topbar}>
          <button type="button" className={styles.backButton} onClick={onClose} aria-label={`Volver a ${monthLabel}`}>
            <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" />
            <span>{monthLabel}</span>
          </button>
          <p className={styles.topbarTitle}>
            {event.kind === 'reminder' ? 'Recordatorio' : 'Evento'}
          </p>
          <span className={styles.topbarSpacer} aria-hidden="true" />
        </header>

        <div className={styles.body}>
          <div className={styles.summary}>
            <span className={styles.colorBar} style={{ backgroundColor: color }} aria-hidden="true" />
            <div className={styles.summaryCopy}>
              <p className={styles.kind} style={{ color }}>
                {event.kind === 'reminder' ? 'Recordatorio' : 'Evento'}
              </p>
              <h2 id="calendar-event-detail-title" className={styles.title}>{event.titulo}</h2>
              <p className={styles.calendarName}>{calendarName}</p>
            </div>
          </div>

          <section className={styles.group} aria-label="Fecha y hora">
            <DetailRow
              icon={event.kind === 'reminder' ? BellRing : CalendarDays}
              label="Fecha"
              value={dateText}
            />
            <DetailRow icon={Clock3} label="Hora" value={timeText} />
            {Boolean(event.tiempo_viaje_minutos) && (
              <DetailRow
                icon={CarFront}
                label="Tiempo de viaje"
                value={`${event.tiempo_viaje_minutos} minutos`}
              />
            )}
          </section>

          {(event.ministerios?.nombre || event.ubicacion) && (
            <section className={styles.group} aria-label="Información adicional">
              {event.ministerios?.nombre && (
                <DetailRow icon={Users} label="Ministerio" value={event.ministerios.nombre} />
              )}
              {event.ubicacion && (
                <DetailRow icon={MapPin} label="Ubicación" value={event.ubicacion} />
              )}
            </section>
          )}

          {event.descripcion && (
            <section className={`${styles.group} ${styles.descriptionGroup}`} aria-label="Notas">
              <DetailRow icon={NotebookText} label="Notas" value={event.descripcion} />
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className={styles.row}>
      <span className={styles.icon} aria-hidden="true"><Icon size={18} /></span>
      <span className={styles.rowCopy}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </span>
    </div>
  )
}
