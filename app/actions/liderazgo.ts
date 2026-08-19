'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function obtenerContextoAdministrador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'No autorizado' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if ((callerProfile as any)?.rol !== 'administrador') {
    return { supabase, user, error: 'Solo un administrador puede cambiar el liderazgo ministerial.' }
  }

  return { supabase, user, error: null }
}

export async function actualizarLiderazgoMinisterial(
  profileId: string,
  ministerioId: string,
  esLider: boolean,
) {
  const { supabase, user, error: permisoError } = await obtenerContextoAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const { data: targetProfile, error: targetError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single()

  if (targetError || !targetProfile) {
    return { success: false, error: 'No fue posible encontrar al usuario.' }
  }

  const db = supabase as any
  const { data: membresia, error: membresiaError } = await db
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider')
    .eq('profile_id', profileId)
    .eq('ministerio_id', ministerioId)
    .maybeSingle()

  if (membresiaError) return { success: false, error: membresiaError.message }

  if (esLider) {
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
    if (liderazgoError) return { success: false, error: liderazgoError.message }
  } else if (membresia) {
    const { error: liderazgoError } = await db
      .from('ministerio_miembros')
      .update({ es_lider: false })
      .eq('profile_id', profileId)
      .eq('ministerio_id', ministerioId)

    if (liderazgoError) return { success: false, error: liderazgoError.message }
  }

  // El rol global se administra por separado. Ser líder de un ministerio no
  // convierte automáticamente el rol global de la cuenta en "lider".
  revalidatePath('/admin')
  revalidatePath('/inicio')
  revalidatePath('/ministerios')
  revalidatePath('/perfil')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)

  return { success: true }
}
