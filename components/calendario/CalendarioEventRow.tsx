'use client'

import { format } from 'date-fns'
import { BellRing } from 'lucide-react'
import { eventColor, type EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'
import fixes from './CalendarioFinalFixes.module.css'

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
    <button type="button" className={`${styles.eventRow} ${fixes.eventRowDark}`} onClick={() => onOpen(evento)}>
      <span className={styles.eventColor} style={{ backgroundColor: color }} />
      <span className={`${styles.eventMain} ${fixes.eventMainFix}`}>
        <span className={`${styles.eventTitle} ${fixes.eventTitleFix} ${fixes.eventTitleDark}`}>{evento.titulo}</span>
        <span className={`${styles.eventMeta} ${fixes.eventMetaFix} ${fixes.eventMetaDark}`} style={{ color }}>
          {evento.kind === 'reminder'
            ? <><BellRing size={12} className="mr-1 inline" />Recordatorio</>
            : evento.calendars?.nombre || 'Vida Internacional'}
        </span>
        {evento.ubicacion && (
          <span className={`${styles.eventLocation} ${fixes.eventLocationFix} ${fixes.eventLocationDark}`}>
            {evento.ubicacion}
          </span>
        )}
      </span>
      <span className={`${styles.eventTime} ${fixes.eventTimeFix} ${fixes.eventTimeDark}`}>
        {evento.kind === 'reminder'
          ? format(inicio, 'h:mm a')
          : evento.todo_el_dia
            ? 'Todo el día'
            : fin
              ? `${format(inicio, 'h:mm a')}\n${format(fin, 'h:mm a')}`
              : format(inicio, 'h:mm a')}
      </span>
    </button>
  )
}
