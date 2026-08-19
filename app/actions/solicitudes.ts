'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notifyUser } from '@/lib/webpush'

type SolicitudResoluble = {
  id: string
  titulo: string
  detalle: string | null
  ministerio_id: string
  solicitado_por: string
  fecha_solicitada: string | null
  estado: string
}

async function obtenerContextoResolucionSolicitud(solicitudId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, solicitud: null, error: 'No autorizado' }

  const [{ data: profile }, { data: solicitud, error: solicitudError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('rol,activo,estado_cuenta')
      .eq('id', user.id)
      .maybeSingle(),
    (supabase as any)
      .from('solicitudes')
      .select('id,titulo,detalle,ministerio_id,solicitado_por,fecha_solicitada,estado')
      .eq('id', solicitudId)
      .maybeSingle(),
  ])

  if (!profile || (profile as any).activo !== true || (profile as any).estado_cuenta !== 'activo') {
    return { supabase, user, solicitud: null, error: 'Tu cuenta no está habilitada para realizar esta acción.' }
  }

  if (solicitudError || !solicitud) {
    return { supabase, user, solicitud: null, error: solicitudError?.message || 'Solicitud no encontrada' }
  }

  if ((solicitud as any).estado !== 'pendiente') {
    return { supabase, user, solicitud: null, error: 'La solicitud ya fue resuelta.' }
  }

  if ((profile as any).rol === 'administrador') {
    return { supabase, user, solicitud: solicitud as SolicitudResoluble, error: null }
  }

  const { data: membresia } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('profile_id', user.id)
    .eq('ministerio_id', (solicitud as any).ministerio_id)
    .maybeSingle()

  if ((membresia as any)?.es_lider !== true) {
    return {
      supabase,
      user,
      solicitud: null,
      error: 'Solo un administrador o líder de este ministerio puede resolver solicitudes.',
    }
  }

  return { supabase, user, solicitud: solicitud as SolicitudResoluble, error: null }
}

export async function actualizarEstadoSolicitud(id: string, estado: 'aprobada' | 'rechazada', path: string) {
  const contexto = await obtenerContextoResolucionSolicitud(id)
  if (contexto.error || !contexto.user || !contexto.solicitud) {
    return { error: contexto.error || 'No autorizado' }
  }

  const { error } = await (contexto.supabase as any)
    .from('solicitudes')
    .update({
      estado,
      revisado_por: contexto.user.id,
      resuelto_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  revalidatePath(path)
}

export async function crearSolicitud(
  ministerioId: string,
  _state: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const titulo = formData.get('titulo') as string
  const detalle = formData.get('detalle') as string
  const tipo = formData.get('tipo') as 'salon' | 'equipo_sonido' | 'presupuesto' | 'otro'

  if (!titulo || !detalle || !tipo) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await (supabase as any).from('solicitudes').insert({
    ministerio_id: ministerioId,
    solicitado_por: user.id,
    titulo,
    detalle,
    tipo,
    estado: 'pendiente'
  })

  if (error) return { error: error.message }

  redirect(`/ministerios/${ministerioId}/solicitudes`)
}

// ─── Actions para /solicitudes global ────────────────────────────────────────

export type SolicitudState = { error?: string; success?: boolean } | undefined

/** Crear solicitud desde la página /solicitudes (lee ministerio_id del formData) */
export async function crearSolicitudGlobal(
  _state: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const detalle = (formData.get('detalle') as string)?.trim()
  const tipo = (formData.get('tipo') as string)?.trim()
  const ministerioId = (formData.get('ministerio_id') as string)?.trim()
  const fechaSolicitadaStr = (formData.get('fecha_solicitada') as string)?.trim()

  if (!titulo || !detalle || !tipo || !ministerioId) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  let fecha_solicitada: string | null = null
  if (fechaSolicitadaStr) {
    fecha_solicitada = new Date(fechaSolicitadaStr).toISOString()
  }

  const { error } = await (supabase as any).from('solicitudes').insert({
    ministerio_id: ministerioId,
    solicitado_por: user.id,
    titulo,
    detalle,
    tipo,
    estado: 'pendiente',
    fecha_solicitada,
  })

  if (error) return { error: error.message }

  revalidatePath('/solicitudes')
  return { success: true }
}

/** Aprobar solicitud pendiente */
export async function aprobarSolicitud(
  _state: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  return _resolverSolicitud('aprobada', formData)
}

/** Rechazar solicitud pendiente */
export async function rechazarSolicitud(
  _state: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  return _resolverSolicitud('rechazada', formData)
}

async function _resolverSolicitud(
  estado: 'aprobada' | 'rechazada',
  formData: FormData
): Promise<SolicitudState> {
  const solicitudId = formData.get('solicitud_id') as string
  if (!solicitudId) return { error: 'ID inválido' }

  const contexto = await obtenerContextoResolucionSolicitud(solicitudId)
  if (contexto.error || !contexto.user || !contexto.solicitud) {
    return { error: contexto.error || 'No autorizado' }
  }

  const { supabase, user, solicitud } = contexto

  const { error: updateError } = await (supabase as any)
    .from('solicitudes')
    .update({
      estado,
      revisado_por: user.id,
      resuelto_at: new Date().toISOString(),
    })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')

  if (updateError) return { error: updateError.message }

  if (estado === 'aprobada' && solicitud.fecha_solicitada) {
    const fechaInicio = new Date(solicitud.fecha_solicitada)
    const fechaFin = new Date(fechaInicio)
    fechaFin.setHours(fechaFin.getHours() + 2)

    const { data: nuevoEvento, error: insertError } = await (supabase as any)
      .from('eventos')
      .insert({
        titulo: solicitud.titulo,
        descripcion: solicitud.detalle,
        ministerio_id: solicitud.ministerio_id,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        creado_por: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[solicitudes] Error al crear evento automático:', insertError)
    } else if (nuevoEvento?.id) {
      const { error: asignError } = await (supabase as any)
        .from('evento_asignaciones')
        .insert({
          evento_id: nuevoEvento.id,
          profile_id: solicitud.solicitado_por,
          estado: 'confirmado',
        })

      if (asignError) {
        console.error('[solicitudes] Error al crear asignación:', asignError)
      }
    }
  }

  const esAprobada = estado === 'aprobada'
  await notifyUser(supabase, solicitud.solicitado_por, {
    title: esAprobada ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
    body: `Tu solicitud "${solicitud.titulo}" ha sido ${estado}.`,
    url: '/solicitudes',
    tag: 'solicitud_resuelta',
  })

  revalidatePath('/solicitudes')
  return { success: true }
}
