'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoProgramacion = { userId: string; puedeProgramar: boolean; puedePaleta: boolean }

function fail(message: string): never { throw new Error(message) }

async function obtenerAcceso(ministerioId: string): Promise<AccesoProgramacion | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }, { data: responsabilidades }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_responsabilidad_asignaciones').select('responsabilidad_id').eq('profile_id', user.id),
  ])
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null
  let tienePaleta = false
  if ((responsabilidades || []).length > 0) {
    const ids = responsabilidades.map((r: any) => r.responsabilidad_id)
    const { data: paleta } = await admin.from('ministerio_responsabilidades').select('id').in('id', ids).eq('codigo', 'paleta_colores').eq('activo', true).limit(1)
    tienePaleta = (paleta || []).length > 0
  }
  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  return { userId: user.id, puedeProgramar, puedePaleta: puedeProgramar || tienePaleta }
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const { data } = await admin.from('eventos').select('id').eq('id', eventoId).eq('ministerio_id', ministerioId).maybeSingle()
  return !!data
}

export async function asignarServidorAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')
  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  if (!profileId || !capacidadId) fail('Selecciona una persona compatible.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const [{ data: membresia }, { data: capacidadAsignada }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).eq('capacidad_id', capacidadId).maybeSingle(),
  ])
  if (!membresia || !capacidadAsignada) fail('La persona ya no tiene esa capacidad oficial.')
  const { error } = await admin.from('evento_asignaciones').upsert({ evento_id: eventoId, profile_id: profileId, capacidad_id: capacidadId, asignado_por: acceso.userId, estado: 'asignado', updated_at: new Date().toISOString() }, { onConflict: 'evento_id,profile_id' })
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function quitarServidorAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')
  const asignacionId = String(formData.get('asignacion_id') || '')
  if (!asignacionId) fail('Asignación inválida.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { error } = await admin.from('evento_asignaciones').delete().eq('id', asignacionId).eq('evento_id', eventoId)
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function agregarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')
  const titulo = String(formData.get('titulo') || '').trim()
  if (!titulo) fail('Escribe el título de la canción.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { count } = await admin.from('evento_repertorio').select('id', { count: 'exact', head: true }).eq('evento_id', eventoId)
  const { error } = await admin.from('evento_repertorio').insert({ evento_id: eventoId, orden: count ?? 0, titulo, tonalidad: String(formData.get('tonalidad') || '').trim() || null, enlace: String(formData.get('enlace') || '').trim() || null, notas: String(formData.get('notas') || '').trim() || null, creado_por: acceso.userId })
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function actualizarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')
  const cancionId = String(formData.get('cancion_id') || '')
  const titulo = String(formData.get('titulo') || '').trim()
  if (!cancionId || !titulo) fail('Canción inválida.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { error } = await admin.from('evento_repertorio').update({ titulo, tonalidad: String(formData.get('tonalidad') || '').trim() || null, enlace: String(formData.get('enlace') || '').trim() || null, notas: String(formData.get('notas') || '').trim() || null, updated_at: new Date().toISOString() }).eq('id', cancionId).eq('evento_id', eventoId)
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function eliminarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')
  const cancionId = String(formData.get('cancion_id') || '')
  if (!cancionId) fail('Canción inválida.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { error } = await admin.from('evento_repertorio').delete().eq('id', cancionId).eq('evento_id', eventoId)
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function guardarPaletaAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedePaleta) fail('No tienes permiso para editar la paleta de este servicio.')
  const colores = ['color_1','color_2','color_3','color_4'].map((key) => String(formData.get(key) || '').trim()).filter(Boolean)
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { error } = await admin.from('evento_paletas').upsert({ evento_id: eventoId, colores, observaciones: String(formData.get('observaciones') || '').trim() || null, referencia_url: String(formData.get('referencia_url') || '').trim() || null, actualizado_por: acceso.userId, updated_at: new Date().toISOString() }, { onConflict: 'evento_id' })
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}
