'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BellRing, CalendarDays, Clock3, MapPin, NotebookText, Users, X } from 'lucide-react'
import { useEffect } from 'react'
import type { EventoCalendario } from './calendario-ios-types'
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
  const dateText = format(start, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  const timeText = event.todo_el_dia
    ? 'Todo el día'
    : end
      ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
      : format(start, 'h:mm a')

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-detail-title"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              {event.kind === 'reminder' ? 'Recordatorio' : 'Evento'}
            </p>
            <h2 id="calendar-event-detail-title" className={styles.title}>{event.titulo}</h2>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar detalle">
            <X size={21} />
          </button>
        </header>

        <div className={styles.body}>
          <DetailRow icon={event.kind === 'reminder' ? BellRing : CalendarDays} label="Fecha" value={dateText} />
          <DetailRow icon={Clock3} label="Hora" value={timeText} />
          <DetailRow
            icon={CalendarDays}
            label="Calendario"
            value={event.calendars?.nombre || 'Vida Internacional'}
          />
          {event.ministerios?.nombre && (
            <DetailRow icon={Users} label="Ministerio" value={event.ministerios.nombre} />
          )}
          {event.ubicacion && (
            <DetailRow icon={MapPin} label="Ubicación" value={event.ubicacion} />
          )}
          {event.descripcion && (
            <DetailRow icon={NotebookText} label="Descripción" value={event.descripcion} />
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
      <span>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </span>
    </div>
  )
}
