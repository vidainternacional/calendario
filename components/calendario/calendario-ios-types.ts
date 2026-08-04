import { format, isSameDay } from 'date-fns'

export type VistaCalendario = 'anio' | 'mes' | 'semana' | 'dia' | 'agenda'

export type EventoCalendario = {
  id: string
  titulo: string
  descripcion?: string | null
  ubicacion?: string | null
  fecha_inicio: string
  fecha_fin?: string | null
  todo_el_dia?: boolean
  ministerio_id?: string | null
  ministerios?: { nombre: string; color_primario?: string | null } | null
  asignacion_id: string
  estadoAsignacion: string
}

export type MinisterioGestionado = {
  id: string
  nombre: string
  color_primario?: string | null
}

export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const HOUR_HEIGHT = 64

export function monthKey(date: Date) {
  return format(date, 'yyyy-MM')
}

export function eventColor(evento: EventoCalendario) {
  return evento.ministerios?.color_primario || '#5b3df5'
}

export function eventosDelDia(eventos: EventoCalendario[], dia: Date) {
  return eventos.filter((evento) => isSameDay(new Date(evento.fecha_inicio), dia))
}
