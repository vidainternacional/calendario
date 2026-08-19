'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export type CandidatoReemplazoMinisterial = {
  profileId: string
  nombre: string
  avatarUrl: string | null
  yaSirve: boolean
  funcionesActuales: string[]
}

export type SolicitudReemplazoMinisterial = {
  intercambioId: string
  asignacionOrigenId: string
  solicitanteId: string
  solicitanteNombre: string
  solicitanteAvatarUrl: string | null
  capacidadId: string
  funcion: string
  createdAt: string
  candidatos: CandidatoReemplazoMinisterial[]
}

export type HistorialReemplazoMinisterial = {
  intercambioId: string
  solicitanteNombre: string
  reemplazoNombre: string | null
  funcion: string
  estado: string
  createdAt: string
  resueltoAt: string | null
}

export type ReemplazosServicioMinisterial = {
  puedeGestionar: boolean
  solicitudes: SolicitudReemplazoMinisterial[]
  historial: HistorialReemplazoMinisterial[]
}

export type ResultadoReemplazoMinisterial = {
  success?: boolean
  error?: string
  asignacionDestinoId?: string
}

type AccesoLider = {
  userId: string
  puedeGestionar: boolean
}

function esUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value)
}

async function obtenerAccesoLider(ministerioId: string): Promise<AccesoLider | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null

  return {
    userId: user.id,
    puedeGestionar: profile.rol === 'administrador' || membresia?.es_lider === true,
  }
}

