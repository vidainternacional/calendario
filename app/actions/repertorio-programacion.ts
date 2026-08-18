'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function fail(message: string): never {
  throw new Error(message)
}

async function obtenerAcceso(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null
  const puedeProgramar = profile.rol === 'administrador' || membresia?.es_lider === true
  return puedeProgramar ? { userId: user.id } : null
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const { data: calendars = [] } = await admin.from('calendars').select('id').eq('ministerio_id', ministerioId).limit(5)
  const calendarIds = (calendars || []).map((item: any) => String(item.id))
  const [{ data: evento }, { data: links = [] }] = await Promise.all([
    admin.from('eventos').select('id,ministerio_id').eq('id', eventoId).maybeSingle(),
    calendarIds.length
      ? admin.from('evento_calendarios').select('evento_id').eq('evento_id', eventoId).in('calendar_id', calendarIds).limit(1)
      : Promise.resolve({ data: [] }),
  ])
  return Boolean(evento && (String(evento.ministerio_id || '') === ministerioId || (links || []).length > 0))
}

function texto(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function detalleServicio(observacion: string | null, notas: string | null) {
  const partes: string[] = []
  if (observacion) partes.push(`Observación: ${observacion}`)
  if (notas) partes.push(`Notas: ${notas}`)
  return partes.length ? partes.join('\n') : null
}

function claveTitulo(value: unknown) {
  return String(value || '').trim().toLocaleLowerCase('es')
}

async function siguienteOrden(admin: any, ministerioId: string, eventoId: string) {
  const { count } = await admin
    .from('evento_repertorio')
    .select('id', { count: 'exact', head: true })
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)
  return count ?? 0
}

