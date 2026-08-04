'use client'

import { format } from 'date-fns'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

export default function CalendarioEventRow({
  evento,
  onOpen,
}: {
  evento: EventoCalendario
  onOpen: (evento: EventoCalendario) => void
}) {
  const inicio = new Date(evento.fecha_inicio)
  const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : null
  const color = eventColor(evento)

  return (
    <button className={styles.eventRow} onClick={() => onOpen(evento)}>
      <span className={styles.eventColor} style={{ backgroundColor: color }} />
      <span className={styles.eventMain}>
        <span className={styles.eventTitle}>{evento.titulo}</span>
        <span className={styles.eventMeta} style={{ color }}>
          {evento.ministerios?.nombre || 'General'}
        </span>
        {evento.ubicacion && <span className={styles.eventLocation}>{evento.ubicacion}</span>}
      </span>
      <span className={styles.eventTime}>
        {evento.todo_el_dia
          ? 'Todo el día'
          : fin
            ? `${format(inicio, 'h:mm a')}\n${format(fin, 'h:mm a')}`
            : format(inicio, 'h:mm a')}
      </span>
    </button>
  )
}
