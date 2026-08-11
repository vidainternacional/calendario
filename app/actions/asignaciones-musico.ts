'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type EstadoAsignacionMusico = 'pendiente' | 'confirmado' | 'no_disponible'

const ESTADOS_PERMITIDOS = new Set<EstadoAsignacionMusico>(['pendiente', 'confirmado', 'no_disponible'])

export async function responderAsignacionMinisterial(
  ministerioId: string,
  eventoId: string,
  estado: EstadoAsignacionMusico,
) {
  if (!ESTADOS_PERMITIDOS.has(estado)) return { error: 'Estado inválido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const db = supabase as any
  const { data: asignaciones, error: lecturaError } = await db
    .from('evento_asignaciones')
    .select('id')
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (lecturaError) return { error: 'No se pudo verificar tu asignación.' }
  if (!asignaciones?.length) return { error: 'Esta asignación ya no está disponible.' }

  const { error } = await db
    .from('evento_asignaciones')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (error) return { error: 'No se pudo guardar tu respuesta.' }

  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/intercambios')
  revalidatePath('/calendario')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)

  return { success: true, estado }
}

export async function solicitarCambioAsignacionMinisterial(asignacionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  if (!/^[0-9a-f-]{36}$/i.test(asignacionId)) return { error: 'Asignación inválida.' }

  const db = supabase as any
  const { data: asignacion, error: lecturaError } = await db
    .from('evento_asignaciones')
    .select('id,evento_id,profile_id,ministerio_id,capacidad_id,estado,eventos(fecha_inicio)')
    .eq('id', asignacionId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (lecturaError) return { error: 'No se pudo verificar la asignación.' }
  if (!asignacion) return { error: 'Esta asignación ya no está disponible.' }

  const evento = Array.isArray(asignacion.eventos) ? asignacion.eventos[0] : asignacion.eventos
  if (!evento?.fecha_inicio || new Date(evento.fecha_inicio).getTime() < Date.now()) {
    return { error: 'Ya no se puede solicitar un cambio para este servicio.' }
  }

  const { data: existente } = await db
    .from('intercambios')
    .select('id')
    .eq('asignacion_origen_id', asignacionId)
    .eq('solicitante_id', user.id)
    .eq('estado', 'pendiente')
    .limit(1)
    .maybeSingle()

  if (existente?.id) return { success: true, intercambioId: String(existente.id), alreadyPending: true }

  const { data: intercambio, error: intercambioError } = await db
    .from('intercambios')
    .insert({
      asignacion_origen_id: asignacionId,
      solicitante_id: user.id,
      destinatario_id: null,
      mensaje: 'Solicitud de cambio de función',
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (intercambioError || !intercambio?.id) {
    console.error('[solicitarCambioAsignacionMinisterial] intercambio', intercambioError)
    return { error: 'No se pudo registrar la solicitud de cambio.' }
  }

  const { error: estadoError } = await db
    .from('evento_asignaciones')
    .update({ estado: 'no_disponible', updated_at: new Date().toISOString() })
    .eq('id', asignacionId)
    .eq('profile_id', user.id)

  if (estadoError) {
    await db
      .from('intercambios')
      .update({ estado: 'cancelado', resuelto_at: new Date().toISOString() })
      .eq('id', intercambio.id)
      .eq('solicitante_id', user.id)
    console.error('[solicitarCambioAsignacionMinisterial] estado', estadoError)
    return { error: 'No se pudo completar la solicitud de cambio.' }
  }

  const ministerioId = String(asignacion.ministerio_id || '')
  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/intercambios')
  revalidatePath('/calendario')
  if (ministerioId) {
    revalidatePath(`/ministerios/${ministerioId}`)
    revalidatePath(`/ministerios/${ministerioId}/programacion`)
  }

  // Las notificaciones push de nuevas asignaciones/cambios siguen fuera de este bloque.
  // La solicitud queda registrada en `intercambios` y visible dentro de VIDA.
  return { success: true, intercambioId: String(intercambio.id) }
}
