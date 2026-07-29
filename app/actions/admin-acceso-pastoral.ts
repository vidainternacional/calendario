'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function establecerAccesoCentroPastoral(profileId: string, acceso: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Tu sesión expiró.' }

  const { data: caller } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  if (caller?.rol !== 'administrador' || caller?.estado_cuenta !== 'activo') {
    return { success: false, error: 'Solo un administrador activo puede asignar este acceso.' }
  }

  if (profileId === user.id) {
    return { success: false, error: 'Tu acceso administrativo ya incluye el Centro Pastoral.' }
  }

  const { data: destino } = await (supabase as any)
    .from('profiles')
    .select('rol, nombre_completo')
    .eq('id', profileId)
    .maybeSingle()

  if (!destino) return { success: false, error: 'No se encontró la cuenta seleccionada.' }

  if (destino.rol === 'pastor' || destino.rol === 'administrador') {
    return { success: false, error: 'Ese rol ya incluye acceso al Centro Pastoral.' }
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update({ acceso_centro_pastoral: Boolean(acceso) })
    .eq('id', profileId)

  if (error) {
    console.error('[establecerAccesoCentroPastoral]', error)
    return { success: false, error: 'No se pudo actualizar el acceso pastoral.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/accesos-pastorales')
  revalidatePath('/perfil')
  revalidatePath('/pastoral')

  return {
    success: true,
    acceso: Boolean(acceso),
    nombre: destino.nombre_completo as string | null,
  }
}
