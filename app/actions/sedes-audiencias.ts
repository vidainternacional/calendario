'use server'

import { sesionSedes, validarAudienciaSedes } from '@/lib/sedes/servidor'
import type { AudienciaSedes } from '@/lib/sedes/audiencias'

export type OpcionesDestinatarios = {
  owner: string; global: boolean; pastorales: string[]
  sedes: { id: string; nombre: string; slug: string }[]
  ministerios: { id: string; nombre: string; sede: string }[]
  personas: { id: string; nombre: string }[]
  grupos: { id: string; nombre: string; audiencia: AudienciaSedes; updated_at: string }[]
}
export async function obtenerOpcionesDestinatarios(): Promise<{ opciones?: OpcionesDestinatarios; error?: string }> {
  try {
    const { db, user } = await sesionSedes()
    const [opciones, grupos] = await Promise.all([
      db.rpc('vida_opciones_destinatarios'),
      db.from('vida_grupos_destino').select('id,nombre,audiencia,updated_at').eq('owner_id', user.id).eq('activo', true).order('nombre'),
    ])
    if (opciones.error || grupos.error || opciones.data?.owner !== user.id) throw new Error('No se pudieron cargar los destinatarios. Tu mensaje no se ha enviado.')
    return { opciones: { ...opciones.data, grupos: grupos.data || [] } as OpcionesDestinatarios }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudieron cargar los destinatarios.' } }
}
export async function obtenerAudienciaPaquete(id: string) {
  try {
    const { db, user } = await sesionSedes()
    const { data, error } = await db.from('pastoral_paquetes').select('vida_audiencia,updated_at').eq('id', id).eq('profile_id', user.id).single()
    if (error || !data) throw new Error('No se pudieron comprobar los destinatarios actuales del paquete.')
    return { audiencia: (data.vida_audiencia as AudienciaSedes | null) || null, revision: String(data.updated_at) }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo consultar la audiencia.' } }
}
export async function guardarGrupoDestinatarios(nombre: string, audiencia: AudienciaSedes) {
  try {
    const { db, user } = await sesionSedes()
    const value = await validarAudienciaSedes(db, audiencia)
    const titulo = nombre.trim()
    if (!titulo || titulo.length > 80) throw new Error('Escribe un nombre de hasta 80 caracteres.')
    const { error } = await db.from('vida_grupos_destino').insert({ owner_id: user.id, nombre: titulo, audiencia: value })
    if (error) throw new Error('No se pudo guardar el grupo.')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar el grupo.' } }
}
export async function archivarGrupoDestinatarios(id: string, revision: string) {
  try {
    const { db, user } = await sesionSedes()
    const { data, error } = await db.from('vida_grupos_destino').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', user.id).eq('updated_at', revision).select('id')
    if (error || !data?.length) throw new Error('El grupo cambió o no puedes modificarlo. Vuelve a cargar.')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo archivar el grupo.' } }
}
