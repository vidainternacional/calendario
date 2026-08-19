'use server'

import { revalidatePath } from 'next/cache'
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

function diaSV(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

async function obtenerContexto(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) fail('Tu sesión ha vencido.')

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membership }, { data: ministryCalendars }, { data: publicCalendars }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('calendars').select('id,nombre').eq('ministerio_id', ministerioId).order('created_at').limit(1),
    admin.from('calendars').select('id,nombre').eq('es_publico', true).order('created_at'),
  ])

  const puedeProgramar = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile.rol === 'administrador' || membership?.es_lider === true)

  if (!puedeProgramar) fail('Solo el liderazgo del ministerio puede preparar servicios.')

  const ministryCalendar = ministryCalendars?.[0]
  if (!ministryCalendar?.id) fail('Este ministerio todavía no tiene un calendario disponible.')

  return {
    user,
    admin,
    ministryCalendar,
    publicCalendars: publicCalendars || [],
  }
}

function revalidar(ministerioId: string) {
  revalidatePath('/calendario')
  revalidatePath('/inicio')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
}

export async function prepararFechaAlabanza(ministerioId: string, formData: FormData): Promise<void> {
  const { user, admin, ministryCalendar, publicCalendars } = await obtenerContexto(ministerioId)
  const itemType = String(formData.get('item_type') || '') === 'reminder' ? 'reminder' : 'event'
  const itemId = String(formData.get('item_id') || '').trim()
  if (!itemId) fail('La fecha seleccionada ya no está disponible.')

  if (itemType === 'event') {
    const [{ data: evento }, { data: links = [] }] = await Promise.all([
      admin.from('eventos').select('id,fecha_inicio').eq('id', itemId).maybeSingle(),
      admin.from('evento_calendarios').select('calendar_id').eq('evento_id', itemId),
    ])
    if (!evento) fail('El evento ya no está disponible.')

    const linkedIds = (links || []).map((row: any) => String(row.calendar_id))
    const allowedSourceIds = new Set([
      String(ministryCalendar.id),
      ...publicCalendars.map((row: any) => String(row.id)),
    ])
    if (!linkedIds.some((id: string) => allowedSourceIds.has(id))) {
      fail('Esta fecha no pertenece al Calendario general ni a este ministerio.')
    }

    const { error } = await admin.from('evento_calendarios').upsert({
      evento_id: itemId,
      calendar_id: ministryCalendar.id,
    }, { onConflict: 'evento_id,calendar_id' })
    if (error) fail(error.message)

    const start = new Date(evento.fecha_inicio)
    revalidar(ministerioId)
    redirect(`/ministerios/${ministerioId}/programacion?mes=${mesSV(start)}&dia=${diaSV(start)}&evento=${itemId}#servicio-activo`)
  }

  const { data: reminder } = await admin
    .from('calendar_reminders')
    .select('id,title,notes,remind_at,calendar_id,created_by')
    .eq('id', itemId)
    .maybeSingle()
  if (!reminder) fail('El recordatorio ya no está disponible.')

  const { data: sourceCalendar } = await admin
    .from('calendars')
    .select('id,es_publico,ministerio_id')
    .eq('id', reminder.calendar_id)
    .maybeSingle()
  const sourceAllowed = sourceCalendar?.es_publico === true
    || String(sourceCalendar?.ministerio_id || '') === ministerioId
  if (!sourceAllowed) fail('Ese recordatorio no pertenece al Calendario general ni a este ministerio.')

  const start = new Date(reminder.remind_at)
  const end = new Date(start.getTime() + 120 * 60_000)
  const { data: created, error: createError } = await admin
    .from('eventos')
    .insert({
      titulo: reminder.title,
      descripcion: reminder.notes || null,
      ubicacion: null,
      ministerio_id: sourceCalendar?.ministerio_id === ministerioId ? ministerioId : null,
      calendar_id: reminder.calendar_id,
      fecha_inicio: start.toISOString(),
      fecha_fin: end.toISOString(),
      todo_el_dia: false,
      tiempo_viaje_minutos: 0,
      creado_por: reminder.created_by || user.id,
    })
    .select('id')
    .single()
  if (createError || !created) fail(createError?.message || 'No fue posible preparar esa fecha.')

  const calendarIds = Array.from(new Set([String(reminder.calendar_id), String(ministryCalendar.id)]))
  const { error: linkError } = await admin.from('evento_calendarios').insert(
    calendarIds.map((calendarId) => ({ evento_id: created.id, calendar_id: calendarId })),
  )
  if (linkError) {
    await admin.from('eventos').delete().eq('id', created.id)
    fail(linkError.message)
  }

  const { error: deleteError } = await admin.from('calendar_reminders').delete().eq('id', reminder.id)
  if (deleteError) {
    await admin.from('eventos').delete().eq('id', created.id)
    fail('No fue posible convertir el recordatorio sin duplicar la fecha.')
  }

  revalidar(ministerioId)
  redirect(`/ministerios/${ministerioId}/programacion?mes=${mesSV(start)}&dia=${diaSV(start)}&evento=${created.id}#servicio-activo`)
}

