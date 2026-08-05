'use client'

import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import appearance from '@/components/calendario/CalendarioAppearance.module.css'
import type { CalendarioOrigen, EventoCalendario } from '@/components/calendario/calendario-ios-types'

const calendars: CalendarioOrigen[] = [
  {
    id: 'calendar-general',
    nombre: 'Vida Internacional',
    color: '#5B3DF5',
    tipo_cuenta: 'interno',
    es_publico: true,
    can_edit: true,
  },
  {
    id: 'calendar-alabanza',
    nombre: 'Alabanza',
    color: '#F59E0B',
    tipo_cuenta: 'interno',
    es_publico: false,
    can_edit: true,
  },
  {
    id: 'calendar-jovenes',
    nombre: 'Jóvenes',
    color: '#EAB308',
    tipo_cuenta: 'interno',
    es_publico: false,
    can_edit: true,
  },
]

function item(
  id: string,
  titulo: string,
  start: string,
  end: string | null,
  calendar: CalendarioOrigen,
  extra: Partial<EventoCalendario> = {},
): EventoCalendario {
  return {
    kind: 'event',
    id,
    titulo,
    fecha_inicio: start,
    fecha_fin: end,
    calendar_id: calendar.id,
    calendars: calendar,
    todo_el_dia: false,
    ...extra,
  }
}

const events: EventoCalendario[] = [
  item('e-1', 'Ensayo general', '2026-08-05T08:00:00-06:00', '2026-08-05T09:30:00-06:00', calendars[1], { ubicacion: 'Auditorio principal' }),
  item('e-2', 'Reunión de líderes', '2026-08-05T10:00:00-06:00', '2026-08-05T11:45:00-06:00', calendars[0]),
  item('e-3', 'Práctica de voces', '2026-08-05T10:30:00-06:00', '2026-08-05T12:00:00-06:00', calendars[1]),
  item('e-4', 'Noche de jóvenes', '2026-08-06T18:30:00-06:00', '2026-08-06T20:30:00-06:00', calendars[2], { ubicacion: 'Salón juvenil' }),
  item('e-5', 'Servicio dominical', '2026-08-09T09:00:00-06:00', '2026-08-09T12:00:00-06:00', calendars[0]),
  item('e-6', 'Ensayo de músicos', '2026-08-12T19:00:00-06:00', '2026-08-12T21:00:00-06:00', calendars[1]),
  item('e-7', 'Conferencia especial', '2026-08-14T00:00:00-06:00', '2026-08-15T00:00:00-06:00', calendars[0], { todo_el_dia: true }),
  item('e-8', 'Reunión pastoral', '2026-08-15T16:00:00-06:00', '2026-08-15T17:30:00-06:00', calendars[0]),
  item('e-9', 'Actividad familiar', '2026-08-22T14:00:00-06:00', '2026-08-22T18:00:00-06:00', calendars[2]),
  item('e-10', 'Culto de celebración', '2026-08-30T17:00:00-06:00', '2026-08-30T20:00:00-06:00', calendars[0]),
  {
    kind: 'reminder',
    id: 'r-1',
    titulo: 'Confirmar servidores',
    fecha_inicio: '2026-08-05T13:30:00-06:00',
    fecha_fin: '2026-08-05T14:00:00-06:00',
    calendar_id: calendars[0].id,
    calendars: calendars[0],
    todo_el_dia: false,
  },
]

export default function CalendarVisualQaPage() {
  return (
    <main data-calendar-shell className={appearance.root}>
      <CalendarioIOS
        events={events}
        editableCalendars={calendars}
        userId="qa-calendar-user"
        onRefresh={() => {}}
        onOpenCalendars={() => {}}
        onRangeYearChange={() => {}}
      />
    </main>
  )
}
