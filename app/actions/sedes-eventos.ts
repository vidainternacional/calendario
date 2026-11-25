'use server'

import { sesionSedes } from '@/lib/sedes/servidor'
import { revalidatePath } from 'next/cache'
import { notifyUsersOnceByReference } from '@/lib/webpush'
import type { MusicianSetlistSong } from '@/components/ministerios/MusicianSetlistClient'
export type DirectorioMusicos = { personas: { id: string; nombre: string; sedes: string[] }[]; invitados: { id: string; nombre: string }[] }
export async function obtenerMusicosInvitables(evento: string, ministerio: string): Promise<{ datos?: DirectorioMusicos; error?: string }> {
  try {
    const { db } = await sesionSedes()
    const { data, error } = await db.rpc('vida_directorio_musicos', { p_evento: evento, p_ministerio: ministerio })
    if (error || !data) throw new Error('No se pudo cargar el directorio autorizado para este servicio.')
    return { datos: data as DirectorioMusicos }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo cargar.' } }
}
export async function cambiarInvitacionMusico(evento: string, ministerio: string, profile: string, activo: boolean) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_invitar_musico', { p_evento: evento, p_ministerio: ministerio, p_profile: profile, p_activo: activo })
    if (error) throw new Error('No se pudo cambiar la invitación. Comprueba que todavía puedes programar el servicio.')
    let aviso = ''
    if (activo) {
      try {
        const { data: habilitado, error: prefError } = await db.rpc('vida_invitar_aviso_permitido', { p_evento: evento, p_ministerio: ministerio, p_profile: profile })
        if (!prefError && habilitado === true ) {
          const result = await notifyUsersOnceByReference([profile], { title: 'Invitación para servir', body: 'Tienes un servicio compartido en VIDA. Abre el repertorio y las indicaciones.', url: `/servicio-compartido/${evento}?ministerio=${ministerio}`, tag: `servicio-${evento}` }, { tipo: 'evento_invitado', referenciaId: evento })
          if (!result.users) aviso = 'Invitación guardada. No se confirmó un aviso push nuevo; estará disponible en Inicio.'
        }
      } catch { aviso = 'Invitación guardada. No se pudo confirmar el aviso push.' }
    }
    revalidatePath('/inicio'); revalidatePath(`/ministerios/${ministerio}/programacion`)
    return { success: true, aviso }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar.' } }
}
export async function obtenerInvitacionesServicio(ownerId: string) {
  try {
    const { db, user } = await sesionSedes()
    if (user.id !== ownerId) throw new Error('Tu sesión cambió.')
    const { data, error } = await db.from('vida_evento_invitados').select('evento_id,ministerio_id,eventos!inner(titulo,fecha_inicio,fecha_fin)').eq('profile_id', user.id).eq('activo', true).gte('eventos.fecha_fin', new Date().toISOString())
    if (error) throw new Error('No se pudieron cargar las invitaciones.')
    return { invitaciones: (data || []) as unknown as { evento_id: string; ministerio_id: string; eventos: { titulo: string; fecha_inicio: string } }[] }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudieron cargar.' } }
}
export async function obtenerServicioCompartido(evento: string, ministerio: string) {
  const { db } = await sesionSedes()
  const { data, error } = await db.rpc('vida_servicio_invitado', { p_evento: evento, p_ministerio: ministerio })
  if (error || !data) return null
  return data as { evento: { id: string; titulo: string; fecha: string; ubicacion: string | null }; canciones: MusicianSetlistSong[] }
}

export async function obtenerSedeCelebracion(evento: string) {
  try {
    const { db } = await sesionSedes()
    const { data, error } = await db.rpc('vida_ubicacion_servicio', { p_evento: evento })
    if (error || !data) throw new Error('No se pudo consultar el lugar del servicio.')
    return { datos: data as { sede_id: string | null; puede_configurar: boolean } }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo consultar.' } }
}
export async function guardarSedeCelebracion(evento: string, sede: string) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_fijar_sede_evento', { p_evento: evento, p_sede: sede })
    if (error) throw new Error(error.message)
    revalidatePath('/ministerios'); revalidatePath('/calendario')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar.' } }
}
