'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const COLORES = ['indigo', 'violet', 'amber', 'emerald', 'rose', 'sky'] as const
export type ColorColeccion = typeof COLORES[number]

async function contextoPastoral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Tu sesión expiró.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') {
    return { supabase, user, error: 'No tienes permiso para administrar contenido pastoral.' }
  }

  return { supabase, user, error: null }
}

export async function crearColeccionPastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const colorSolicitado = String(formData.get('color') ?? 'indigo')
  const color: ColorColeccion = COLORES.includes(colorSolicitado as ColorColeccion)
    ? colorSolicitado as ColorColeccion
    : 'indigo'

  if (!nombre) return { success: false, error: 'Escribe un nombre para la colección.' }
  if (nombre.length > 80) return { success: false, error: 'El nombre no puede superar 80 caracteres.' }
  if (descripcion.length > 500) return { success: false, error: 'La descripción no puede superar 500 caracteres.' }

  const { error: insertError } = await (supabase as any)
    .from('pastoral_colecciones')
    .insert({ profile_id: user.id, nombre, descripcion, color })

  if (insertError) {
    console.error('[crearColeccionPastoral]', insertError)
    return { success: false, error: 'No se pudo crear la colección.' }
  }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/colecciones')
  return { success: true }
}

export async function eliminarColeccionPastoral(id: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_colecciones')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (deleteError) {
    console.error('[eliminarColeccionPastoral]', deleteError)
    return { success: false, error: 'No se pudo eliminar la colección.' }
  }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/colecciones')
  return { success: true }
}