export async function crearServicioAlabanza(ministerioId: string, formData: FormData): Promise<void> {
  const { user, admin, ministryCalendar, publicCalendars } = await obtenerContexto(ministerioId)

  const titulo = String(formData.get('titulo') || 'Servicio de Alabanza').trim() || 'Servicio de Alabanza'
  const ubicacion = String(formData.get('ubicacion') || '').trim()
  const fecha = String(formData.get('fecha') || '').trim()
  const hora = String(formData.get('hora') || '').trim()
  const fechaInicioLegacy = String(formData.get('fecha_inicio') || '').trim()
  const start = localDateToIso(fecha && hora ? `${fecha}T${hora}` : fechaInicioLegacy)
  const duration = Number(formData.get('duracion_minutos') || 120)
  const durationMinutes = [60, 90, 120, 180].includes(duration) ? duration : 120

  if (titulo.length > 140) fail('Escribe un nombre válido para el servicio.')
  if (!start) fail('Selecciona un día y una hora válidos.')

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const eventData = new FormData()
  eventData.set('item_type', 'event')
  eventData.set('titulo', titulo)
  eventData.set('ubicacion', ubicacion)
  eventData.set('descripcion', 'Servicio programado desde el panel ministerial.')
  eventData.set('calendar_id', String(ministryCalendar.id))
  eventData.append('calendar_ids', String(ministryCalendar.id))
  eventData.set('fecha_inicio', start.toISOString())
  eventData.set('fecha_fin', end.toISOString())
  eventData.set('todo_el_dia', 'false')
  eventData.set('tiempo_viaje_minutos', '0')
  eventData.set('notif_1d', 'false')
  eventData.set('notif_1h', 'false')

  const result = await crearEventoCalendario(eventData)
  if (!result.success || !result.eventoId) fail(result.error || 'No fue posible crear el servicio en Calendario.')

  if (publicCalendars.length > 0) {
    const { error } = await admin.from('evento_calendarios').upsert(
      publicCalendars.map((calendar: any) => ({
        evento_id: result.eventoId,
        calendar_id: calendar.id,
      })),
      { onConflict: 'evento_id,calendar_id' },
    )
    if (error) {
      await admin.from('eventos').delete().eq('id', result.eventoId)
      fail('No fue posible publicar el servicio en el Calendario general.')
    }
  }

  await admin
    .from('evento_asignaciones')
    .delete()
    .eq('evento_id', result.eventoId)
    .eq('profile_id', user.id)
    .is('capacidad_id', null)
    .is('ministerio_id', null)

  revalidar(ministerioId)
  redirect(`/ministerios/${ministerioId}/programacion?mes=${mesSV(start)}&dia=${diaSV(start)}&evento=${result.eventoId}#servicio-activo`)
}
