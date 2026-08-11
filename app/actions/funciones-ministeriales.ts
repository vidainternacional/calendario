'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function fail(message: string): never { throw new Error(message) }

async function puedeAdministrar(ministerioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
  ])
  return Boolean(profile?.activo === true && profile?.estado_cuenta === 'activo' && (['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true))
}

export async function eliminarFuncionMinisterial(ministerioId: string, formData: FormData): Promise<void> {
  if (!(await puedeAdministrar(ministerioId))) fail('No tienes permiso para eliminar funciones de este ministerio.')
  const funcionId = String(formData.get('funcion_id') || '')
  if (!funcionId) fail('Función inválida.')

  const admin = createAdminClient() as any
  const [{ count: historial }, { count: disponibilidad }, { data: funcion }] = await Promise.all([
    admin.from('evento_asignaciones').select('id', { count: 'exact', head: true }).eq('capacidad_id', funcionId),
    admin.from('ministerio_miembro_capacidades').select('id', { count: 'exact', head: true }).eq('ministerio_id', ministerioId).eq('capacidad_id', funcionId),
    admin.from('ministerio_capacidades').select('id,nombre').eq('id', funcionId).eq('ministerio_id', ministerioId).maybeSingle(),
  ])

  if (!funcion) fail('La función ya no existe.')
  if ((historial || 0) > 0) fail('Esta función tiene historial en servicios. Retírala para conservar la programación anterior.')
  if ((disponibilidad || 0) > 0) fail('Esta función todavía está asignada a integrantes. Quítala primero de su disponibilidad o retírala.')

  const { error } = await admin.from('ministerio_capacidades').delete().eq('id', funcionId).eq('ministerio_id', ministerioId)
  if (error) fail(error.message)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
}
