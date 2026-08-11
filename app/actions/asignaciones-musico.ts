'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type EstadoAsignacionMusico = 'pendiente' | 'confirmado' | 'no_disponible'

const ESTADOS_PERMITIDOS = new Set<EstadoAsignacionMusico>(['pendiente', 'confirmado', 'no_disponible'])

function revalidarAsignacion(ministerioId: string) {
  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/intercambios')
  revalidatePath('/calendario')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}

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

  const asignacionIds = asignaciones.map((row: any) => String(row.id))
  const now = new Date().toISOString()

  const { error } = await db
    .from('evento_asignaciones')
    .update({ estado, updated_at: now })
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (error) return { error: 'No se pudo guardar tu respuesta.' }

  if (estado !== 'no_disponible' && asignacionIds.length > 0) {
    const { error: cancelError } = await db
      .from('intercambios')
      .update({ estado: 'cancelado', resuelto_at: now })
      .eq('solicitante_id', user.id)
      .eq('estado', 'pendiente')
      .in('asignacion_origen_id', asignacionIds)

    if (cancelError) {
      console.error('[responderAsignacionMinisterial] cancelar reemplazos pendientes', cancelError)
    }
  }

  revalidarAsignacion(ministerioId)
  return { success: true, estado }
}

export async function solicitarReemplazoServicioMinisterial(
  ministerioId: string,
  eventoId: string,
) {
  if (!/^[0-9a-f-]{36}$/i.test(ministerioId) || !/^[0-9a-f-]{36}$/i.test(eventoId)) {
    return { error: 'Servicio inválido.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const db = supabase as any
  const { data: asignaciones, error: lecturaError } = await db
    .from('evento_asignaciones')
    .select('id,evento_id,profile_id,ministerio_id,capacidad_id,estado,eventos(fecha_inicio)')
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (lecturaError) return { error: 'No se pudo verificar tu asignación.' }
  if (!asignaciones?.length) return { error: 'Esta asignación ya no está disponible.' }

  const evento = Array.isArray(asignaciones[0]?.eventos)
    ? asignaciones[0].eventos[0]
    : asignaciones[0]?.eventos

  if (!evento?.fecha_inicio || new Date(evento.fecha_inicio).getTime() < Date.now()) {
    return { error: 'Ya no se puede solicitar un reemplazo para este servicio.' }
  }

  const asignacionIds = asignaciones.map((row: any) => String(row.id))
  const { data: existentes = [], error: existentesError } = await db
    .from('intercambios')
    .select('id,asignacion_origen_id')
    .eq('solicitante_id', user.id)
    .eq('estado', 'pendiente')
    .in('asignacion_origen_id', asignacionIds)

  if (existentesError) return { error: 'No se pudieron revisar tus solicitudes pendientes.' }

  const yaSolicitadas = new Set((existentes || []).map((row: any) => String(row.asignacion_origen_id)))
  const faltantes = asignaciones.filter((row: any) => !yaSolicitadas.has(String(row.id)))

  let insertados: any[] = []
  if (faltantes.length > 0) {
    const { data, error: intercambioError } = await db
      .from('intercambios')
      .insert(faltantes.map((row: any) => ({
        asignacion_origen_id: row.id,
        solicitante_id: user.id,
        destinatario_id: null,
        mensaje: 'Solicitud de reemplazo por indisponibilidad',
        estado: 'pendiente',
      })))
      .select('id')

    if (intercambioError) {
      console.error('[solicitarReemplazoServicioMinisterial] intercambios', intercambioError)
      return { error: 'No se pudo registrar la solicitud de reemplazo.' }
    }
    insertados = data || []
  }

  const now = new Date().toISOString()
  const { error: estadoError } = await db
    .from('evento_asignaciones')
    .update({ estado: 'no_disponible', updated_at: now })
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (estadoError) {
    if (insertados.length > 0) {
      await db
        .from('intercambios')
        .update({ estado: 'cancelado', resuelto_at: now })
        .in('id', insertados.map((row: any) => row.id))
    }
    console.error('[solicitarReemplazoServicioMinisterial] estado', estadoError)
    return { error: 'No se pudo completar la solicitud de reemplazo.' }
  }

  revalidarAsignacion(ministerioId)

  // Este bloque solo registra la necesidad de cobertura. El líder conserva la
  // decisión final y las notificaciones push siguen fuera de la prioridad activa.
  return {
    success: true,
    alreadyPending: faltantes.length === 0,
    funcionesAReemplazar: asignaciones.length,
  }
}

// Compatibilidad temporal con el primer Preview del dashboard. La experiencia
// visible ya no presenta intercambios por instrumento; usa reemplazo de servicio.
export async function solicitarCambioAsignacionMinisterial(asignacionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  if (!/^[0-9a-f-]{36}$/i.test(asignacionId)) return { error: 'Asignación inválida.' }

  const db = supabase as any
  const { data: asignacion, error } = await db
    .from('evento_asignaciones')
    .select('evento_id,ministerio_id')
    .eq('id', asignacionId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error || !asignacion?.evento_id || !asignacion?.ministerio_id) {
    return { error: 'Esta asignación ya no está disponible.' }
  }

  return solicitarReemplazoServicioMinisterial(
    String(asignacion.ministerio_id),
    String(asignacion.evento_id),
  )
}