function revalidar(ministerioId: string, eventoId: string) {
  revalidatePath('/inicio')
  revalidatePath('/intercambios')
  revalidatePath(`/eventos/${eventoId}`)
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

export async function obtenerReemplazosServicioMinisterial(
  ministerioId: string,
  eventoId: string,
): Promise<ReemplazosServicioMinisterial> {
  if (!esUuid(ministerioId) || !esUuid(eventoId)) {
    return { puedeGestionar: false, solicitudes: [], historial: [] }
  }

  const acceso = await obtenerAccesoLider(ministerioId)
  if (!acceso?.puedeGestionar) {
    return { puedeGestionar: false, solicitudes: [], historial: [] }
  }

  const admin = createAdminClient() as any
  const { data: asignaciones = [] } = await admin
    .from('evento_asignaciones')
    .select('id,profile_id,capacidad_id,estado')
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  const asignacionIds = (asignaciones as any[]).map((row) => String(row.id))
  if (!asignacionIds.length) {
    return { puedeGestionar: true, solicitudes: [], historial: [] }
  }

  const { data: intercambios = [] } = await admin
    .from('intercambios')
    .select('id,asignacion_origen_id,asignacion_destino_id,solicitante_id,destinatario_id,estado,created_at,resuelto_at')
    .in('asignacion_origen_id', asignacionIds)
    .order('created_at', { ascending: false })

  const asignacionPorId = new Map((asignaciones as any[]).map((row) => [String(row.id), row]))
  const capacidadIds = Array.from(new Set((asignaciones as any[]).map((row) => String(row.capacidad_id || '')).filter(Boolean)))

  const { data: membresias = [] } = await admin
    .from('ministerio_miembros')
    .select('profile_id')
    .eq('ministerio_id', ministerioId)

  const miembroIds = Array.from(new Set((membresias as any[]).map((row) => String(row.profile_id)).filter(Boolean)))
  const profileIdsRelacionados = Array.from(new Set([
    ...miembroIds,
    ...(intercambios as any[]).flatMap((row) => [String(row.solicitante_id || ''), String(row.destinatario_id || '')]).filter(Boolean),
  ]))

  const [perfilesReq, capacidadesReq, capacidadesMiembroReq] = await Promise.all([
    profileIdsRelacionados.length
      ? admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIdsRelacionados)
      : Promise.resolve({ data: [] }),
    capacidadIds.length
      ? admin.from('ministerio_capacidades').select('id,nombre').in('id', capacidadIds)
      : Promise.resolve({ data: [] }),
    capacidadIds.length && miembroIds.length
      ? admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', ministerioId).in('profile_id', miembroIds).in('capacidad_id', capacidadIds)
      : Promise.resolve({ data: [] }),
  ])

  const perfilesMap = new Map(((perfilesReq.data || []) as any[]).map((row) => [String(row.id), row]))
  const capacidadesMap = new Map(((capacidadesReq.data || []) as any[]).map((row) => [String(row.id), String(row.nombre || 'Función')]))

  const capacidadesPorMiembro = new Map<string, Set<string>>()
  for (const row of (capacidadesMiembroReq.data || []) as any[]) {
    const profileId = String(row.profile_id)
    const set = capacidadesPorMiembro.get(profileId) || new Set<string>()
    set.add(String(row.capacidad_id))
    capacidadesPorMiembro.set(profileId, set)
  }

  const asignacionesPorMiembro = new Map<string, any[]>()
  for (const row of asignaciones as any[]) {
    const profileId = String(row.profile_id)
    asignacionesPorMiembro.set(profileId, [...(asignacionesPorMiembro.get(profileId) || []), row])
  }

  const solicitudes: SolicitudReemplazoMinisterial[] = []
  for (const intercambio of (intercambios as any[]).filter((row) => row.estado === 'pendiente')) {
    const origen = asignacionPorId.get(String(intercambio.asignacion_origen_id)) as any
    if (!origen?.capacidad_id) continue
    if (origen.estado !== 'no_disponible' && origen.estado !== 'declinado') continue

    const capacidadId = String(origen.capacidad_id)
    const solicitanteId = String(intercambio.solicitante_id)
    const solicitante = perfilesMap.get(solicitanteId) as any

    const candidatos = miembroIds
      .filter((profileId) => profileId !== solicitanteId)
      .filter((profileId) => capacidadesPorMiembro.get(profileId)?.has(capacidadId))
      .map((profileId) => {
        const perfil = perfilesMap.get(profileId) as any
        const actuales = asignacionesPorMiembro.get(profileId) || []
        if (!perfil || perfil.activo !== true || perfil.estado_cuenta !== 'activo') return null
        if (actuales.some((row) => row.estado === 'no_disponible' || row.estado === 'declinado')) return null
        if (actuales.some((row) => String(row.capacidad_id || '') === capacidadId)) return null

        const funcionesActuales = Array.from(new Set(
          actuales
            .map((row) => capacidadesMap.get(String(row.capacidad_id || '')))
            .filter((value): value is string => Boolean(value)),
        ))

        return {
          profileId,
          nombre: String(perfil.nombre_completo || 'Integrante'),
          avatarUrl: perfil.avatar_url ? String(perfil.avatar_url) : null,
          yaSirve: actuales.length > 0,
          funcionesActuales,
        } satisfies CandidatoReemplazoMinisterial
      })
      .filter((item): item is CandidatoReemplazoMinisterial => Boolean(item))
      .sort((a, b) => {
        if (a.yaSirve !== b.yaSirve) return a.yaSirve ? 1 : -1
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      })

    solicitudes.push({
      intercambioId: String(intercambio.id),
      asignacionOrigenId: String(origen.id),
      solicitanteId,
      solicitanteNombre: String(solicitante?.nombre_completo || 'Servidor'),
      solicitanteAvatarUrl: solicitante?.avatar_url ? String(solicitante.avatar_url) : null,
      capacidadId,
      funcion: capacidadesMap.get(capacidadId) || 'Función',
      createdAt: String(intercambio.created_at),
      candidatos,
    })
  }

  const historial: HistorialReemplazoMinisterial[] = (intercambios as any[])
    .filter((row) => row.estado !== 'pendiente')
    .map((intercambio) => {
      const origen = asignacionPorId.get(String(intercambio.asignacion_origen_id)) as any
      const solicitante = perfilesMap.get(String(intercambio.solicitante_id || '')) as any
      const reemplazo = perfilesMap.get(String(intercambio.destinatario_id || '')) as any
      return {
        intercambioId: String(intercambio.id),
        solicitanteNombre: String(solicitante?.nombre_completo || 'Servidor'),
        reemplazoNombre: reemplazo?.nombre_completo ? String(reemplazo.nombre_completo) : null,
        funcion: capacidadesMap.get(String(origen?.capacidad_id || '')) || 'Función',
        estado: String(intercambio.estado),
        createdAt: String(intercambio.created_at),
        resueltoAt: intercambio.resuelto_at ? String(intercambio.resuelto_at) : null,
      }
    })

  return { puedeGestionar: true, solicitudes, historial }
}

