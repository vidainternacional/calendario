'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function exigirAdministrador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { user: null, error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol,activo,estado_cuenta')
    .eq('id', user.id)
    .single()

  const caller = profile as any
  if (caller?.rol !== 'administrador' || caller?.activo !== true || caller?.estado_cuenta !== 'activo') {
    return { user, error: 'Solo un administrador activo puede gestionar capacidades y responsabilidades especiales.' }
  }

  return { user, error: null }
}

export async function toggleCapacidadMinisterial(
  profileId: string,
  ministerioId: string,
  capacidadId: string,
  asignar: boolean,
) {
  const { user, error: permisoError } = await exigirAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const admin = createAdminClient()
  const { data: capacidad, error: capacidadError } = await (admin as any)
    .from('ministerio_capacidades')
    .select('id, ministerio_id, activo')
    .eq('id', capacidadId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()

  if (capacidadError) return { success: false, error: capacidadError.message }
  if (!capacidad || !capacidad.activo) return { success: false, error: 'La capacidad seleccionada ya no está disponible.' }

  if (asignar) {
    const { data: membresia, error: membresiaError } = await (admin as any)
      .from('ministerio_miembros')
      .select('profile_id')
      .eq('profile_id', profileId)
      .eq('ministerio_id', ministerioId)
      .maybeSingle()

    if (membresiaError) return { success: false, error: membresiaError.message }
    if (!membresia) {
      return { success: false, error: 'Primero agrega a la persona como miembro de este ministerio.' }
    }

    const { error } = await (admin as any)
      .from('ministerio_miembro_capacidades')
      .upsert({
        ministerio_id: ministerioId,
        profile_id: profileId,
        capacidad_id: capacidadId,
        origen: 'administrador',
        confirmada_por: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'ministerio_id,profile_id,capacidad_id' })

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await (admin as any)
      .from('ministerio_miembro_capacidades')
      .delete()
      .eq('profile_id', profileId)
      .eq('ministerio_id', ministerioId)
      .eq('capacidad_id', capacidadId)

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function toggleResponsabilidadMinisterial(
  profileId: string,
  responsabilidadId: string,
  asignar: boolean,
) {
  const { user, error: permisoError } = await exigirAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const admin = createAdminClient()
  const { data: responsabilidad, error: responsabilidadError } = await (admin as any)
    .from('ministerio_responsabilidades')
    .select('id, activo')
    .eq('id', responsabilidadId)
    .maybeSingle()

  if (responsabilidadError) return { success: false, error: responsabilidadError.message }
  if (!responsabilidad || !responsabilidad.activo) {
    return { success: false, error: 'La responsabilidad seleccionada ya no está disponible.' }
  }

  if (asignar) {
    const { error } = await (admin as any)
      .from('ministerio_responsabilidad_asignaciones')
      .upsert({
        responsabilidad_id: responsabilidadId,
        profile_id: profileId,
        asignado_por: user.id,
      }, { onConflict: 'responsabilidad_id,profile_id' })

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await (admin as any)
      .from('ministerio_responsabilidad_asignaciones')
      .delete()
      .eq('responsabilidad_id', responsabilidadId)
      .eq('profile_id', profileId)

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/usuarios')
  return { success: true }
}
