'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export type MinisterioCompartible = {
  id: string
  nombre: string
}

export type ListadoCompartido = {
  id: string
  eventoId: string
  eventoTitulo: string
  fechaInicio: string
  ministerioOrigenId: string
  ministerioOrigenNombre: string
  canciones: Array<{
    id: string
    orden: number
    titulo: string
    artista: string | null
    spotifyUrl: string | null
    youtubeUrl: string | null
  }>
}

function fail(message: string): never {
  throw new Error(message)
}

async function obtenerUsuarioActivo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const { data: profile } = await admin
    .from('profiles')
    .select('rol,activo,estado_cuenta')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null
  return { userId: user.id, rol: String(profile.rol || ''), admin }
}

async function puedeGestionarOrigen(ministerioId: string) {
  const usuario = await obtenerUsuarioActivo()
  if (!usuario) return null
  if (usuario.rol === 'administrador') return usuario

  const { data: membresia } = await usuario.admin
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('ministerio_id', ministerioId)
    .eq('profile_id', usuario.userId)
    .maybeSingle()

  return membresia?.es_lider === true ? usuario : null
}

async function puedeVerDestino(ministerioId: string) {
  const usuario = await obtenerUsuarioActivo()
  if (!usuario) return null
  if (usuario.rol === 'administrador') return usuario

  const { data: membresia } = await usuario.admin
    .from('ministerio_miembros')
    .select('id')
    .eq('ministerio_id', ministerioId)
    .eq('profile_id', usuario.userId)
    .maybeSingle()

  return membresia ? usuario : null
}

async function validarEvento(admin: any, ministerioId: string, eventoId: string) {
  const { data: calendars = [] } = await admin
    .from('calendars')
    .select('id')
    .eq('ministerio_id', ministerioId)
    .limit(5)

  const calendarIds = (calendars || []).map((item: any) => String(item.id))
  const [{ data: evento }, { data: links = [] }] = await Promise.all([
    admin.from('eventos').select('id,ministerio_id').eq('id', eventoId).maybeSingle(),
    calendarIds.length
      ? admin.from('evento_calendarios').select('evento_id').eq('evento_id', eventoId).in('calendar_id', calendarIds).limit(1)
      : Promise.resolve({ data: [] }),
  ])

  return Boolean(evento && (String(evento.ministerio_id || '') === ministerioId || (links || []).length > 0))
}

export async function obtenerConfiguracionCompartirRepertorio(ministerioId: string, eventoId: string) {
  const acceso = await puedeGestionarOrigen(ministerioId)
  if (!acceso) return { ministerios: [] as MinisterioCompartible[], seleccionados: [] as string[] }
  if (!(await validarEvento(acceso.admin, ministerioId, eventoId))) {
    return { ministerios: [] as MinisterioCompartible[], seleccionados: [] as string[] }
  }

  const [{ data: ministerios = [] }, { data: compartidos = [] }] = await Promise.all([
    acceso.admin
      .from('ministerios')
      .select('id,nombre')
      .eq('activo', true)
      .neq('id', ministerioId)
      .order('orden', { ascending: true }),
    acceso.admin
      .from('evento_repertorio_compartidos')
      .select('ministerio_destino_id')
      .eq('evento_id', eventoId)
      .eq('ministerio_origen_id', ministerioId),
  ])

  return {
    ministerios: (ministerios || []).map((item: any) => ({ id: String(item.id), nombre: String(item.nombre || 'Ministerio') })),
    seleccionados: (compartidos || []).map((item: any) => String(item.ministerio_destino_id)),
  }
}

export async function guardarRepertorioCompartido(ministerioId: string, eventoId: string, destinos: string[]) {
  const acceso = await puedeGestionarOrigen(ministerioId)
  if (!acceso) fail('No tienes permiso para compartir este repertorio.')
  if (!(await validarEvento(acceso.admin, ministerioId, eventoId))) fail('El servicio no corresponde a este ministerio.')

  const solicitados = Array.from(new Set((destinos || []).map((id) => String(id || '').trim()).filter(Boolean)))
  let destinosValidos: string[] = []

  if (solicitados.length > 0) {
    const { data: ministerios = [], error } = await acceso.admin
      .from('ministerios')
      .select('id')
      .in('id', solicitados)
      .eq('activo', true)
      .neq('id', ministerioId)

    if (error) fail(error.message)
    destinosValidos = (ministerios || []).map((item: any) => String(item.id))
  }

  const { data: existentes = [], error: existentesError } = await acceso.admin
    .from('evento_repertorio_compartidos')
    .select('id,ministerio_destino_id')
    .eq('evento_id', eventoId)
    .eq('ministerio_origen_id', ministerioId)

  if (existentesError) fail(existentesError.message)

  if (destinosValidos.length > 0) {
    const filas = destinosValidos.map((ministerioDestinoId) => ({
      evento_id: eventoId,
      ministerio_origen_id: ministerioId,
      ministerio_destino_id: ministerioDestinoId,
      creado_por: acceso.userId,
    }))

    const { error } = await acceso.admin
      .from('evento_repertorio_compartidos')
      .upsert(filas, { onConflict: 'evento_id,ministerio_origen_id,ministerio_destino_id' })

    if (error) fail(error.message)
  }

  const seleccionados = new Set(destinosValidos)
  const idsEliminar = (existentes || [])
    .filter((item: any) => !seleccionados.has(String(item.ministerio_destino_id)))
    .map((item: any) => String(item.id))

  if (idsEliminar.length > 0) {
    const { error } = await acceso.admin.from('evento_repertorio_compartidos').delete().in('id', idsEliminar)
    if (error) fail(error.message)
  }

  const destinosPrevios = (existentes || []).map((item: any) => String(item.ministerio_destino_id))
  const afectados = new Set([...destinosPrevios, ...destinosValidos])
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  for (const destinoId of afectados) {
    revalidatePath(`/ministerios/${destinoId}`)
    revalidatePath(`/ministerios/${destinoId}/listado-compartido`)
  }
}

