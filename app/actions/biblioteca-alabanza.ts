'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function accesoLider(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }, { data: ministerio }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerios').select('id,nombre').eq('id', ministerioId).maybeSingle(),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null
  if (!ministerio || String(ministerio.nombre || '').trim().toLowerCase() !== 'alabanza') return null
  if (profile.rol !== 'administrador' && membresia?.es_lider !== true) return null
  return { userId: user.id, admin }
}

function limpio(value: unknown, max = 30000) {
  return String(value ?? '').trim().slice(0, max)
}

function revalidar(ministerioId: string) {
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/biblioteca-alabanza`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/setlist`)
}

export async function listarBibliotecaAlabanza(ministerioId: string) {
  const acceso = await accesoLider(ministerioId)
  if (!acceso) return []

  const { admin } = acceso
  const [songsReq, historyReq] = await Promise.all([
    admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url,activo,tonalidad_base,acordes,letra,notas_permanentes,created_at')
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

  type Item = {
    id: string
    titulo: string
    artista: string | null
    spotify_url: string | null
    youtube_url: string | null
    tonalidad_base: string | null
    acordes: string | null
    letra: string | null
    notas_permanentes: string | null
    tonalidades: string[]
    ultimaTonalidad: string | null
    recuperada?: boolean
  }

  const byId = new Map<string, Item>()
  const byTitle = new Map<string, Item>()
  const keyOf = (value: unknown) => String(value || '').trim().toLocaleLowerCase('es')

  for (const song of songsReq.data || []) {
    const item: Item = {
      id: String(song.id),
      titulo: String(song.titulo || 'Canción'),
      artista: song.artista || null,
      spotify_url: song.spotify_url || null,
      youtube_url: song.youtube_url || null,
      tonalidad_base: song.tonalidad_base || null,
      acordes: song.acordes || null,
      letra: song.letra || null,
      notas_permanentes: song.notas_permanentes || null,
      tonalidades: [],
      ultimaTonalidad: null,
    }
    byId.set(item.id, item)
    const key = keyOf(item.titulo)
    if (key && !byTitle.has(key)) byTitle.set(key, item)
  }

  for (const row of historyReq.data || []) {
    const songId = row.cancion_id ? String(row.cancion_id) : ''
    const title = String(row.titulo || '').trim()
    const key = keyOf(title)
    let item = (songId && byId.get(songId)) || (key && byTitle.get(key)) || null

    if (!item && title && row.id) {
      item = {
        id: `hist:${String(row.id)}`,
        titulo: title,
        artista: null,
        spotify_url: row.spotify_url || null,
        youtube_url: row.youtube_url || null,
        tonalidad_base: row.tonalidad || null,
        acordes: null,
        letra: null,
        notas_permanentes: null,
        tonalidades: [],
        ultimaTonalidad: row.tonalidad || null,
        recuperada: true,
      }
      byTitle.set(key, item)
    }

    if (!item) continue
    const tone = String(row.tonalidad || '').trim()
    if (tone && !item.tonalidades.some((value) => value.toLowerCase() === tone.toLowerCase())) {
      item.tonalidades.push(tone)
      if (!item.ultimaTonalidad) item.ultimaTonalidad = tone
    }
    if (!item.spotify_url && row.spotify_url) item.spotify_url = row.spotify_url
    if (!item.youtube_url && row.youtube_url) item.youtube_url = row.youtube_url
  }

  return Array.from(byTitle.values()).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }))
}

export async function guardarCancionBibliotecaAlabanza(
  ministerioId: string,
  input: {
    id?: string
    titulo: string
    artista?: string
    tonalidadBase?: string
    letra?: string
    acordes?: string
    notasPermanentes?: string
    spotifyUrl?: string
    youtubeUrl?: string
  },
) {
  try {
    const acceso = await accesoLider(ministerioId)
    if (!acceso) return { success: false, error: 'Solo el líder autorizado puede editar la biblioteca.' }

    const { admin, userId } = acceso
    const titulo = limpio(input.titulo, 180)
    if (!titulo) return { success: false, error: 'Escribe el nombre de la canción.' }

    const payload = {
      titulo,
      artista: limpio(input.artista, 180) || null,
      tonalidad_base: limpio(input.tonalidadBase, 20) || null,
      letra: limpio(input.letra, 50000) || null,
      acordes: limpio(input.acordes, 50000) || null,
      notas_permanentes: limpio(input.notasPermanentes, 12000) || null,
      spotify_url: limpio(input.spotifyUrl, 1000) || null,
      youtube_url: limpio(input.youtubeUrl, 1000) || null,
      activo: true,
      updated_at: new Date().toISOString(),
    }

    if (input.id) {
      const { error } = await admin
        .from('ministerio_canciones')
        .update(payload)
        .eq('id', input.id)
        .eq('ministerio_id', ministerioId)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('ministerio_canciones').insert({
        ministerio_id: ministerioId,
        creado_por: userId,
        ...payload,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidar(ministerioId)
    return { success: true }
  } catch (error) {
    console.error('[biblioteca-alabanza] guardar', error)
    return { success: false, error: 'No fue posible guardar la canción.' }
  }
}

export async function archivarCancionBibliotecaAlabanza(ministerioId: string, cancionId: string) {
  try {
    const acceso = await accesoLider(ministerioId)
    if (!acceso) return { success: false, error: 'No tienes permiso para cambiar la biblioteca.' }

    const { error } = await acceso.admin
      .from('ministerio_canciones')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', cancionId)
      .eq('ministerio_id', ministerioId)

    if (error) return { success: false, error: error.message }
    revalidar(ministerioId)
    return { success: true }
  } catch (error) {
    console.error('[biblioteca-alabanza] archivar', error)
    return { success: false, error: 'No fue posible retirar la canción.' }
  }
}
