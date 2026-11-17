import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyUsersOnceByReference } from '@/lib/webpush'

type Audiencia = { audiencia_iglesia: boolean; roles_destino: string[]; ministerios_destino: string[]; lideres_ministerio: boolean }
type Perfil = { id: string; rol: string }
type Miembro = { profile_id: string; ministerio_id: string; es_lider: boolean }
type Preferencia = { profile_id: string; ministerio_id: string | null }
const TIPO = 'devocional_publicado'

// Reproduce la unión de destinatarios de la política de lectura, respetando bajas push.
export function elegirDestinatarios(a: Audiencia, perfiles: Perfil[], miembros: Miembro[], bajas: Preferencia[]) {
  const globales = new Set(bajas.filter((p) => p.ministerio_id === null).map((p) => p.profile_id))
  const porMinisterio = new Set(bajas.filter((p) => p.ministerio_id !== null).map((p) => `${p.profile_id}:${p.ministerio_id}`))
  const incluidos = new Set(miembros.filter((m) =>
    (a.ministerios_destino.includes(m.ministerio_id) || (a.lideres_ministerio && m.es_lider)) &&
    !porMinisterio.has(`${m.profile_id}:${m.ministerio_id}`)).map((m) => m.profile_id))
  return [...new Set(perfiles.filter((p) => !globales.has(p.id) &&
    (a.audiencia_iglesia || a.roles_destino.includes(p.rol) || incluidos.has(p.id))).map((p) => p.id))]
}

async function paginas<T>(leer: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const filas: T[] = []
  for (let desde = 0; desde < 100000; desde += 1000) {
    const r = await leer(desde, desde + 999)
    if (r.error || !r.data) throw new Error('No se pudieron resolver los destinatarios')
    filas.push(...r.data)
    if (r.data.length < 1000) return filas
  }
  throw new Error('La selección excede el límite de envío')
}

export async function notificarMensajeDirigido(id: string, autorId: string): Promise<string> {
  try {
    const service = createServiceClient()
    const { data: mensaje, error } = await service.from('vida_devocionales')
      .select('id,titulo,publicado,autor_id,audiencia_iglesia,roles_destino,ministerios_destino,lideres_ministerio,updated_at')
      .eq('id', id).eq('autor_id', autorId).eq('publicado', true).maybeSingle()
    if (error || !mensaje || !mensaje.publicado || mensaje.autor_id !== autorId) return 'No se envió el aviso: la publicación no está disponible para su autor.'
    const perfiles = await paginas<Perfil>((a, b) => service.from('profiles').select('id,rol')
      .eq('activo', true).eq('estado_cuenta', 'activo').order('id').range(a, b))
    let miembros: Miembro[] = []
    if (!mensaje.audiencia_iglesia && (mensaje.lideres_ministerio || mensaje.ministerios_destino.length)) {
      miembros = await paginas<Miembro>((a, b) => {
        let q = service.from('ministerio_miembros').select('profile_id,ministerio_id,es_lider,ministerios!inner(activo)')
          .eq('ministerios.activo', true).order('id')
        if (!mensaje.lideres_ministerio) q = q.in('ministerio_id', mensaje.ministerios_destino)
        return q.range(a, b)
      })
    }
    const bajas = await paginas<Preferencia>((a, b) => service.from('notificaciones_preferencias')
      .select('profile_id,ministerio_id').eq('activo', false).order('id').range(a, b))
    const ids = elegirDestinatarios(mensaje, perfiles, miembros, bajas)
    if (!ids.length) return 'Publicado. No hay destinatarios activos con avisos habilitados para esta selección.'
    // Si se despublicó o cambió la audiencia mientras se preparaba, no enviar el contenido anterior.
    const { data: vigente, error: revisionError } = await service.from('vida_devocionales').select('id')
      .eq('id', id).eq('autor_id', autorId).eq('publicado', true).eq('updated_at', mensaje.updated_at).maybeSingle()
    if (revisionError || !vigente) return 'El mensaje cambió mientras se preparaba el aviso. Revisa la publicación antes de reintentar.'
    const previos = await paginas<{ profile_id: string }>((a, b) => service.from('notificaciones_enviadas')
      .select('profile_id').eq('tipo', TIPO).eq('referencia_id', id).order('id').range(a, b))
    const registrados = new Set(previos.map((p) => p.profile_id))
    const pendientes = ids.filter((pid) => !registrados.has(pid))
    if (!pendientes.length) return 'La publicación está disponible. No hay destinatarios nuevos pendientes de aviso.'
    const resultado = await notifyUsersOnceByReference(pendientes, {
      title: 'Nuevo mensaje pastoral', body: mensaje.titulo,
      url: `/estudios/mensajes/${id}`, tag: `devocional-${id}`,
    }, { tipo: TIPO, referenciaId: id })
    console.log('[devocionales] Resultado de aviso', { id, destinatarios: ids.length, usuarios: resultado.users, dispositivos: resultado.devices })
    return resultado.users > 0
      ? `Publicado. Aviso enviado a ${resultado.users} personas con notificaciones activadas. Quienes no las tienen activadas pueden abrir el mensaje en Devocionales.`
      : 'Publicado, pero no se confirmó ningún envío push nuevo. Puedes usar Reenviar aviso pendiente para reintentar; no se duplicarán los ya registrados.'
  } catch (error) {
    console.error('[devocionales] No se pudo completar el aviso', { id, error: error instanceof Error ? error.message : 'Error de consulta o envío' })
    return 'El mensaje está guardado. No se pudo completar el aviso; utiliza Reenviar aviso pendiente para reintentar.'
  }
}
