'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function solicitarIngreso(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .insert({
      profile_id: user.id,
      ministerio_id: ministerioId,
      estado: 'pendiente'
    })

  if (error) {
    console.error('Error al solicitar ingreso:', error)
    // Could fail due to unique constraint if already exists
    if (error.code === '23505') {
      return { success: false, error: 'Ya tienes una solicitud pendiente para este ministerio.' }
    }
    return { success: false, error: 'Error al enviar solicitud.' }
  }

  revalidatePath('/ministerios')
  return { success: true }
}

export async function aprobarSolicitudIngreso(solicitudId: string, profileId: string, ministerioId: string) {
  const supabase = await createClient()
  // 1. Mark as approved
  const { error: e1 } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'aprobada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)
  
  if (e1) return { success: false, error: e1.message }

  // 2. Insert into ministerio_miembros
  const { error: e2 } = await (supabase as any)
    .from('ministerio_miembros')
    .insert({
      profile_id: profileId,
      ministerio_id: ministerioId,
      es_lider: false
    })
  
  if (e2 && e2.code !== '23505') {
    return { success: false, error: e2.message }
  }

  revalidatePath('/ministerios')
  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}

export async function rechazarSolicitudIngreso(solicitudId: string, ministerioId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .update({ estado: 'rechazada', resuelto_at: new Date().toISOString() })
    .eq('id', solicitudId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/ministerios/${ministerioId}/solicitudes-ingreso`)
  return { success: true }
}
