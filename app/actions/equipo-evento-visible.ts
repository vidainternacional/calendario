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

export type EquipoEventoVisible = {
  eventoId: string
  ministerioIds: string[]
  misFunciones: string[]
  miEstado: EstadoEquipoEvento | null
  equipo: MiembroEquipoEvento[]
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
    // Un servidor ve únicamente el equipo de los ministerios en los que está
    // programado para este mismo evento.
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

  const [profilesReq, capacidadesReq] = await Promise.all([
    profileIds.length
      ? admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    capacidadIds.length
      ? admin.from('ministerio_capacidades').select('id,nombre').in('id', capacidadIds)
      : Promise.resolve({ data: [] }),
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

  const yo = equipo.find((item) => item.esYo) || null

  return {
    eventoId,
    ministerioIds: ministeriosVisibles,
    misFunciones: yo?.funciones || [],
    miEstado: yo?.estado || null,
    equipo,
  }
}
