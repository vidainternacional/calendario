'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type EstadoAsignacionMusico = 'pendiente' | 'confirmado' | 'no_disponible'

const ESTADOS_PERMITIDOS = new Set<EstadoAsignacionMusico>(['pendiente', 'confirmado', 'no_disponible'])

export async function responderAsignacionMinisterial(
  ministerioId: string,
  eventoId: string,
  estado: EstadoAsignacionMusico,
) {
  if (!ESTADOS_PERMITIDOS.has(estado)) return { error: 'Estado inválido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const db = supabase as any
  const { data: asignaciones, error: lecturaError } = await db
    .from('evento_asignaciones')
    .select('id')
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (lecturaError) return { error: 'No se pudo verificar tu asignación.' }
  if (!asignaciones?.length) return { error: 'Esta asignación ya no está disponible.' }

  const { error } = await db
    .from('evento_asignaciones')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)
    .eq('evento_id', eventoId)
    .eq('ministerio_id', ministerioId)

  if (error) return { error: 'No se pudo guardar tu respuesta.' }

  revalidatePath('/intercambios')
  revalidatePath('/calendario')
  revalidatePath(`/ministerios/${ministerioId}/programacion`)

  return { success: true, estado }
}
