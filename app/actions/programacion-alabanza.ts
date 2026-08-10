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

function revalidarProgramacion(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
  revalidatePath('/admin/usuarios')
}

export async function crearFuncionMinisterial(ministerioId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('Solo el líder del ministerio puede crear funciones.')
  const nombre = String(formData.get('nombre') || '').trim()
  const categoria = String(formData.get('categoria') || 'Servicio').trim() || 'Servicio'
  if (nombre.length < 2 || nombre.length > 80) fail('Escribe un nombre válido para la función.')
  const admin = createAdminClient() as any
  const { data: existente } = await admin.from('ministerio_capacidades').select('id').eq('ministerio_id', ministerioId).ilike('nombre', nombre).maybeSingle()
  if (existente) fail('Ya existe una función con ese nombre.')
  const { data: ultima } = await admin.from('ministerio_capacidades').select('orden').eq('ministerio_id', ministerioId).order('orden', { ascending: false }).limit(1)
  const orden = Number(ultima?.[0]?.orden || 0) + 10
  const { error } = await admin.from('ministerio_capacidades').insert({ ministerio_id: ministerioId, nombre, categoria, orden, activo: true, creado_por: acceso.userId })
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}

export async function actualizarFuncionMinisterial(ministerioId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('Solo el líder del ministerio puede editar funciones.')
  const funcionId = String(formData.get('funcion_id') || '')
  const nombre = String(formData.get('nombre') || '').trim()
  const categoria = String(formData.get('categoria') || 'Servicio').trim() || 'Servicio'
  if (!funcionId || nombre.length < 2 || nombre.length > 80) fail('Función inválida.')
  const admin = createAdminClient() as any
  const { error } = await admin.from('ministerio_capacidades').update({ nombre, categoria, updated_at: new Date().toISOString() }).eq('id', funcionId).eq('ministerio_id', ministerioId)
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}

export async function cambiarEstadoFuncionMinisterial(ministerioId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('Solo el líder del ministerio puede retirar o reactivar funciones.')
  const funcionId = String(formData.get('funcion_id') || '')
  const activo = String(formData.get('activo') || '') === 'true'
  if (!funcionId) fail('Función inválida.')
  const admin = createAdminClient() as any
  const { error } = await admin.from('ministerio_capacidades').update({ activo, updated_at: new Date().toISOString() }).eq('id', funcionId).eq('ministerio_id', ministerioId)
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}

export async function asignarServidorAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')
  const profileId = String(formData.get('profile_id') || '')
  const capacidadId = String(formData.get('capacidad_id') || '')
  if (!profileId || !capacidadId) fail('Selecciona una persona compatible.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const [{ data: membresia }, { data: capacidadAsignada }, { data: capacidad }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).eq('capacidad_id', capacidadId).maybeSingle(),
    admin.from('ministerio_capacidades').select('id,activo').eq('id', capacidadId).eq('ministerio_id', ministerioId).maybeSingle(),
  ])
  if (!membresia || !capacidadAsignada || capacidad?.activo !== true) fail('La persona ya no tiene esa función activa.')
  const { error } = await admin.from('evento_asignaciones').upsert({ evento_id: eventoId, profile_id: profileId, capacidad_id: capacidadId, asignado_por: acceso.userId, estado: 'asignado', updated_at: new Date().toISOString() }, { onConflict: 'evento_id,profile_id' })
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
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
  revalidarProgramacion(ministerioId)
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
  revalidarProgramacion(ministerioId)
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
  revalidarProgramacion(ministerioId)
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
  revalidarProgramacion(ministerioId)
}

export async function guardarPaletaAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedePaleta) fail('No tienes permiso para editar la paleta de este servicio.')
  const colores = ['color_1','color_2','color_3','color_4','color_5'].map((key) => String(formData.get(key) || '').trim()).filter((value) => /^#[0-9a-fA-F]{6}$/.test(value))
  if (colores.length < 2) fail('Selecciona al menos dos colores válidos.')
  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')
  const { error } = await admin.from('evento_paletas').upsert({ evento_id: eventoId, colores, observaciones: String(formData.get('observaciones') || '').trim() || null, referencia_url: String(formData.get('referencia_url') || '').trim() || null, actualizado_por: acceso.userId, updated_at: new Date().toISOString() }, { onConflict: 'evento_id' })
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}
