'use server'

import { sesionSedes } from '@/lib/sedes/servidor'
import { revalidatePath } from 'next/cache'
export type AdministracionSedes = {
  ministerios: { id: string; nombre: string; sede: string | null }[]
  pastores: { id: string; nombre: string }[]
  responsables: { profile_id: string; sede_id: string; responsabilidad: string }[]
}
export async function obtenerAdministracionSedes(): Promise<{ datos?: AdministracionSedes; error?: string }> {
  try {
    const { db } = await sesionSedes()
    const { data, error } = await db.rpc('vida_sedes_administracion')
    if (error || !data) throw new Error('Solo administración o el pastor general puede administrar las sedes.')
    return { datos: data as AdministracionSedes }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo cargar.' } }
}
export async function clasificarMinisterioSede(id: string, sede: string, anterior: string | null) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_clasificar_ministerio', { p_ministerio: id, p_sede: sede, p_anterior: anterior })
    if (error) throw new Error(error.message)
    revalidatePath('/ministerios'); revalidatePath('/admin/sedes'); revalidatePath('/inicio')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar.' } }
}
export async function crearMinisterioEnSede(form: FormData) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_crear_ministerio_sede', { p_sede: String(form.get('sede') || ''), p_nombre: String(form.get('nombre') || ''), p_descripcion: String(form.get('descripcion') || '') })
    if (error) throw new Error(error.message)
    revalidatePath('/ministerios'); revalidatePath('/admin/sedes')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo crear.' } }
}
export async function asignarPastorSede(profile: string, sede: string, activo: boolean) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_asignar_pastor_sede', { p_profile: profile, p_sede: sede, p_activo: activo })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/sedes')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar.' } }
}

export type UbicacionSede = { latitud: number; longitud: number; radio_metros: number }
export async function guardarUbicacionSede(sede: string, ubicacion: UbicacionSede, anterior: UbicacionSede | null) {
  try {
    const { db } = await sesionSedes()
    const { error } = await db.rpc('vida_guardar_ubicacion_sede', { p_sede: sede, p_latitud: ubicacion.latitud, p_longitud: ubicacion.longitud, p_radio: ubicacion.radio_metros, p_anterior: anterior })
    if (error) throw new Error(error.message)
    revalidatePath('/sedes/administrar'); revalidatePath('/admin/sedes')
    return { success: true }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar la ubicación.' } }
}
export async function obtenerUbicacionesSedes() {
  try {
    const { db } = await sesionSedes()
    const { data, error } = await db.from('vida_sedes').select('id,nombre,ubicacion').eq('activa', true).order('nombre')
    if (error) throw new Error('No se pudieron cargar las ubicaciones.')
    return { sedes: data as { id: string; nombre: string; ubicacion: UbicacionSede | null }[] }
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo cargar.' } }
}
