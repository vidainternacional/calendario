'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CrearEventoCalendarioResult = {
  success: boolean
  error?: string
  eventoId?: string
  itemType?: 'event' | 'reminder'
}

type PerfilPermisosEvento = {
  rol: string
  activo: boolean
  estado_cuenta: string
}

type FilaProfileId = { profile_id: string }
type FilaId = { id: string }

type SuscripcionCalendario = {
  can_edit: boolean
  calendars: {
    id: string
    nombre: string
    ministerio_id: string | null
  } | null
}

function texto(formData: FormData, nombre: string) {
  return String(formData.get(nombre) || '').trim()
}

function uuidValido(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function crearEventoCalendario(
  formData: FormData,
): Promise<CrearEventoCalendarioResult> {
  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tu sesión ha vencido.' }

  const itemType = texto(formData, 'item_type') === 'reminder' ? 'reminder' : 'event'
  const titulo = texto(formData, 'titulo')
  const calendarId = texto(formData, 'calendar_id')
  const descripcion = texto(formData, 'descripcion')
  const fechaInicioRaw = texto(formData, 'fecha_inicio')

  if (!titulo || titulo.length > 140) {
    return { success: false, error: 'Escribe un título válido.' }
  }

  if (!uuidValido(calendarId)) {
    return { success: false, error: 'Selecciona un calendario válido.' }
  }

  const { data: perfilRaw } = await db
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .single()

  const perfil = perfilRaw as PerfilPermisosEvento | null
  if (!perfil?.activo || perfil.estado_cuenta !== 'activo') {
    return { success: false, error: 'Tu cuenta no tiene permiso para crear elementos.' }
  }

  const esPastorAdmin = perfil.rol === 'pastor' || perfil.rol === 'administrador'
  const { data: subscriptionRaw, error: subscriptionError } = await db
    .from('calendar_subscriptions')
    .select('can_edit, calendars(id, nombre, ministerio_id)')
    .eq('user_id', user.id)
    .eq('calendar_id', calendarId)
    .maybeSingle()

  const subscription = subscriptionRaw as SuscripcionCalendario | null
  if (subscriptionError || !subscription?.calendars || (!subscription.can_edit && !esPastorAdmin)) {
    return { success: false, error: 'No tienes permiso para escribir en ese calendario.' }
  }

  const fechaInicio = new Date(fechaInicioRaw)
  if (Number.isNaN(fechaInicio.getTime())) {
    return { success: false, error: 'Selecciona una fecha válida.' }
  }

  if (itemType === 'reminder') {
    const { data: reminderRaw, error: reminderError } = await db
      .from('calendar_reminders')
      .insert({
        calendar_id: calendarId,
        title: titulo,
        notes: descripcion || null,
        remind_at: fechaInicio.toISOString(),
        created_by: user.id,
      })
      .select('id')
      .single()

    const reminder = reminderRaw as FilaId | null
    if (reminderError || !reminder) {
      console.error('[crearEventoCalendario] reminder', reminderError)
      return { success: false, error: 'No fue posible guardar el recordatorio.' }
    }

    revalidatePath('/calendario')
    return { success: true, eventoId: reminder.id, itemType }
  }

  const ubicacion = texto(formData, 'ubicacion')
  const fechaFinRaw = texto(formData, 'fecha_fin')
  const fechaFin = new Date(fechaFinRaw)
  const todoElDia = texto(formData, 'todo_el_dia') === 'true'
  const notif1d = texto(formData, 'notif_1d') === 'true'
  const notif1h = texto(formData, 'notif_1h') === 'true'
  const travelRaw = Number(texto(formData, 'tiempo_viaje_minutos') || 0)
  const tiempoViaje = [0, 15, 30, 45, 60].includes(travelRaw) ? travelRaw : 0

  if (Number.isNaN(fechaFin.getTime()) || fechaFin <= fechaInicio) {
    return { success: false, error: 'La fecha de finalización debe ser posterior al inicio.' }
  }

  const ministerioId = subscription.calendars.ministerio_id || null
  const participantesSolicitados = Array.from(
    new Set(
      formData
        .getAll('participantes')
        .map((valor) => String(valor))
        .filter(uuidValido),
    ),
  )

  let participantesPermitidos = participantesSolicitados

  if (ministerioId && participantesSolicitados.length > 0) {
    const { data: membresiasRaw } = await db
      .from('ministerio_miembros')
      .select('profile_id')
      .eq('ministerio_id', ministerioId)
      .in('profile_id', participantesSolicitados)

    const membresias = (membresiasRaw || []) as FilaProfileId[]
    const permitidos = new Set(membresias.map((item) => item.profile_id))
    participantesPermitidos = participantesSolicitados.filter((id) => permitidos.has(id))
  } else if (!ministerioId && participantesSolicitados.length > 0) {
    const { data: perfilesActivosRaw } = await db
      .from('profiles')
      .select('id')
      .eq('activo', true)
      .eq('estado_cuenta', 'activo')
      .in('id', participantesSolicitados)

    const perfilesActivos = (perfilesActivosRaw || []) as FilaId[]
    const permitidos = new Set(perfilesActivos.map((item) => item.id))
    participantesPermitidos = participantesSolicitados.filter((id) => permitidos.has(id))
  }

  const { data: eventoRaw, error: eventoError } = await db
    .from('eventos')
    .insert({
      titulo,
      ubicacion: ubicacion || null,
      descripcion: descripcion || null,
      ministerio_id: ministerioId,
      calendar_id: calendarId,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      todo_el_dia: todoElDia,
      tiempo_viaje_minutos: tiempoViaje,
      creado_por: user.id,
    })
    .select('id')
    .single()

  const evento = eventoRaw as FilaId | null
  if (eventoError || !evento) {
    console.error('[crearEventoCalendario] evento', eventoError)
    return { success: false, error: 'No fue posible guardar el evento.' }
  }

  const asignados = Array.from(new Set([user.id, ...participantesPermitidos]))
  const { error: asignacionesError } = await db.from('evento_asignaciones').insert(
    asignados.map((profileId) => ({
      evento_id: evento.id,
      profile_id: profileId,
      estado: profileId === user.id ? 'confirmado' : 'asignado',
      notif_1d: notif1d,
      notif_1h: notif1h,
    })),
  )

  if (asignacionesError) {
    console.error('[crearEventoCalendario] asignaciones', asignacionesError)
    await db.from('eventos').delete().eq('id', evento.id)
    return { success: false, error: 'El evento no pudo asignarse a los participantes.' }
  }

  revalidatePath('/calendario')
  return { success: true, eventoId: evento.id, itemType }
}
