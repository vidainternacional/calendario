'use server'

import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { crearEventoCalendario } from '@/app/actions/eventos'

function fail(message: string): never {
  throw new Error(message)
}

function localDateToIso(value: string) {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return null
  const date = new Date(`${trimmed}:00-06:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function mesSV(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`
}

export async function crearServicioAlabanza(ministerioId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) fail('Tu sesión ha vencido.')

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membership }, { data: calendars }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('calendars').select('id,nombre').eq('ministerio_id', ministerioId).limit(1),
  ])

  const puedeProgramar = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (['administrador', 'pastor'].includes(profile.rol) || membership?.es_lider === true)

  if (!puedeProgramar) fail('Solo el liderazgo del ministerio puede crear servicios.')

  const calendar = calendars?.[0]
  if (!calendar?.id) fail('Este ministerio todavía no tiene un calendario disponible.')

  const titulo = String(formData.get('titulo') || '').trim()
  const ubicacion = String(formData.get('ubicacion') || '').trim()
  const start = localDateToIso(String(formData.get('fecha_inicio') || ''))
  const duration = Number(formData.get('duracion_minutos') || 120)
  const durationMinutes = [60, 90, 120, 180].includes(duration) ? duration : 120

  if (!titulo || titulo.length > 140) fail('Escribe un nombre válido para el servicio.')
  if (!start) fail('Selecciona una fecha y hora válidas.')

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const eventData = new FormData()
  eventData.set('item_type', 'event')
  eventData.set('titulo', titulo)
  eventData.set('ubicacion', ubicacion)
  eventData.set('descripcion', 'Servicio programado desde el panel de Alabanza.')
  eventData.set('calendar_id', String(calendar.id))
  eventData.append('calendar_ids', String(calendar.id))
  eventData.set('fecha_inicio', start.toISOString())
  eventData.set('fecha_fin', end.toISOString())
  eventData.set('todo_el_dia', 'false')
  eventData.set('tiempo_viaje_minutos', '0')
  eventData.set('notif_1d', 'false')
  eventData.set('notif_1h', 'false')

  const result = await crearEventoCalendario(eventData)
  if (!result.success) fail(result.error || 'No fue posible crear el servicio en Calendario.')

  // El creador del evento recibe una asignación técnica en el flujo general del Calendario.
  // En Programación de Alabanza esa fila no significa que esté sirviendo, así que la retiramos
  // cuando no tiene una función ministerial concreta.
  await admin
    .from('evento_asignaciones')
    .delete()
    .eq('evento_id', result.eventoId)
    .eq('profile_id', user.id)
    .is('capacidad_id', null)

  redirect(`/ministerios/${ministerioId}/programacion?mes=${mesSV(start)}&evento=${result.eventoId}#servicio-activo`)
}
