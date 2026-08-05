'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CrearEventoCalendarioResult = {
  success: boolean
  error?: string
  eventoId?: string
}

type PerfilPermisosEvento = {
  rol: string
  activo: boolean
  estado_cuenta: string
}

type FilaProfileId = { profile_id: string }
type FilaId = { id: string }
type FilaCalendario = { id: string }

function texto(formData: FormData, nombre: string) {
  return String(formData.get(nombre) || '').trim()
}

export async function crearEventoCalendario(
  formData: FormData,
): Promise<CrearEventoCalendarioResult> {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tu sesión ha vencido.' }

  const titulo = texto(formData, 'titulo')
  const ubicacion = texto(formData, 'ubicacion')
  const descripcion = texto(formData, 'descripcion')
  const ministerioId = texto(formData, 'ministerio_id') || null
  const fechaInicioRaw = texto(formData, 'fecha_inicio')
  const fechaFinRaw = texto(formData, 'fecha_fin')
  const todoElDia = texto(formData, 'todo_el_dia') === 'true'
  const notif1d = texto(formData, 'notif_1d') === 'true'
  const notif1h = texto(formData, 'notif_1h') === 'true'
  const tiempoViaje = Number(texto(formData, 'tiempo_viaje_minutos') || '0')

  if (!titulo || titulo.length > 140) {
    return { success: false, error: 'Escribe un título válido para el evento.' }
  }

  if (![0, 15, 30, 45, 60].includes(tiempoViaje)) {
    return { success: false, error: 'Selecciona un tiempo de viaje válido.' }
  }

  const fechaInicio = new Date(fechaInicioRaw)
  const fechaFin = new Date(fechaFinRaw)
  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime()) || fechaFin <= fechaInicio) {
    return { success: false, error: 'La fecha de finalización debe ser posterior al inicio.' }
  }

  const { data: perfilRaw } = await db
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .single()

  const perfil = perfilRaw as PerfilPermisosEvento | null
  if (!perfil?.activo || perfil.estado_cuenta !== 'activo') {
    return { success: false, error: 'Tu cuenta no tiene permiso para crear eventos.' }
  }

  const esPastorAdmin = perfil.rol === 'pastor' || perfil.rol === 'administrador'

  if (!ministerioId && !esPastorAdmin) {
    return { success: false, error: 'Solo un pastor o administrador puede crear eventos generales.' }
  }

  if (ministerioId && !esPastorAdmin) {
    const { data: liderazgo } = await db
      .from('ministerio_miembros')
      .select('id')
      .eq('profile_id', user.id)
      .eq('ministerio_id', ministerioId)
      .eq('es_lider', true)
      .maybeSingle()

    if (!liderazgo) {
      return { success: false, error: 'No tienes permiso para crear eventos en ese ministerio.' }
    }
  }

  const calendarQuery = db
    .from('calendars')
    .select('id')
    .eq('tipo_cuenta', 'interno')

  const { data: calendarioRaw, error: calendarioError } = ministerioId
    ? await calendarQuery.eq('ministerio_id', ministerioId).maybeSingle()
    : await calendarQuery.is('ministerio_id', null).maybeSingle()

  const calendario = calendarioRaw as FilaCalendario | null
  if (calendarioError || !calendario) {
    console.error('[crearEventoCalendario] calendario', calendarioError)
    return { success: false, error: 'No se encontró el calendario de destino.' }
  }

  const participantesSolicitados = Array.from(new Set(
    formData.getAll('participantes')
      .map((valor) => String(valor))
      .filter((valor) => /^[0-9a-f-]{36}$/i.test(valor)),
  ))

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
      calendar_id: calendario.id,
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
  return { success: true, eventoId: evento.id }
}