function revalidar(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}`)
}

export async function obtenerBibliotecaRepertorioMinisterio(ministerioId: string) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso) return []

  const admin = createAdminClient() as any
  const [songsReq, historyReq] = await Promise.all([
    admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url,activo,created_at')
      .eq('ministerio_id', ministerioId)
      .eq('activo', true)
      .order('titulo')
      .limit(500),
    admin
      .from('evento_repertorio')
      .select('id,cancion_id,titulo,tonalidad,spotify_url,youtube_url,created_at')
      .eq('ministerio_id', ministerioId)
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  if (songsReq.error) throw songsReq.error
  if (historyReq.error) throw historyReq.error

  type BibliotecaItem = {
    id: string
    titulo: string
    artista: string | null
    spotify_url: string | null
    youtube_url: string | null
    tonalidades: string[]
    ultimaTonalidad: string | null
    recuperada?: boolean
  }

  const porId = new Map<string, BibliotecaItem>()
  const porTitulo = new Map<string, BibliotecaItem>()

  for (const song of songsReq.data || []) {
    const item: BibliotecaItem = {
      id: String(song.id),
      titulo: String(song.titulo || 'Canción'),
      artista: song.artista || null,
      spotify_url: song.spotify_url || null,
      youtube_url: song.youtube_url || null,
      tonalidades: [],
      ultimaTonalidad: null,
    }
    porId.set(item.id, item)
    const key = claveTitulo(item.titulo)
    if (key && !porTitulo.has(key)) porTitulo.set(key, item)
  }

  for (const row of historyReq.data || []) {
    const tone = String(row.tonalidad || '').trim()
    const songId = row.cancion_id ? String(row.cancion_id) : ''
    const title = String(row.titulo || '').trim()
    const titleKey = claveTitulo(title)
    let item = (songId && porId.get(songId)) || (titleKey && porTitulo.get(titleKey)) || null

    if (!item && title && row.id) {
      item = {
        id: `hist:${String(row.id)}`,
        titulo: title,
        artista: null,
        spotify_url: row.spotify_url || null,
        youtube_url: row.youtube_url || null,
        tonalidades: [],
        ultimaTonalidad: null,
        recuperada: true,
      }
      porTitulo.set(titleKey, item)
    }

    if (!item) continue
    if (!item.spotify_url && row.spotify_url) item.spotify_url = row.spotify_url
    if (!item.youtube_url && row.youtube_url) item.youtube_url = row.youtube_url
    if (tone && !item.tonalidades.some((value) => value.toLocaleLowerCase('es') === tone.toLocaleLowerCase('es'))) {
      item.tonalidades.push(tone)
      if (!item.ultimaTonalidad) item.ultimaTonalidad = tone
    }
  }

  return Array.from(porTitulo.values())
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }))
}

async function materializarCancionHistorica(
  admin: any,
  acceso: { userId: string },
  ministerioId: string,
  historicalId: string,
) {
  const { data: legacy } = await admin
    .from('evento_repertorio')
    .select('id,titulo,spotify_url,youtube_url')
    .eq('id', historicalId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()

  const titulo = String(legacy?.titulo || '').trim()
  if (!legacy || !titulo) fail('La canción histórica ya no está disponible.')

  const { data: existentes = [] } = await admin
    .from('ministerio_canciones')
    .select('id,titulo,artista,spotify_url,youtube_url,activo')
    .eq('ministerio_id', ministerioId)
    .ilike('titulo', titulo)
    .limit(1)

  let cancion = existentes?.[0] || null
  if (!cancion) {
    const { data: creada, error } = await admin
      .from('ministerio_canciones')
      .insert({
        ministerio_id: ministerioId,
        titulo,
        artista: null,
        spotify_url: legacy.spotify_url || null,
        youtube_url: legacy.youtube_url || null,
        activo: true,
        creado_por: acceso.userId,
      })
      .select('id,titulo,artista,spotify_url,youtube_url,activo')
      .single()
    if (error || !creada) fail(error?.message || 'No fue posible recuperar la canción en la biblioteca.')
    return creada
  }

  if (cancion.activo !== true || (!cancion.spotify_url && legacy.spotify_url) || (!cancion.youtube_url && legacy.youtube_url)) {
    const { data: actualizada, error } = await admin
      .from('ministerio_canciones')
      .update({
        activo: true,
        spotify_url: cancion.spotify_url || legacy.spotify_url || null,
        youtube_url: cancion.youtube_url || legacy.youtube_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cancion.id)
      .eq('ministerio_id', ministerioId)
      .select('id,titulo,artista,spotify_url,youtube_url,activo')
      .single()
    if (error || !actualizada) fail(error?.message || 'No fue posible reactivar la canción histórica.')
    cancion = actualizada
  }

  return cancion
}

export async function agregarCancionExistenteCompleta(ministerioId: string, eventoId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso) fail('No tienes permiso para editar el repertorio.')

  const cancionId = texto(formData, 'cancion_id')
  const tonalidad = texto(formData, 'tonalidad') || null
  const observacion = texto(formData, 'observacion') || null
  const notas = texto(formData, 'notas') || null
  if (!cancionId) fail('Selecciona una canción de la biblioteca.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  let cancion: any = null
  if (cancionId.startsWith('hist:')) {
    cancion = await materializarCancionHistorica(admin, acceso, ministerioId, cancionId.slice(5))
  } else {
    const { data } = await admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url,activo')
      .eq('id', cancionId)
      .eq('ministerio_id', ministerioId)
      .maybeSingle()
    cancion = data
  }

  if (!cancion || cancion.activo !== true) fail('La canción ya no está disponible en la biblioteca.')

  const { data: yaExiste } = await admin
    .from('evento_repertorio')
    .select('id')
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)
    .eq('cancion_id', cancion.id)
    .maybeSingle()
  if (yaExiste) fail('Esa canción ya está en el repertorio de este servicio.')

  const orden = await siguienteOrden(admin, ministerioId, eventoId)
  const { error } = await admin.from('evento_repertorio').insert({
    evento_id: eventoId,
    ministerio_id: ministerioId,
    cancion_id: cancion.id,
    orden,
    titulo: cancion.titulo,
    tonalidad,
    spotify_url: cancion.spotify_url || null,
    youtube_url: cancion.youtube_url || null,
    notas: detalleServicio(observacion, notas),
    creado_por: acceso.userId,
  })

  if (error) fail(error.message)
  revalidar(ministerioId)
}

export async function crearCancionCompletaYAgregar(ministerioId: string, eventoId: string, formData: FormData) {
  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso) fail('No tienes permiso para editar el repertorio.')

  const titulo = texto(formData, 'titulo')
  const artista = texto(formData, 'artista') || null
  const tonalidad = texto(formData, 'tonalidad') || null
  const observacion = texto(formData, 'observacion') || null
  const notas = texto(formData, 'notas') || null
  const spotifyUrl = texto(formData, 'spotify_url') || null
  const youtubeUrl = texto(formData, 'youtube_url') || null
  if (!titulo) fail('Escribe el nombre de la canción.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  let { data: cancion } = await admin
    .from('ministerio_canciones')
    .select('id,titulo,artista,spotify_url,youtube_url,activo')
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
      .select('id,titulo,artista,spotify_url,youtube_url,activo')
      .single()
    if (error || !creada) fail(error?.message || 'No fue posible guardar la canción en la biblioteca.')
    cancion = creada
  } else {
    const { data: actualizada, error } = await admin
      .from('ministerio_canciones')
      .update({
        artista: artista || cancion.artista,
        spotify_url: spotifyUrl || cancion.spotify_url,
        youtube_url: youtubeUrl || cancion.youtube_url,
        activo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cancion.id)
      .eq('ministerio_id', ministerioId)
      .select('id,titulo,artista,spotify_url,youtube_url,activo')
      .single()
    if (error || !actualizada) fail(error?.message || 'No fue posible actualizar la canción.')
    cancion = actualizada
  }

  const { data: yaExiste } = await admin
    .from('evento_repertorio')
    .select('id')
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)
    .eq('cancion_id', cancion.id)
    .maybeSingle()
  if (yaExiste) fail('Esa canción ya está en el repertorio de este servicio.')

  const orden = await siguienteOrden(admin, ministerioId, eventoId)
  const { error } = await admin.from('evento_repertorio').insert({
    evento_id: eventoId,
    ministerio_id: ministerioId,
    cancion_id: cancion.id,
    orden,
    titulo: cancion.titulo,
    tonalidad,
    spotify_url: cancion.spotify_url || null,
    youtube_url: cancion.youtube_url || null,
    notas: detalleServicio(observacion, notas),
    creado_por: acceso.userId,
  })

  if (error) fail(error.message)
  revalidar(ministerioId)
}
