'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export type EstadoEquipoEvento = 'pendiente' | 'confirmado' | 'no_disponible'

export type MiembroEquipoEvento = {
  profileId: string
  nombre: string
  avatarUrl: string | null
  funciones: string[]
  estado: EstadoEquipoEvento
  esYo: boolean
}

export type RepertorioEventoVisible = {
  id: string
  ministerioId: string
  orden: number
  titulo: string
  artista: string | null
  tonalidad: string | null
  enlace: string | null
  notas: string | null
  spotifyUrl: string | null
  youtubeUrl: string | null
}

export type PaletaEventoVisible = {
  id: string
  ministerioId: string
  colores: string[]
  observaciones: string | null
  referenciaUrl: string | null
}

export type EquipoEventoVisible = {
  eventoId: string
  ministerioIds: string[]
  ministerioIdRespuesta: string | null
  misFunciones: string[]
  miEstado: EstadoEquipoEvento | null
  equipo: MiembroEquipoEvento[]
  repertorio: RepertorioEventoVisible[]
  paletas: PaletaEventoVisible[]
}

function normalizarEstado(estados: string[]): EstadoEquipoEvento {
  if (estados.some((estado) => estado === 'no_disponible' || estado === 'declinado')) return 'no_disponible'
  if (estados.length > 0 && estados.every((estado) => estado === 'confirmado')) return 'confirmado'
  return 'pendiente'
}

