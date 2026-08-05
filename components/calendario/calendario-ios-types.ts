import { format, isSameDay } from 'date-fns'

export type VistaCalendario = 'anio' | 'mes' | 'multiday' | 'lista'
export type CalendarItemKind = 'event' | 'reminder'

export type CalendarioOrigen = {
  id: string
  nombre: string
  color: string
  owner_id?: string | null
  tipo_cuenta: 'interno' | 'gmail' | 'icloud' | 'other'
  es_publico: boolean
  ministerio_id?: string | null
  visible?: boolean
  can_edit?: boolean
}

export type EventoCalendario = {
  kind: CalendarItemKind
  id: string
  titulo: string
  descripcion?: string | null
  ubicacion?: string | null
  fecha_inicio: string
  fecha_fin?: string | null
  todo_el_dia?: boolean
  tiempo_viaje_minutos?: number
  calendar_id: string
  calendars?: CalendarioOrigen | null
  ministerio_id?: string | null
  ministerios?: { nombre: string } | null
  asignacion_id?: string | null
  estadoAsignacion?: string | null
}

export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const HOUR_HEIGHT = 64

export function monthKey(date: Date) {
  return format(date, 'yyyy-MM')
}

export function eventColor(evento: EventoCalendario) {
  return evento.calendars?.color || '#5B3DF5'
}

export function eventKey(evento: EventoCalendario) {
  return `${evento.kind}:${evento.id}`
}

export function eventosDelDia(eventos: EventoCalendario[], dia: Date) {
  return eventos.filter((evento) => isSameDay(new Date(evento.fecha_inicio), dia))
}
