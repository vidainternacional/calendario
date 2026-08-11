'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export type PendientesMinisterioDashboard = Record<string, number>

export async function obtenerPendientesMinisterioDashboard(
  ministerioIds: string[],
): Promise<PendientesMinisterioDashboard> {
  const idsSolicitados = Array.from(new Set(
    ministerioIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
  ))
  if (!idsSolicitados.length) return {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const admin = createAdminClient() as any
  const { data: profile } = await admin
    .from('profiles')
    .select('rol,activo,estado_cuenta,es_pastor_general')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return {}

  let gestionables: string[] = []
  if (profile.rol === 'administrador' || profile.rol === 'pastor' || profile.es_pastor_general === true) {
    gestionables = idsSolicitados
  } else {
    const { data: liderazgos = [] } = await admin
      .from('ministerio_miembros')
      .select('ministerio_id')
      .eq('profile_id', user.id)
      .eq('es_lider', true)
      .in('ministerio_id', idsSolicitados)
    gestionables = Array.from(new Set((liderazgos as any[]).map((row) => String(row.ministerio_id))))
  }

  const resultado: PendientesMinisterioDashboard = Object.fromEntries(
    idsSolicitados.map((id) => [id, 0]),
  )
  if (!gestionables.length) return resultado

  const [ingresosReq, generalesReq, asignacionesReq] = await Promise.all([
    admin
      .from('ministerio_solicitudes_ingreso')
      .select('ministerio_id')
      .in('ministerio_id', gestionables)
      .eq('estado', 'pendiente'),
    admin
      .from('solicitudes')
      .select('ministerio_id')
      .in('ministerio_id', gestionables)
      .eq('estado', 'pendiente'),
    admin
      .from('evento_asignaciones')
      .select('id,evento_id,ministerio_id,estado')
      .in('ministerio_id', gestionables),
  ])

  for (const row of (ingresosReq.data || []) as any[]) {
    const id = String(row.ministerio_id || '')
    if (id) resultado[id] = (resultado[id] || 0) + 1
  }
  for (const row of (generalesReq.data || []) as any[]) {
    const id = String(row.ministerio_id || '')
    if (id) resultado[id] = (resultado[id] || 0) + 1
  }

  const asignaciones = (asignacionesReq.data || []) as any[]
  const asignacionIds = asignaciones.map((row) => String(row.id))
  if (!asignacionIds.length) return resultado

  const { data: intercambios = [] } = await admin
    .from('intercambios')
    .select('asignacion_origen_id,solicitante_id')
    .in('asignacion_origen_id', asignacionIds)
    .eq('estado', 'pendiente')

  const asignacionMap = new Map(
    asignaciones.map((row) => [
      String(row.id),
      {
        ministerioId: String(row.ministerio_id || ''),
        eventoId: String(row.evento_id || ''),
        estado: String(row.estado || ''),
      },
    ]),
  )

  const reemplazos = new Set<string>()
  for (const row of intercambios as any[]) {
    const origen = asignacionMap.get(String(row.asignacion_origen_id))
    if (!origen) continue
    if (origen.estado !== 'no_disponible' && origen.estado !== 'declinado') continue
    reemplazos.add(`${origen.ministerioId}:${origen.eventoId}:${String(row.solicitante_id || '')}`)
  }

  for (const key of reemplazos) {
    const ministerioId = key.split(':')[0]
    if (ministerioId) resultado[ministerioId] = (resultado[ministerioId] || 0) + 1
  }

  return resultado
}
