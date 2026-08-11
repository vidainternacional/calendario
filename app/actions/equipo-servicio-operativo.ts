'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoEquipo = {
  userId: string
  puedeProgramar: boolean
}

function fail(message: string): never {
  throw new Error(message)
}

function idsUnicos(values: string[]) {
  return Array.from(new Set(values.map((value) => String(value)).filter(Boolean)))
}

async function obtenerAcceso(ministerioId: string): Promise<AccesoEquipo | null> {
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
    puedeProgramar: profile.rol === 'administrador' || profile.rol === 'pastor' || membresia?.es_lider === true,
  }
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const { data: calendars = [] } = await admin
    .from('calendars')
    .select('id')
    .eq('ministerio_id', ministerioId)
    .order('created_at')
    .limit(1)

  const calendarId = calendars?.[0]?.id ? String(calendars[0].id) : ''
  if (!calendarId) return false

  const [{ data: evento }, { data: link }] = await Promise.all([
    admin.from('eventos').select('id,ministerio_id').eq('id', eventoId).maybeSingle(),
    admin.from('evento_calendarios').select('evento_id').eq('evento_id', eventoId).eq('calendar_id', calendarId).maybeSingle(),
  ])

  return Boolean(evento && (link || String(evento.ministerio_id || '') === ministerioId))
}

function revalidar(ministerioId: string, eventoId: string) {
  revalidatePath('/inicio')
  revalidatePath('/intercambios')
  revalidatePath(`/eventos/${eventoId}`)
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes`)
}

/**
 * Edita quién sirve y en qué función sin destruir historial de reemplazos.
 * - Asignaciones nuevas quedan pendientes de confirmación.
 * - Una asignación no disponible/declinada que el líder reactiva vuelve a pendiente.
 * - Si una fila tiene historial de intercambio, al retirarla se conserva y se marca declinada.
 * - Si no tiene historial, se puede eliminar físicamente de la programación del servicio.
 */
export async function actualizarEquipoPersonaServicio(
  ministerioId: string,
  eventoId: string,
  profileId: string,
  capacidadesSeleccionadas: string[],
) {
  if (!/^[0-9a-f-]{36}$/i.test(ministerioId) || !/^[0-9a-f-]{36}$/i.test(eventoId) || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    fail('Datos de programación inválidos.')
  }

  const acceso = await obtenerAcceso(ministerioId)
  if (!acceso?.puedeProgramar) fail('No tienes permiso para programar este ministerio.')

  const admin = createAdminClient() as any
  if (!(await validarEvento(admin, ministerioId, eventoId))) fail('El servicio no está preparado para este ministerio.')

  const seleccionadas = idsUnicos(capacidadesSeleccionadas)
  const [{ data: membresia }, { data: disponiblesRows = [] }, { data: funcionesRows = [] }, { data: actualesRows = [] }] = await Promise.all([
    admin.from('ministerio_miembros').select('id').eq('ministerio_id', ministerioId).eq('profile_id', profileId).maybeSingle(),
    admin.from('ministerio_miembro_capacidades').select('capacidad_id').eq('ministerio_id', ministerioId).eq('profile_id', profileId),
    admin.from('ministerio_capacidades').select('id').eq('ministerio_id', ministerioId).eq('activo', true),
    admin.from('evento_asignaciones').select('id,capacidad_id,estado').eq('evento_id', eventoId).eq('ministerio_id', ministerioId).eq('profile_id', profileId),
  ])

  if (!membresia) fail('La persona ya no pertenece a este ministerio.')

  const disponibles = new Set((disponiblesRows as any[]).map((row) => String(row.capacidad_id)))
  const funcionesActivas = new Set((funcionesRows as any[]).map((row) => String(row.id)))
  for (const capacidadId of seleccionadas) {
    if (!disponibles.has(capacidadId) || !funcionesActivas.has(capacidadId)) {
      fail('Una de las funciones seleccionadas ya no está disponible para esta persona.')
    }
  }

  const actuales = (actualesRows as any[]).filter((row) => row.capacidad_id)
  const porCapacidad = new Map(actuales.map((row) => [String(row.capacidad_id), row]))
  const seleccionadasSet = new Set(seleccionadas)
  const estadosInactivos = new Set(['no_disponible', 'declinado'])
  const now = new Date().toISOString()

  const reactivar = seleccionadas
    .map((capacidadId) => porCapacidad.get(capacidadId))
    .filter((row) => row && estadosInactivos.has(String(row.estado || '')))

  if (reactivar.length > 0) {
    const ids = reactivar.map((row) => String(row.id))
    await admin
      .from('intercambios')
      .update({ estado: 'cancelado', resuelto_at: now })
      .in('asignacion_origen_id', ids)
      .eq('estado', 'pendiente')

    const { error } = await admin
      .from('evento_asignaciones')
      .update({ estado: 'pendiente', asignado_por: acceso.userId, updated_at: now })
      .in('id', ids)
    if (error) fail(error.message)
  }

  const agregar = seleccionadas.filter((capacidadId) => !porCapacidad.has(capacidadId))
  if (agregar.length > 0) {
    const { error } = await admin.from('evento_asignaciones').insert(
      agregar.map((capacidadId) => ({
        evento_id: eventoId,
        profile_id: profileId,
        ministerio_id: ministerioId,
        capacidad_id: capacidadId,
        asignado_por: acceso.userId,
        estado: 'pendiente',
        updated_at: now,
      })),
    )
    if (error) fail(error.message)
  }

  const retirar = actuales.filter((row) => {
    const estado = String(row.estado || '')
    return !seleccionadasSet.has(String(row.capacidad_id)) && !estadosInactivos.has(estado)
  })

  if (retirar.length > 0) {
    const retirarIds = retirar.map((row) => String(row.id))
    const [{ data: refsOrigen = [] }, { data: refsDestino = [] }] = await Promise.all([
      admin.from('intercambios').select('asignacion_origen_id').in('asignacion_origen_id', retirarIds),
      admin.from('intercambios').select('asignacion_destino_id').in('asignacion_destino_id', retirarIds),
    ])

    const referenciadas = new Set<string>()
    for (const row of refsOrigen as any[]) if (row.asignacion_origen_id) referenciadas.add(String(row.asignacion_origen_id))
    for (const row of refsDestino as any[]) if (row.asignacion_destino_id) referenciadas.add(String(row.asignacion_destino_id))

    const conservar = retirarIds.filter((id) => referenciadas.has(id))
    const eliminar = retirarIds.filter((id) => !referenciadas.has(id))

    if (conservar.length > 0) {
      await admin
        .from('intercambios')
        .update({ estado: 'cancelado', resuelto_at: now })
        .in('asignacion_origen_id', conservar)
        .eq('estado', 'pendiente')

      const { error } = await admin
        .from('evento_asignaciones')
        .update({ estado: 'declinado', updated_at: now })
        .in('id', conservar)
      if (error) fail(error.message)
    }

    if (eliminar.length > 0) {
      const { error } = await admin
        .from('evento_asignaciones')
        .delete()
        .in('id', eliminar)
        .eq('evento_id', eventoId)
        .eq('ministerio_id', ministerioId)
        .eq('profile_id', profileId)
      if (error) fail(error.message)
    }
  }

  revalidar(ministerioId, eventoId)
  return { success: true }
}
