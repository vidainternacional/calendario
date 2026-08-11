'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoEquipo = {
  userId: string
  puedeProgramar: boolean
  origen: 'lider' | 'administrador'
}

export type EquipoFuncion = { id: string; nombre: string; categoria: string }
export type EquipoMiembro = { id: string; nombre_completo: string; avatar_url: string | null; capacidades: string[] }
export type EquipoAsignacion = { id: string; profile_id: string; capacidad_id: string; estado: string }
export type DatosEquipoServicio = {
  funciones: EquipoFuncion[]
  miembros: EquipoMiembro[]
  asignaciones: EquipoAsignacion[]
}

function fail(message: string): never {
  throw new Error(message)
}

async function obtenerAcceso(ministerioId: string): Promise<AccesoEquipo | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null

  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  return {
    userId: user.id,
    puedeProgramar,
    origen: profile.rol === 'administrador' ? 'administrador' : 'lider',
  }
}

async function calendarioMinisterio(admin: any, ministerioId: string) {
  const { data } = await admin
    .from('calendars')
    .select('id')
    .eq('ministerio_id', ministerioId)
    .order('created_at')
    .limit(1)
  return data?.[0]?.id ? String(data[0].id) : null
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const calendarId = await calendarioMinisterio(admin, ministerioId)
  if (!calendarId) return false

  const [{ data: evento }, { data: link }] = await Promise.all([
    admin.from('eventos').select('id,ministerio_id').eq('id', eventoId).maybeSingle(),
    admin.from('evento_calendarios').select('evento_id').eq('evento_id', eventoId).eq('calendar_id', calendarId).maybeSingle(),
  ])
  return Boolean(evento && (link || String(evento.ministerio_id || '') === ministerioId))
}

function revalidar(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
  revalidatePath('/admin/usuarios')
}

function idsUnicos(formData: FormData, key: string) {
  return Array.from(new Set(formData.getAll(key).map((value) => String(value)).filter(Boolean)))
}

async function asegurarAsignacionesSinHistorial(admin: any, asignacionIds: string[]) {
  if (asignacionIds.length === 0) return

  const [{ data: comoOrigen = [] }, { data: comoDestino = [] }] = await Promise.all([
    admin.from('intercambios').select('id').in('asignacion_origen_id', asignacionIds).limit(1),
    admin.from('intercambios').select('id').in('asignacion_destino_id', asignacionIds).limit(1),
  ])

  if ((comoOrigen as any[]).length > 0 || (comoDestino as any[]).length > 0) {
    fail('No se puede quitar esta función porque forma parte del historial de reemplazos. El registro histórico debe conservarse.')
  }
}

export async function obtenerDatosEquipoServicio(ministerioId: string, eventoId: string): Promise<DatosEquipoServicio> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  const [{ data: funcionesRows = [] }, { data: membresiasRows = [] }, { data: asignacionesRows = [] }] = await Promise.all([
    admin.from('ministerio_capacidades').select('id,nombre,categoria,activo,orden').eq('ministerio_id', ministerioId).eq('activo', true).order('orden').order('nombre'),
    admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', ministerioId),
    admin.from('evento_asignaciones').select('id,profile_id,capacidad_id,estado,ministerio_id').eq('evento_id', eventoId).eq('ministerio_id', ministerioId),
  ])

  const profileIds = (membresiasRows as any[]).map((row: any) => String(row.profile_id))
  if (profileIds.length === 0) return { funciones: [], miembros: [], asignaciones: [] }

  const [{ data: perfiles = [] }, { data: disponibilidad = [] }] = await Promise.all([
    admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIds).order('nombre_completo'),
    admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', ministerioId).in('profile_id', profileIds),
  ])

  const capacidadesPorPersona = new Map<string, string[]>()
  for (const row of disponibilidad as any[]) {
    const profileId = String(row.profile_id)
    capacidadesPorPersona.set(profileId, [...(capacidadesPorPersona.get(profileId) || []), String(row.capacidad_id)])
  }

  const funcionesActivas = new Set((funcionesRows as any[]).map((row: any) => String(row.id)))
  const miembros = (perfiles as any[])
    .filter((row: any) => row.activo === true && row.estado_cuenta === 'activo')
    .map((row: any) => ({
      id: String(row.id),
      nombre_completo: String(row.nombre_completo || 'Integrante'),
      avatar_url: row.avatar_url || null,
      capacidades: (capacidadesPorPersona.get(String(row.id)) || []).filter((id) => funcionesActivas.has(id)),
    }))

  const miembrosIds = new Set(miembros.map((row) => row.id))
  const asignaciones = (asignacionesRows as any[])
    .filter((row: any) => miembrosIds.has(String(row.profile_id)) && row.capacidad_id && funcionesActivas.has(String(row.capacidad_id)))
    .map((row: any) => ({
      id: String(row.id),
      profile_id: String(row.profile_id),
      capacidad_id: String(row.capacidad_id),
      estado: String(row.estado || 'asignado'),
    }))

  return {
    funciones: (funcionesRows as any[]).map((row: any) => ({ id: String(row.id), nombre: String(row.nombre), categoria: String(row.categoria || 'Servicio') })),
    miembros,
    asignaciones,
  }
}