export async function tieneListadosCompartidosMinisterio(ministerioDestinoId: string) {
  const acceso = await puedeVerDestino(ministerioDestinoId)
  if (!acceso) return false

  const { count, error } = await acceso.admin
    .from('evento_repertorio_compartidos')
    .select('id', { count: 'exact', head: true })
    .eq('ministerio_destino_id', ministerioDestinoId)

  if (error) return false
  return (count || 0) > 0
}

export async function obtenerListadosCompartidosMinisterio(ministerioDestinoId: string): Promise<ListadoCompartido[]> {
  const acceso = await puedeVerDestino(ministerioDestinoId)
  if (!acceso) return []

  const { data: compartidos = [], error } = await acceso.admin
    .from('evento_repertorio_compartidos')
    .select('id,evento_id,ministerio_origen_id,created_at')
    .eq('ministerio_destino_id', ministerioDestinoId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !compartidos?.length) return []

  const eventoIds = Array.from(new Set(compartidos.map((item: any) => String(item.evento_id))))
  const origenIds = Array.from(new Set(compartidos.map((item: any) => String(item.ministerio_origen_id))))

  const [{ data: eventos = [] }, { data: origenes = [] }, { data: repertorio = [] }] = await Promise.all([
    acceso.admin.from('eventos').select('id,titulo,fecha_inicio').in('id', eventoIds),
    acceso.admin.from('ministerios').select('id,nombre').in('id', origenIds),
    acceso.admin
      .from('evento_repertorio')
      .select('id,evento_id,ministerio_id,cancion_id,orden,titulo,spotify_url,youtube_url')
      .in('evento_id', eventoIds)
      .in('ministerio_id', origenIds)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  const cancionIds = Array.from(new Set((repertorio || []).map((row: any) => row.cancion_id ? String(row.cancion_id) : '').filter(Boolean)))
  let canciones: any[] = []
  if (cancionIds.length > 0) {
    const { data = [] } = await acceso.admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url')
      .in('id', cancionIds)
    canciones = data || []
  }

  const eventosPorId = new Map<string, any>((eventos || []).map((item: any) => [String(item.id), item]))
  const origenesPorId = new Map<string, any>((origenes || []).map((item: any) => [String(item.id), item]))
  const cancionesPorId = new Map<string, any>((canciones || []).map((item: any) => [String(item.id), item]))

  return compartidos.map((share: any) => {
    const eventoId = String(share.evento_id)
    const origenId = String(share.ministerio_origen_id)
    const evento = eventosPorId.get(eventoId)
    const origen = origenesPorId.get(origenId)
    const filas = (repertorio || []).filter((row: any) => String(row.evento_id) === eventoId && String(row.ministerio_id) === origenId)

    return {
      id: String(share.id),
      eventoId,
      eventoTitulo: String(evento?.titulo || 'Servicio'),
      fechaInicio: String(evento?.fecha_inicio || share.created_at),
      ministerioOrigenId: origenId,
      ministerioOrigenNombre: String(origen?.nombre || 'Alabanza'),
      canciones: filas.map((row: any) => {
        const cancion = row.cancion_id ? cancionesPorId.get(String(row.cancion_id)) : null
        return {
          id: String(row.id),
          orden: Number(row.orden || 0),
          titulo: String(row.titulo || cancion?.titulo || 'Canción'),
          artista: cancion?.artista ? String(cancion.artista) : null,
          spotifyUrl: String(row.spotify_url || cancion?.spotify_url || '') || null,
          youtubeUrl: String(row.youtube_url || cancion?.youtube_url || '') || null,
        }
      }),
    }
  })
}
