'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type AdminAvisoResult = {
  success: boolean
  error?: string
}

async function getAdminContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { supabase, authorized: false as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    authorized: (profile as any)?.rol === 'administrador',
  }
}

function revalidateAvisos(ministerioId?: string | null) {
  revalidatePath('/admin/avisos')
  revalidatePath('/avisos')
  revalidatePath('/inicio')
  if (ministerioId) revalidatePath(`/ministerios/${ministerioId}/avisos`)
}

export async function ocultarAvisoAdmin(avisoId: string): Promise<AdminAvisoResult> {
  const { supabase, authorized } = await getAdminContext()
  if (!authorized) return { success: false, error: 'Solo un administrador puede ocultar avisos.' }

  const { data: aviso, error: readError } = await (supabase as any)
    .from('publicaciones')
    .select('id, ministerio_id, estado')
    .eq('id', avisoId)
    .single()

  if (readError || !aviso) return { success: false, error: 'No se encontró el aviso.' }
  if (aviso.estado !== 'aprobado') return { success: false, error: 'Solo se pueden ocultar avisos visibles.' }

  const { data: updated, error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'oculto' })
    .eq('id', avisoId)
    .eq('estado', 'aprobado')
    .select('id')
    .maybeSingle()

  if (error || !updated) return { success: false, error: error?.message || 'No se pudo ocultar el aviso.' }

  revalidateAvisos(aviso.ministerio_id)
  return { success: true }
}

export async function restaurarAvisoAdmin(avisoId: string): Promise<AdminAvisoResult> {
  const { supabase, authorized } = await getAdminContext()
  if (!authorized) return { success: false, error: 'Solo un administrador puede volver a mostrar avisos.' }

  const { data: aviso, error: readError } = await (supabase as any)
    .from('publicaciones')
    .select('id, ministerio_id, estado')
    .eq('id', avisoId)
    .single()

  if (readError || !aviso) return { success: false, error: 'No se encontró el aviso.' }
  if (aviso.estado !== 'oculto') return { success: false, error: 'Este aviso no está oculto.' }

  const { data: updated, error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'aprobado' })
    .eq('id', avisoId)
    .eq('estado', 'oculto')
    .select('id')
    .maybeSingle()

  if (error || !updated) return { success: false, error: error?.message || 'No se pudo volver a mostrar el aviso.' }

  revalidateAvisos(aviso.ministerio_id)
  return { success: true }
}

export async function eliminarAvisoAdmin(avisoId: string): Promise<AdminAvisoResult> {
  const { supabase, authorized } = await getAdminContext()
  if (!authorized) return { success: false, error: 'Solo un administrador puede borrar avisos.' }

  const { data: aviso, error: readError } = await (supabase as any)
    .from('publicaciones')
    .select('id, ministerio_id')
    .eq('id', avisoId)
    .single()

  if (readError || !aviso) return { success: false, error: 'No se encontró el aviso.' }

  const { data: deleted, error } = await (supabase as any)
    .from('publicaciones')
    .delete()
    .eq('id', avisoId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) return { success: false, error: error?.message || 'No se pudo borrar el aviso.' }

  revalidateAvisos(aviso.ministerio_id)
  return { success: true }
}