export async function guardarEquipoPersonaServicio(ministerioId: string, eventoId: string, profileId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')

  const seleccionadas = idsUnicos(formData, 'capacidad_id')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  const [{ data: membresia }, { data: disponibilidadRows = [] }, { data: funcionesRows = [] }, { data: actualesRows = [] }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('capacidad_id').eq('ministerio_id', ministerioId).eq('profile_id', profileId),
    admin.from('ministerio_capacidades').select('id').eq('ministerio_id', ministerioId).eq('activo', true),
    admin.from('evento_asignaciones').select('id,capacidad_id').eq('evento_id', eventoId).eq('ministerio_id', ministerioId).eq('profile_id', profileId),
  ])

  if (!membresia) fail('La persona ya no pertenece a este ministerio.')
  const disponibles = new Set((disponibilidadRows as any[]).map((row: any) => String(row.capacidad_id)))
  const funcionesActivas = new Set((funcionesRows as any[]).map((row: any) => String(row.id)))
  for (const capacidadId of seleccionadas) {
    if (!disponibles.has(capacidadId) || !funcionesActivas.has(capacidadId)) fail('Una de las funciones seleccionadas ya no está disponible para esta persona.')
  }

  const actuales = new Map<string, string>()
  for (const row of actualesRows as any[]) if (row.capacidad_id) actuales.set(String(row.capacidad_id), String(row.id))
  const seleccionadasSet = new Set(seleccionadas)

  const eliminarIds = Array.from(actuales.entries()).filter(([capacidadId]) => !seleccionadasSet.has(capacidadId)).map(([, id]) => id)
  const agregarIds = seleccionadas.filter((capacidadId) => !actuales.has(capacidadId))

  if (eliminarIds.length > 0) {
    await asegurarAsignacionesSinHistorial(admin, eliminarIds)
    const { error } = await admin.from('evento_asignaciones').delete().in('id', eliminarIds).eq('evento_id', eventoId).eq('ministerio_id', ministerioId).eq('profile_id', profileId)
    if (error) fail(error.message)
  }

  if (agregarIds.length > 0) {
    const { error } = await admin.from('evento_asignaciones').insert(agregarIds.map((capacidadId) => ({
      evento_id: eventoId,
      profile_id: profileId,
      ministerio_id: ministerioId,
      capacidad_id: capacidadId,
      asignado_por: acceso.userId,
      estado: 'asignado',
      updated_at: new Date().toISOString(),
    })))
    if (error) fail(error.message)
  }

  revalidar(ministerioId)
  return { profileId, capacidades: seleccionadas }
}

