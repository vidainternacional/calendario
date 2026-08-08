'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft } from 'lucide-react'
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
  const dateText = format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  const timeText = event.todo_el_dia
    ? 'Todo el día'
    : end
      ? `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
      : format(start, 'h:mm a')
  const monthText = format(start, 'MMMM', { locale: es })
  const monthLabel = monthText.charAt(0).toUpperCase() + monthText.slice(1)

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-detail-title"
      >
        <header className={styles.topbar}>
          <button type="button" className={styles.backButton} onClick={onClose} aria-label={`Volver a ${monthLabel}`}>
            <ChevronLeft size={25} strokeWidth={2.25} aria-hidden="true" />
            <span>{monthLabel}</span>
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
