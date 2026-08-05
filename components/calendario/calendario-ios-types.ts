import { format, isSameDay } from 'date-fns'

/**
 * Las vistas principales definidas por la especificación Apple Calendar.
 * `VistaCalendario` conserva temporalmente los identificadores anteriores
 * mientras se completa la migración visual sin romper producción.
 */
export type VistaCalendarioPrincipal = 'anio' | 'mes' | 'multiday' | 'lista'
export type VistaCalendario = 'anio' | 'mes' | 'semana' | 'dia' | 'agenda'

export type CalendarioOrigen = {
  id: string
  nombre: string
  color: string
  tipo_cuenta: 'interno' | 'gmail' | 'icloud' | 'other'
  es_publico: boolean
  ministerio_id?: string | null
  visible?: boolean
  can_edit?: boolean
}

export type EventoCalendario = {
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

/**
 * Regla de la especificación: el color vive en calendars.color.
 * El fallback morado solo protege registros transitorios o respuestas incompletas;
 * no se persiste ni se toma desde eventos o ministerios.
 */
export function eventColor(evento: EventoCalendario) {
  return evento.calendars?.color || '#5B3DF5'
}

export function eventosDelDia(eventos: EventoCalendario[], dia: Date) {
  return eventos.filter((evento) => isSameDay(new Date(evento.fecha_inicio), dia))
}