export async function guardarDisponibilidadPersonaMinisterial(ministerioId: string, profileId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para administrar funciones de este ministerio.')

  const seleccionadas = idsUnicos(formData, 'capacidad_id')
  const admin = createAdminClient() as any
  const [{ data: membresia }, { data: funcionesRows = [] }, { data: actualesRows = [] }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_capacidades').select('id').eq('ministerio_id', ministerioId).eq('activo', true),
    admin.from('ministerio_miembro_capacidades').select('capacidad_id').eq('ministerio_id', ministerioId).eq('profile_id', profileId),
  ])
  if (!membresia) fail('La persona ya no pertenece a este ministerio.')

  const funcionesActivas = new Set((funcionesRows as any[]).map((row: any) => String(row.id)))
  if (seleccionadas.some((id) => !funcionesActivas.has(id))) fail('Una función seleccionada ya no está activa.')

  const actuales = new Set((actualesRows as any[]).map((row: any) => String(row.capacidad_id)))
  const seleccionadasSet = new Set(seleccionadas)
  const quitar = Array.from(actuales).filter((id) => !seleccionadasSet.has(id))
  const agregar = seleccionadas.filter((id) => !actuales.has(id))

  if (quitar.length > 0) {
    const { error } = await admin.from('ministerio_miembro_capacidades').delete().eq('ministerio_id', ministerioId).eq('profile_id', profileId).in('capacidad_id', quitar)
    if (error) fail(error.message)
  }
  if (agregar.length > 0) {
    const { error } = await admin.from('ministerio_miembro_capacidades').insert(agregar.map((capacidadId) => ({
      ministerio_id: ministerioId,
      profile_id: profileId,
      capacidad_id: capacidadId,
      origen: acceso.origen,
      confirmada_por: acceso.userId,
      updated_at: new Date().toISOString(),
    })))
    if (error) fail(error.message)
  }

  revalidar(ministerioId)
  return { profileId, capacidades: seleccionadas }
}

export async function cambiarDisponibilidadFuncionMiembro(ministerioId: string, formData: FormData) {
  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  const activo = String(formData.get('activo') || '') === 'true'
  if (!profileId || !capacidadId) fail('Selecciona una persona y una función válidas.')
  const data = new FormData()
  if (activo) data.append('capacidad_id', capacidadId)

  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para administrar funciones de este ministerio.')
  const admin = createAdminClient() as any
  const { data: actuales = [] } = await admin.from('ministerio_miembro_capacidades').select('capacidad_id').eq('ministerio_id', ministerioId).eq('profile_id', profileId)
  const ids = new Set((actuales as any[]).map((row: any) => String(row.capacidad_id)))
  if (activo) ids.add(capacidadId); else ids.delete(capacidadId)
  const batch = new FormData(); for (const id of ids) batch.append('capacidad_id', id)
  return guardarDisponibilidadPersonaMinisterial(ministerioId, profileId, batch)
}

export async function asignarFuncionEquipoMinisterial(ministerioId: string, eventoId: string, formData: FormData) {
  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  if (!profileId || !capacidadId) fail('Selecciona una persona y una función válidas.')
  const admin = createAdminClient() as any
  const { data: actuales = [] } = await admin.from('evento_asignaciones').select('capacidad_id').eq('evento_id', eventoId).eq('ministerio_id', ministerioId).eq('profile_id', profileId)
  const batch = new FormData(); for (const row of actuales as any[]) if (row.capacidad_id) batch.append('capacidad_id', String(row.capacidad_id)); batch.append('capacidad_id', capacidadId)
  return guardarEquipoPersonaServicio(ministerioId, eventoId, profileId, batch)
}

export async function quitarFuncionEquipoMinisterial(ministerioId: string, eventoId: string, formData: FormData) {
  const asignacionId = String(formData.get('asignacion_id') || '')
  if (!asignacionId) fail('Asignación inválida.')
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')
  await asegurarAsignacionesSinHistorial(admin, [asignacionId])
  const { error } = await admin.from('evento_asignaciones').delete().eq('id', asignacionId).eq('evento_id', eventoId).eq('ministerio_id', ministerioId)
  if (error) fail(error.message)
  revalidar(ministerioId)
}