export async function obtenerEquipoVisibleEvento(eventoId: string): Promise<EquipoEventoVisible | null> {
  if (!/^[0-9a-f-]{36}$/i.test(eventoId)) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: asignaciones = [] }] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('rol,activo,estado_cuenta')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('evento_asignaciones')
      .select('id,profile_id,ministerio_id,capacidad_id,estado')
      .eq('evento_id', eventoId),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null
  if (!asignaciones.length) return null

  const ministerioIdsEvento = Array.from(new Set(
    (asignaciones as any[])
      .map((row) => String(row.ministerio_id || ''))
      .filter(Boolean),
  ))

  const ministeriosPropios = Array.from(new Set(
    (asignaciones as any[])
      .filter((row) => String(row.profile_id) === user.id)
      .map((row) => String(row.ministerio_id || ''))
      .filter(Boolean),
  ))

  const esAdminPastor = profile.rol === 'administrador' || profile.rol === 'pastor'
  let ministeriosVisibles: string[] = []

  if (esAdminPastor) {
    ministeriosVisibles = ministerioIdsEvento
  } else if (ministeriosPropios.length > 0) {
    // Un servidor ve únicamente el equipo y la preparación de los ministerios
    // en los que está programado para este mismo evento.
    ministeriosVisibles = ministeriosPropios
  } else if (ministerioIdsEvento.length > 0) {
    const { data: liderazgos = [] } = await (supabase as any)
      .from('ministerio_miembros')
      .select('ministerio_id')
      .eq('profile_id', user.id)
      .eq('es_lider', true)
      .in('ministerio_id', ministerioIdsEvento)

    ministeriosVisibles = Array.from(new Set(
      (liderazgos as any[]).map((row) => String(row.ministerio_id || '')).filter(Boolean),
    ))
  }

  if (ministeriosVisibles.length === 0) return null

  const asignacionesVisibles = (asignaciones as any[]).filter((row) =>
    ministeriosVisibles.includes(String(row.ministerio_id || '')),
  )
  if (asignacionesVisibles.length === 0) return null

  const profileIds = Array.from(new Set(
    asignacionesVisibles.map((row) => String(row.profile_id || '')).filter(Boolean),
  ))
  const capacidadIds = Array.from(new Set(
    asignacionesVisibles.map((row) => String(row.capacidad_id || '')).filter(Boolean),
  ))

  const [profilesReq, capacidadesReq, repertorioReq, paletasReq] = await Promise.all([
    profileIds.length
      ? admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    capacidadIds.length
      ? admin.from('ministerio_capacidades').select('id,nombre').in('id', capacidadIds)
      : Promise.resolve({ data: [] }),
    admin
      .from('evento_repertorio')
      .select('id,ministerio_id,orden,titulo,tonalidad,enlace,notas,spotify_url,youtube_url,cancion_id')
      .eq('evento_id', eventoId)
      .in('ministerio_id', ministeriosVisibles)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('evento_paletas')
      .select('id,ministerio_id,colores,observaciones,referencia_url,updated_at')
      .eq('evento_id', eventoId)
      .in('ministerio_id', ministeriosVisibles)
      .order('updated_at', { ascending: false }),
  ])

  const profilesMap = new Map(
    ((profilesReq.data || []) as any[])
      .filter((row) => row.activo === true && row.estado_cuenta === 'activo')
      .map((row) => [String(row.id), row]),
  )
  const capacidadesMap = new Map(
    ((capacidadesReq.data || []) as any[]).map((row) => [String(row.id), String(row.nombre || 'Función')]),
  )

  const agrupados = new Map<string, { funciones: string[]; estados: string[] }>()
  for (const row of asignacionesVisibles) {
    const profileId = String(row.profile_id || '')
    if (!profilesMap.has(profileId)) continue
    const actual = agrupados.get(profileId) || { funciones: [], estados: [] }
    const funcion = row.capacidad_id ? capacidadesMap.get(String(row.capacidad_id)) : null
    if (funcion && !actual.funciones.includes(funcion)) actual.funciones.push(funcion)
    actual.estados.push(String(row.estado || 'asignado'))
    agrupados.set(profileId, actual)
  }

  const equipo: MiembroEquipoEvento[] = Array.from(agrupados.entries())
    .map(([profileId, info]) => {
      const person = profilesMap.get(profileId) as any
      return {
        profileId,
        nombre: String(person?.nombre_completo || 'Servidor'),
        avatarUrl: person?.avatar_url ? String(person.avatar_url) : null,
        funciones: info.funciones,
        estado: normalizarEstado(info.estados),
        esYo: profileId === user.id,
      }
    })
    .sort((a, b) => {
      if (a.esYo !== b.esYo) return a.esYo ? -1 : 1
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    })

  const repertorioRows = (repertorioReq.data || []) as any[]
  const cancionIds = Array.from(new Set(
    repertorioRows.map((row) => String(row.cancion_id || '')).filter(Boolean),
  ))

  const { data: canciones = [] } = cancionIds.length
    ? await admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url')
      .in('id', cancionIds)
    : { data: [] as any[] }

  const cancionesMap = new Map(
    (canciones as any[]).map((row) => [String(row.id), row]),
  )

  const repertorio: RepertorioEventoVisible[] = repertorioRows.map((row) => {
    const cancion = row.cancion_id ? cancionesMap.get(String(row.cancion_id)) as any : null
    return {
      id: String(row.id),
      ministerioId: String(row.ministerio_id),
      orden: Number(row.orden || 0),
      titulo: String(cancion?.titulo || row.titulo || 'Canción'),
      artista: cancion?.artista ? String(cancion.artista) : null,
      tonalidad: row.tonalidad ? String(row.tonalidad) : null,
      enlace: row.enlace ? String(row.enlace) : null,
      notas: row.notas ? String(row.notas) : null,
      spotifyUrl: cancion?.spotify_url
        ? String(cancion.spotify_url)
        : row.spotify_url
          ? String(row.spotify_url)
          : null,
      youtubeUrl: cancion?.youtube_url
        ? String(cancion.youtube_url)
        : row.youtube_url
          ? String(row.youtube_url)
          : null,
    }
  })

  const paletas: PaletaEventoVisible[] = ((paletasReq.data || []) as any[]).map((row) => ({
    id: String(row.id),
    ministerioId: String(row.ministerio_id),
    colores: Array.isArray(row.colores) ? row.colores.map((color: unknown) => String(color)) : [],
    observaciones: row.observaciones ? String(row.observaciones) : null,
    referenciaUrl: row.referencia_url ? String(row.referencia_url) : null,
  }))

  const yo = equipo.find((item) => item.esYo) || null

  return {
    eventoId,
    ministerioIds: ministeriosVisibles,
    ministerioIdRespuesta: ministeriosPropios[0] || null,
    misFunciones: yo?.funciones || [],
    miEstado: yo?.estado || null,
    equipo,
    repertorio,
    paletas,
  }
}
