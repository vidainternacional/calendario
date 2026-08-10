'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoProgramacion = { userId: string; puedeProgramar: boolean; puedePaleta: boolean }

function fail(message: string): never {
  throw new Error(message)
}

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
    const ids = responsabilidades.map((item: any) => item.responsabilidad_id)
    const { data: paleta } = await admin
      .from('ministerio_responsabilidades')
      .select('id')
      .in('id', ids)
      .eq('codigo', 'paleta_colores')
      .eq('activo', true)
      .limit(1)
    tienePaleta = (paleta || []).length > 0
  }

  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  return { userId: user.id, puedeProgramar, puedePaleta: puedeProgramar || tienePaleta }
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const { data } = await admin
    .from('eventos')
    .select('id')
    .eq('id', eventoId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()
  return !!data
}

function revalidarProgramacion(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}`)
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
  const { data: existente } = await admin
    .from('ministerio_capacidades')
    .select('id')
    .eq('ministerio_id', ministerioId)
    .ilike('nombre', nombre)
    .maybeSingle()
  if (existente) fail('Ya existe una función con ese nombre.')

  const { data: ultima } = await admin
    .from('ministerio_capacidades')
    .select('orden')
    .eq('ministerio_id', ministerioId)
    .order('orden', { ascending: false })
    .limit(1)
  const orden = Number(ultima?.[0]?.orden || 0) + 10

  const { error } = await admin.from('ministerio_capacidades').insert({
    ministerio_id: ministerioId,
    nombre,
    categoria,
    orden,
    activo: true,
    creado_por: acceso.userId,
  })
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
  const { error } = await admin
    .from('ministerio_capacidades')
    .update({ nombre, categoria, updated_at: new Date().toISOString() })
    .eq('id', funcionId)
    .eq('ministerio_id', ministerioId)
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
  const { error } = await admin
    .from('ministerio_capacidades')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', funcionId)
    .eq('ministerio_id', ministerioId)
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

  const { error } = await admin.from('evento_asignaciones').upsert({
    evento_id: eventoId,
    profile_id: profileId,
    capacidad_id: capacidadId,
    asignado_por: acceso.userId,
    estado: 'asignado',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'evento_id,profile_id' })
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

function texto(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

async function siguienteOrden(admin: any, eventoId: string) {
  const { count } = await admin
    .from('evento_repertorio')
    .select('id', { count: 'exact', head: true })
    .eq('evento_id', eventoId)
  return count ?? 0
}

async function insertarEnRepertorio(
  admin: any,
  acceso: AccesoProgramacion,
  eventoId: string,
  cancion: any,
  tonalidad: string | null,
  notas: string | null,
) {
  const orden = await siguienteOrden(admin, eventoId)
  const { error } = await admin.from('evento_repertorio').insert({
    evento_id: eventoId,
    cancion_id: cancion.id,
    orden,
    titulo: cancion.titulo,
    tonalidad,
    spotify_url: cancion.spotify_url || null,
    youtube_url: cancion.youtube_url || null,
    notas,
    creado_por: acceso.userId,
  })
  if (error) fail(error.message)
}

export async function agregarCancionBibliotecaAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')

  const cancionId = texto(formData, 'cancion_id')
  const tonalidad = texto(formData, 'tonalidad') || null
  if (!cancionId) fail('Selecciona una canción de la biblioteca.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')

  const { data: cancion } = await admin
    .from('ministerio_canciones')
    .select('id,titulo,spotify_url,youtube_url,activo')
    .eq('id', cancionId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()
  if (!cancion || cancion.activo !== true) fail('La canción ya no está disponible en la biblioteca.')

  const { data: yaExiste } = await admin
    .from('evento_repertorio')
    .select('id')
    .eq('evento_id', eventoId)
    .eq('cancion_id', cancionId)
    .maybeSingle()
  if (yaExiste) fail('Esa canción ya está en el repertorio de este servicio.')

  await insertarEnRepertorio(admin, acceso, eventoId, cancion, tonalidad, null)
  revalidarProgramacion(ministerioId)
}

export async function agregarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')

  const titulo = texto(formData, 'titulo')
  const artista = texto(formData, 'artista') || null
  const tonalidad = texto(formData, 'tonalidad') || null
  const spotifyUrl = texto(formData, 'spotify_url') || null
  const youtubeUrl = texto(formData, 'youtube_url') || null
  const notas = texto(formData, 'notas') || null
  if (!titulo) fail('Escribe el título de la canción.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')

  let { data: cancion } = await admin
    .from('ministerio_canciones')
    .select('id,titulo,spotify_url,youtube_url,activo')
    .eq('ministerio_id', ministerioId)
    .ilike('titulo', titulo)
    .maybeSingle()

  if (!cancion) {
    const { data: creada, error } = await admin
      .from('ministerio_canciones')
      .insert({
        ministerio_id: ministerioId,
        titulo,
        artista,
        spotify_url: spotifyUrl,
        youtube_url: youtubeUrl,
        activo: true,
        creado_por: acceso.userId,
      })
      .select('id,titulo,spotify_url,youtube_url,activo')
      .single()
    if (error || !creada) fail(error?.message || 'No fue posible guardar la canción en la biblioteca.')
    cancion = creada
  } else if (cancion.activo !== true) {
    const { data: reactivada, error } = await admin
      .from('ministerio_canciones')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', cancion.id)
      .select('id,titulo,spotify_url,youtube_url,activo')
      .single()
    if (error || !reactivada) fail(error?.message || 'No fue posible reactivar la canción.')
    cancion = reactivada
  }

  const { data: yaExiste } = await admin
    .from('evento_repertorio')
    .select('id')
    .eq('evento_id', eventoId)
    .eq('cancion_id', cancion.id)
    .maybeSingle()
  if (yaExiste) fail('Esa canción ya está en el repertorio de este servicio.')

  await insertarEnRepertorio(admin, acceso, eventoId, cancion, tonalidad, notas)
  revalidarProgramacion(ministerioId)
}

export async function actualizarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')

  const repertorioId = texto(formData, 'repertorio_id') || texto(formData, 'cancion_id')
  const titulo = texto(formData, 'titulo')
  const tonalidad = texto(formData, 'tonalidad') || null
  const spotifyUrl = texto(formData, 'spotify_url') || null
  const youtubeUrl = texto(formData, 'youtube_url') || null
  const notas = texto(formData, 'notas') || null
  if (!repertorioId || !titulo) fail('Canción inválida.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')

  const { data: fila } = await admin
    .from('evento_repertorio')
    .select('id,cancion_id')
    .eq('id', repertorioId)
    .eq('evento_id', eventoId)
    .maybeSingle()
  if (!fila) fail('La canción ya no está en este repertorio.')

  if (fila.cancion_id) {
    const { error: bibliotecaError } = await admin
      .from('ministerio_canciones')
      .update({
        titulo,
        spotify_url: spotifyUrl,
        youtube_url: youtubeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fila.cancion_id)
      .eq('ministerio_id', ministerioId)
    if (bibliotecaError) fail(bibliotecaError.message)
  }

  const { error } = await admin
    .from('evento_repertorio')
    .update({
      titulo,
      tonalidad,
      spotify_url: spotifyUrl,
      youtube_url: youtubeUrl,
      notas,
      updated_at: new Date().toISOString(),
    })
    .eq('id', repertorioId)
    .eq('evento_id', eventoId)
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}

export async function eliminarCancionAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para editar el repertorio.')

  const repertorioId = texto(formData, 'repertorio_id') || texto(formData, 'cancion_id')
  if (!repertorioId) fail('Canción inválida.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')

  const { error } = await admin.from('evento_repertorio').delete().eq('id', repertorioId).eq('evento_id', eventoId)
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}

export async function guardarPaletaAlabanza(ministerioId: string, eventoId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedePaleta) fail('No tienes permiso para editar la paleta de este servicio.')

  const colores = ['color_1', 'color_2', 'color_3', 'color_4', 'color_5']
    .map((key) => String(formData.get(key) || '').trim())
    .filter((value) => /^#[0-9a-fA-F]{6}$/.test(value))
  if (colores.length < 2) fail('Selecciona al menos dos colores válidos.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no pertenece a este ministerio.')

  const { error } = await admin.from('evento_paletas').upsert({
    evento_id: eventoId,
    colores,
    observaciones: texto(formData, 'observaciones') || null,
    referencia_url: texto(formData, 'referencia_url') || null,
    actualizado_por: acceso.userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'evento_id' })
  if (error) fail(error.message)
  revalidarProgramacion(ministerioId)
}
