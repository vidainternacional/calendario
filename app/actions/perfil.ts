'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** El usuario edita su información básica (las columnas sensibles están protegidas por trigger). */
export async function actualizarMiPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const fecha = (formData.get('fecha_nacimiento') as string) || null

  if (!nombre || nombre.length < 2) return { error: 'Escribe tu nombre completo.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ nombre_completo: nombre, telefono, fecha_nacimiento: fecha })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo guardar. Intenta de nuevo.' }
  revalidatePath('/perfil')
  return { success: true }
}
