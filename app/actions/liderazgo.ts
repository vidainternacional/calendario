'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function obtenerContextoGestion() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, callerRol: null, error: 'No autorizado' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const callerRol = (callerProfile as any)?.rol as string | undefined
  if (callerRol !== 'pastor' && callerRol !== 'administrador') {
    return { supabase, user, callerRol, error: 'Permisos insuficientes' }
  }

  return { supabase, user, callerRol, error: null }
}

export async function actualizarLiderazgoMinisterial(
  profileId: string,
  ministerioId: string,
  esLider: boolean,
) {
  const { supabase, user, callerRol, error: permisoError } = await obtenerContextoGestion()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  if (profileId === user.id) {
    return { success: false, error: 'No puedes modificar tu propio liderazgo desde este panel.' }
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', profileId)
    .single()

  if (targetError || !targetProfile) {
    return { success: false, error: 'No fue posible encontrar al usuario.' }
  }

  const targetRol = (targetProfile as any).rol as string
  if (targetRol === 'administrador' && callerRol !== 'administrador') {
    return { success: false, error: 'Solo un administrador puede modificar a otro administrador.' }
  }

  const db = supabase as any

  if (esLider) {
    const { data: membresia, error: membresiaError } = await db
      .from('ministerio_miembros')
      .select('ministerio_id, es_lider')
      .eq('profile_id', profileId)
      .eq('ministerio_id', ministerioId)
      .maybeSingle()

    if (membresiaError) return { success: false, error: membresiaError.message }

    const operacion = membresia
      ? db
          .from('ministerio_miembros')
          .update({ es_lider: true })
          .eq('profile_id', profileId)
          .eq('ministerio_id', ministerioId)
      : db
          .from('ministerio_miembros')
          .insert({ profile_id: profileId, ministerio_id: ministerioId, es_lider: true })

    const { error: liderazgoError } = await operacion
    if (liderazgoError) {
      if (liderazgoError.message?.includes('No se puede ser líder de más de 2 ministerios')) {
        return { success: false, error: 'Un usuario no puede ser líder de más de 2 ministerios.' }
      }
      return { success: false, error: liderazgoError.message }
    }

    if (targetRol === 'servidor' || targetRol === 'lider') {
      const { error: rolError } = await db
        .from('profiles')
        .update({ rol: 'lider' })
        .eq('id', profileId)

      if (rolError) return { success: false, error: rolError.message }
    }
  } else {
    const { error: liderazgoError } = await db
      .from('ministerio_miembros')
      .update({ es_lider: false })
      .eq('profile_id', profileId)
      .eq('ministerio_id', ministerioId)

    if (liderazgoError) return { success: false, error: liderazgoError.message }

    if (targetRol === 'lider') {
      const { count, error: countError } = await db
        .from('ministerio_miembros')
        .select('ministerio_id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('es_lider', true)

      if (countError) return { success: false, error: countError.message }

      if ((count ?? 0) === 0) {
        const { error: rolError } = await db
          .from('profiles')
          .update({ rol: 'servidor' })
          .eq('id', profileId)

        if (rolError) return { success: false, error: rolError.message }
      }
    }
  }

  revalidatePath('/admin')
  revalidatePath('/inicio')
  revalidatePath('/ministerios')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)

  return { success: true }
}
