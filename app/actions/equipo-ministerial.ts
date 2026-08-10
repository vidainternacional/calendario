'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoEquipo = {
  userId: string
  puedeProgramar: boolean
  origen: 'lider' | 'administrador'
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
    admin
      .from('evento_calendarios')
      .select('evento_id')
      .eq('evento_id', eventoId)
      .eq('calendar_id', calendarId)
      .maybeSingle(),
  ])

  return Boolean(evento && (link || String(evento.ministerio_id || '') === ministerioId))
}

function revalidar(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
  revalidatePath('/admin/usuarios')
}

export async function cambiarDisponibilidadFuncionMiembro(ministerioId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para administrar funciones de este ministerio.')

  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  const activo = String(formData.get('activo') || '') === 'true'
  if (!profileId || !capacidadId) fail('Selecciona una persona y una función válidas.')

  const admin = createAdminClient() as any
  const [{ data: membresia }, { data: capacidad }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_capacidades').select('id,activo').eq('ministerio_id', ministerioId).eq('id', capacidadId).maybeSingle(),
  ])

  if (!membresia) fail('La persona ya no pertenece a este ministerio.')
  if (!capacidad || capacidad.activo !== true) fail('Esta función ya no está disponible.')

  if (activo) {
    const { error } = await admin.from('ministerio_miembro_capacidades').upsert({
      ministerio_id: ministerioId,
      profile_id: profileId,
      capacidad_id: capacidadId,
      origen: acceso.origen,
      confirmada_por: acceso.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'ministerio_id,profile_id,capacidad_id' })
    if (error) fail(error.message)
  } else {
    const { error } = await admin
      .from('ministerio_miembro_capacidades')
      .delete()
      .eq('ministerio_id', ministerioId)
      .eq('profile_id', profileId)
      .eq('capacidad_id', capacidadId)
    if (error) fail(error.message)
  }

  revalidar(ministerioId)
  return { profileId, capacidadId, activo }
}

export async function asignarFuncionEquipoMinisterial(ministerioId: string, eventoId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')

  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  if (!profileId || !capacidadId) fail('Selecciona una persona y una función válidas.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  const [{ data: membresia }, { data: disponibilidad }, { data: capacidad }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).eq('capacidad_id', capacidadId).maybeSingle(),
    admin.from('ministerio_capacidades').select('id,activo').eq('ministerio_id', ministerioId).eq('id', capacidadId).maybeSingle(),
  ])

  if (!membresia) fail('La persona ya no pertenece a este ministerio.')
  if (!disponibilidad) fail('Primero habilita esta función para la persona.')
  if (!capacidad || capacidad.activo !== true) fail('Esta función ya no está disponible.')

  const { data: existente } = await admin
    .from('evento_asignaciones')
    .select('id,profile_id,capacidad_id,estado')
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)
    .eq('profile_id', profileId)
    .eq('capacidad_id', capacidadId)
    .maybeSingle()

  if (existente) return existente

  const { data, error } = await admin
    .from('evento_asignaciones')
    .insert({
      evento_id: eventoId,
      profile_id: profileId,
      ministerio_id: ministerioId,
      capacidad_id: capacidadId,
      asignado_por: acceso.userId,
      estado: 'asignado',
      updated_at: new Date().toISOString(),
    })
    .select('id,profile_id,capacidad_id,estado')
    .single()

  if (error) fail(error.message)
  revalidar(ministerioId)
  return data
}

export async function quitarFuncionEquipoMinisterial(ministerioId: string, eventoId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')

  const asignacionId = String(formData.get('asignacion_id') || '')
  if (!asignacionId) fail('Asignación inválida.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  const { error } = await admin
    .from('evento_asignaciones')
    .delete()
    .eq('id', asignacionId)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (error) fail(error.message)
  revalidar(ministerioId)
}
