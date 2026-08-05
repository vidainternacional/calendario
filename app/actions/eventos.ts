'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CrearEventoCalendarioResult = {
  success: boolean
  error?: string
  eventoId?: string
  itemType?: 'event' | 'reminder'
}

export type MutarElementoCalendarioResult = {
  success: boolean
  error?: string
}

type PerfilPermisosEvento = {
  rol: string
  activo: boolean
  estado_cuenta: string
}

type FilaProfileId = { profile_id: string }
type FilaId = { id: string }
type FilaElemento = { id: string; calendar_id: string }

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

async function validarAccesoEscritura(db: any, userId: string, calendarId: string) {
  const { data: perfilRaw } = await db
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', userId)
    .single()

  const perfil = perfilRaw as PerfilPermisosEvento | null
  if (!perfil?.activo || perfil.estado_cuenta !== 'activo') {
    return { error: 'Tu cuenta no tiene permiso para modificar elementos.' as const }
  }

  const esPastorAdmin = perfil.rol === 'pastor' || perfil.rol === 'administrador'
  const { data: subscriptionRaw, error: subscriptionError } = await db
    .from('calendar_subscriptions')
    .select('can_edit, calendars(id, nombre, ministerio_id)')
    .eq('user_id', userId)
    .eq('calendar_id', calendarId)
    .maybeSingle()

  const subscription = subscriptionRaw as SuscripcionCalendario | null
  if (subscriptionError || !subscription?.calendars || (!subscription.can_edit && !esPastorAdmin)) {
    return { error: 'No tienes permiso para escribir en ese calendario.' as const }
  }

  return { perfil, subscription: subscription as SuscripcionCalendario }
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

  const access = await validarAccesoEscritura(db, user.id, calendarId)
  if ('error' in access) return { success: false, error: access.error }

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

  const ministerioId = access.subscription.calendars!.ministerio_id || null
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

export async function actualizarElementoCalendario(
  formData: FormData,
): Promise<MutarElementoCalendarioResult> {
  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tu sesión ha vencido.' }

  const itemType = texto(formData, 'item_type') === 'reminder' ? 'reminder' : 'event'
  const itemId = texto(formData, 'item_id')
  const titulo = texto(formData, 'titulo')
  const descripcion = texto(formData, 'descripcion')
  const fechaInicio = new Date(texto(formData, 'fecha_inicio'))

  if (!uuidValido(itemId)) return { success: false, error: 'El elemento no es válido.' }
  if (!titulo || titulo.length > 140) return { success: false, error: 'Escribe un título válido.' }
  if (Number.isNaN(fechaInicio.getTime())) return { success: false, error: 'Selecciona una fecha válida.' }

  const table = itemType === 'reminder' ? 'calendar_reminders' : 'eventos'
  const { data: itemRaw, error: itemError } = await db
    .from(table)
    .select('id, calendar_id')
    .eq('id', itemId)
    .maybeSingle()

  const item = itemRaw as FilaElemento | null
  if (itemError || !item) return { success: false, error: 'El elemento ya no está disponible.' }

  const access = await validarAccesoEscritura(db, user.id, item.calendar_id)
  if ('error' in access) return { success: false, error: access.error }

  if (itemType === 'reminder') {
    const { error } = await db
      .from('calendar_reminders')
      .update({
        title: titulo,
        notes: descripcion || null,
        remind_at: fechaInicio.toISOString(),
      })
      .eq('id', itemId)

    if (error) {
      console.error('[actualizarElementoCalendario] reminder', error)
      return { success: false, error: 'No fue posible actualizar el recordatorio.' }
    }

    revalidatePath('/calendario')
    return { success: true }
  }

  const fechaFin = new Date(texto(formData, 'fecha_fin'))
  if (Number.isNaN(fechaFin.getTime()) || fechaFin <= fechaInicio) {
    return { success: false, error: 'La fecha de finalización debe ser posterior al inicio.' }
  }

  const travelRaw = Number(texto(formData, 'tiempo_viaje_minutos') || 0)
  const tiempoViaje = [0, 15, 30, 45, 60].includes(travelRaw) ? travelRaw : 0
  const { error } = await db
    .from('eventos')
    .update({
      titulo,
      ubicacion: texto(formData, 'ubicacion') || null,
      descripcion: descripcion || null,
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      todo_el_dia: texto(formData, 'todo_el_dia') === 'true',
      tiempo_viaje_minutos: tiempoViaje,
    })
    .eq('id', itemId)

  if (error) {
    console.error('[actualizarElementoCalendario] event', error)
    return { success: false, error: 'No fue posible actualizar el evento.' }
  }

  revalidatePath('/calendario')
  return { success: true }
}

export async function eliminarElementoCalendario(
  formData: FormData,
): Promise<MutarElementoCalendarioResult> {
  const supabase = await createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tu sesión ha vencido.' }

  const itemType = texto(formData, 'item_type') === 'reminder' ? 'reminder' : 'event'
  const itemId = texto(formData, 'item_id')
  if (!uuidValido(itemId)) return { success: false, error: 'El elemento no es válido.' }

  const table = itemType === 'reminder' ? 'calendar_reminders' : 'eventos'
  const { data: itemRaw, error: itemError } = await db
    .from(table)
    .select('id, calendar_id')
    .eq('id', itemId)
    .maybeSingle()

  const item = itemRaw as FilaElemento | null
  if (itemError || !item) return { success: false, error: 'El elemento ya no está disponible.' }

  const access = await validarAccesoEscritura(db, user.id, item.calendar_id)
  if ('error' in access) return { success: false, error: access.error }

  const { error } = await db.from(table).delete().eq('id', itemId)
  if (error) {
    console.error('[eliminarElementoCalendario]', error)
    return {
      success: false,
      error: itemType === 'reminder'
        ? 'No fue posible eliminar el recordatorio.'
        : 'No fue posible eliminar el evento.',
    }
  }

  revalidatePath('/calendario')
  return { success: true }
}