export async function asignarReemplazoMinisterial(
  ministerioId: string,
  eventoId: string,
  intercambioId: string,
  candidatoId: string,
): Promise<ResultadoReemplazoMinisterial> {
  if (![ministerioId, eventoId, intercambioId, candidatoId].every(esUuid)) {
    return { error: 'Solicitud de reemplazo inválida.' }
  }

  const acceso = await obtenerAccesoLider(ministerioId)
  if (!acceso?.puedeGestionar) return { error: 'No tienes permiso para resolver reemplazos de este ministerio.' }

  const admin = createAdminClient() as any
  const { data: intercambio } = await admin
    .from('intercambios')
    .select('id,asignacion_origen_id,solicitante_id,estado')
    .eq('id', intercambioId)
    .maybeSingle()

  if (!intercambio || intercambio.estado !== 'pendiente') return { error: 'Esta solicitud ya no está pendiente.' }

  const { data: origen } = await admin
    .from('evento_asignaciones')
    .select('id,evento_id,ministerio_id,profile_id,capacidad_id,estado')
    .eq('id', intercambio.asignacion_origen_id)
    .maybeSingle()

  if (!origen || String(origen.evento_id) !== eventoId || String(origen.ministerio_id || '') !== ministerioId) {
    return { error: 'La asignación original ya no pertenece a este servicio.' }
  }
  if (!origen.capacidad_id) return { error: 'La función que debe cubrirse ya no existe.' }
  if (origen.estado !== 'no_disponible' && origen.estado !== 'declinado') {
    return { error: 'La persona original ya no figura como no disponible.' }
  }
  if (String(origen.profile_id) === candidatoId) return { error: 'Selecciona a otra persona para cubrir la función.' }

  const [{ data: membresia }, { data: capacidad }, { data: perfil }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', candidatoId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('capacidad_id').eq('ministerio_id', ministerioId).eq('profile_id', candidatoId).eq('capacidad_id', origen.capacidad_id).maybeSingle(),
    admin.from('profiles').select('activo,estado_cuenta').eq('id', candidatoId).maybeSingle(),
  ])

  if (!membresia || !capacidad || !perfil || perfil.activo !== true || perfil.estado_cuenta !== 'activo') {
    return { error: 'La persona seleccionada ya no está disponible con esa capacidad.' }
  }

  const { data: asignacionesCandidato = [] } = await admin
    .from('evento_asignaciones')
    .select('id,capacidad_id,estado')
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)
    .eq('profile_id', candidatoId)

  if ((asignacionesCandidato as any[]).some((row) => row.estado === 'no_disponible' || row.estado === 'declinado')) {
    return { error: 'La persona seleccionada figura como no disponible para este servicio.' }
  }
  if ((asignacionesCandidato as any[]).some((row) => String(row.capacidad_id || '') === String(origen.capacidad_id))) {
    return { error: 'Esa persona ya está asignada a esta misma función.' }
  }

  const now = new Date().toISOString()
  const { data: destino, error: insertError } = await admin
    .from('evento_asignaciones')
    .insert({
      evento_id: eventoId,
      profile_id: candidatoId,
      ministerio_id: ministerioId,
      capacidad_id: origen.capacidad_id,
      asignado_por: acceso.userId,
      estado: 'pendiente',
      updated_at: now,
    })
    .select('id')
    .single()

  if (insertError || !destino?.id) {
    console.error('[asignarReemplazoMinisterial] crear asignación destino', insertError)
    return { error: 'No se pudo crear la asignación del reemplazo.' }
  }

  const { error: intercambioError } = await admin
    .from('intercambios')
    .update({
      asignacion_destino_id: destino.id,
      destinatario_id: candidatoId,
      estado: 'aceptado',
      resuelto_at: now,
    })
    .eq('id', intercambioId)
    .eq('estado', 'pendiente')

  if (intercambioError) {
    await admin.from('evento_asignaciones').delete().eq('id', destino.id)
    console.error('[asignarReemplazoMinisterial] cerrar intercambio', intercambioError)
    return { error: 'No se pudo cerrar la solicitud de reemplazo.' }
  }

  revalidar(ministerioId, eventoId)
  return { success: true, asignacionDestinoId: String(destino.id) }
}
