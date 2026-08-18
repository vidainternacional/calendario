'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  obtenerReemplazosServicioMinisterial,
  type HistorialReemplazoMinisterial,
  type SolicitudReemplazoMinisterial,
} from '@/app/actions/reemplazos-ministeriales'

export type GrupoSolicitudReemplazoMinisterial = {
  key: string
  eventoId: string
  eventoTitulo: string
  fechaInicio: string
  solicitanteId: string
  solicitanteNombre: string
  solicitanteAvatarUrl: string | null
  createdAt: string
  funciones: SolicitudReemplazoMinisterial[]
}

export type HistorialCentroSolicitudes = HistorialReemplazoMinisterial & {
  eventoId: string
  eventoTitulo: string
}

export type CentroSolicitudesMinisterio = {
  puedeGestionar: boolean
  solicitudesGeneralesPendientes: number
  reemplazosPendientes: GrupoSolicitudReemplazoMinisterial[]
  historialReemplazos: HistorialCentroSolicitudes[]
  totalPendientes: number
}

async function contextoGestionMinisterio(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null

  const puedeGestionar =
    profile.rol === 'administrador' ||
    membresia?.es_lider === true

  return { userId: user.id, puedeGestionar, admin }
}

export async function obtenerCentroSolicitudesMinisterio(
  ministerioId: string,
): Promise<CentroSolicitudesMinisterio> {
  if (!/^[0-9a-f-]{36}$/i.test(ministerioId)) {
    return {
      puedeGestionar: false,
      solicitudesGeneralesPendientes: 0,
      reemplazosPendientes: [],
      historialReemplazos: [],
      totalPendientes: 0,
    }
  }

  const contexto = await contextoGestionMinisterio(ministerioId)
  if (!contexto?.puedeGestionar) {
    return {
      puedeGestionar: false,
      solicitudesGeneralesPendientes: 0,
      reemplazosPendientes: [],
      historialReemplazos: [],
      totalPendientes: 0,
    }
  }

  const admin = contexto.admin
  const [{ count: solicitudesGeneralesPendientes = 0 }, { data: asignaciones = [] }] = await Promise.all([
    admin
      .from('solicitudes')
      .select('id', { count: 'exact', head: true })
      .eq('ministerio_id', ministerioId)
      .eq('estado', 'pendiente'),
    admin
      .from('evento_asignaciones')
      .select('id,evento_id,estado')
      .eq('ministerio_id', ministerioId),
  ])

  const asignacionIds = (asignaciones as any[]).map((row) => String(row.id))
  let intercambios: any[] = []
  if (asignacionIds.length > 0) {
    const { data = [] } = await admin
      .from('intercambios')
      .select('id,asignacion_origen_id,solicitante_id,estado,created_at')
      .in('asignacion_origen_id', asignacionIds)
      .order('created_at', { ascending: false })
    intercambios = data as any[]
  }

  const asignacionEvento = new Map(
    (asignaciones as any[]).map((row) => [String(row.id), String(row.evento_id)]),
  )
  const eventoIds = Array.from(new Set(
    intercambios
      .map((row) => asignacionEvento.get(String(row.asignacion_origen_id)) || '')
      .filter(Boolean),
  ))

  const { data: eventos = [] } = eventoIds.length
    ? await admin
      .from('eventos')
      .select('id,titulo,fecha_inicio')
      .in('id', eventoIds)
    : { data: [] as any[] }

  const eventosMap = new Map((eventos as any[]).map((row) => [String(row.id), row]))
  const grupos = new Map<string, GrupoSolicitudReemplazoMinisterial>()
  const historialReemplazos: HistorialCentroSolicitudes[] = []

  for (const eventoId of eventoIds) {
    const detalle = await obtenerReemplazosServicioMinisterial(ministerioId, eventoId)
    if (!detalle.puedeGestionar) continue
    const evento = eventosMap.get(eventoId) as any

    for (const solicitud of detalle.solicitudes) {
      const key = `${solicitud.solicitanteId}:${eventoId}`
      const actual = grupos.get(key) || {
        key,
        eventoId,
        eventoTitulo: String(evento?.titulo || 'Servicio'),
        fechaInicio: String(evento?.fecha_inicio || solicitud.createdAt),
        solicitanteId: solicitud.solicitanteId,
        solicitanteNombre: solicitud.solicitanteNombre,
        solicitanteAvatarUrl: solicitud.solicitanteAvatarUrl,
        createdAt: solicitud.createdAt,
        funciones: [],
      }
      actual.funciones.push(solicitud)
      if (new Date(solicitud.createdAt).getTime() < new Date(actual.createdAt).getTime()) {
        actual.createdAt = solicitud.createdAt
      }
      grupos.set(key, actual)
    }

    for (const item of detalle.historial) {
      historialReemplazos.push({
        ...item,
        eventoId,
        eventoTitulo: String(evento?.titulo || 'Servicio'),
      })
    }
  }

  const reemplazosPendientes = Array.from(grupos.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  historialReemplazos.sort(
    (a, b) => new Date(b.resueltoAt || b.createdAt).getTime() - new Date(a.resueltoAt || a.createdAt).getTime(),
  )

  return {
    puedeGestionar: true,
    solicitudesGeneralesPendientes: Number(solicitudesGeneralesPendientes || 0),
    reemplazosPendientes,
    historialReemplazos,
    totalPendientes: Number(solicitudesGeneralesPendientes || 0) + reemplazosPendientes.length,
  }
}

export async function obtenerConteoSolicitudesGestionables() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const admin = createAdminClient() as any
  const { data: profile } = await admin
    .from('profiles')
    .select('rol,activo,estado_cuenta')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return 0

  let ministerioIds: string[] = []
  if (profile.rol === 'administrador') {
    const { data: ministerios = [] } = await admin.from('ministerios').select('id').eq('activo', true)
    ministerioIds = (ministerios as any[]).map((row) => String(row.id))
  } else {
    const { data: liderazgos = [] } = await admin
      .from('ministerio_miembros')
      .select('ministerio_id')
      .eq('profile_id', user.id)
      .eq('es_lider', true)
    ministerioIds = Array.from(new Set((liderazgos as any[]).map((row) => String(row.ministerio_id))))
  }

  if (ministerioIds.length === 0) return 0

  const [{ count: generales = 0 }, { data: asignaciones = [] }] = await Promise.all([
    admin
      .from('solicitudes')
      .select('id', { count: 'exact', head: true })
      .in('ministerio_id', ministerioIds)
      .eq('estado', 'pendiente'),
    admin
      .from('evento_asignaciones')
      .select('id,evento_id,ministerio_id,estado')
      .in('ministerio_id', ministerioIds),
  ])

  const asignacionIds = (asignaciones as any[]).map((row) => String(row.id))
  if (asignacionIds.length === 0) return Number(generales || 0)

  const { data: pendientes = [] } = await admin
    .from('intercambios')
    .select('asignacion_origen_id,solicitante_id')
    .in('asignacion_origen_id', asignacionIds)
    .eq('estado', 'pendiente')

  const asignacionMap = new Map(
    (asignaciones as any[]).map((row) => [
      String(row.id),
      {
        eventoId: String(row.evento_id),
        ministerioId: String(row.ministerio_id),
        estado: String(row.estado || ''),
      },
    ]),
  )
  const grupos = new Set<string>()
  for (const row of pendientes as any[]) {
    const origen = asignacionMap.get(String(row.asignacion_origen_id))
    if (!origen || (origen.estado !== 'no_disponible' && origen.estado !== 'declinado')) continue
    grupos.add(`${origen.ministerioId}:${origen.eventoId}:${String(row.solicitante_id)}`)
  }

  return Number(generales || 0) + grupos.size
}
