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

function colorValido(valor: string): ColorColeccion {
  return COLORES.includes(valor as ColorColeccion) ? valor as ColorColeccion : 'indigo'
}

export async function crearColeccionPastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const color = colorValido(String(formData.get('color') ?? 'indigo'))

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

export async function editarColeccionPastoral(id: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const color = colorValido(String(formData.get('color') ?? 'indigo'))

  if (!nombre) return { success: false, error: 'Escribe un nombre para la colección.' }
  if (nombre.length > 80) return { success: false, error: 'El nombre no puede superar 80 caracteres.' }
  if (descripcion.length > 500) return { success: false, error: 'La descripción no puede superar 500 caracteres.' }

  const { error: updateError } = await (supabase as any)
    .from('pastoral_colecciones')
    .update({ nombre, descripcion, color, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (updateError) return { success: false, error: 'No se pudo actualizar la colección.' }

  revalidatePath('/pastoral/colecciones')
  revalidatePath(`/pastoral/colecciones/${id}`)
  return { success: true }
}

export async function agregarVersiculoPastoral(coleccionId: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const libroNombre = String(formData.get('libro_nombre') ?? '').trim()
  const capitulo = Number(formData.get('capitulo'))
  const verso = Number(formData.get('verso'))
  const texto = String(formData.get('texto') ?? '').trim()
  const nota = String(formData.get('nota') ?? '').trim()
  const traduccion = String(formData.get('traduccion') ?? 'Referencia personal').trim()

  if (!libroNombre || !Number.isInteger(capitulo) || capitulo < 1 || !Number.isInteger(verso) || verso < 1 || !texto) {
    return { success: false, error: 'Completa libro, capítulo, versículo y texto.' }
  }
  if (texto.length > 2000) return { success: false, error: 'El texto del versículo es demasiado largo.' }
  if (nota.length > 1000) return { success: false, error: 'La nota no puede superar 1000 caracteres.' }

  const { data: coleccion } = await (supabase as any)
    .from('pastoral_colecciones')
    .select('id')
    .eq('id', coleccionId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!coleccion) return { success: false, error: 'No se encontró la colección.' }

  const { error: insertError } = await (supabase as any)
    .from('pastoral_versiculos')
    .insert({
      coleccion_id: coleccionId,
      profile_id: user.id,
      traduccion: traduccion || 'Referencia personal',
      libro_id: libroNombre.toLowerCase().replace(/\s+/g, '-'),
      libro_nombre: libroNombre,
      capitulo,
      verso,
      texto,
      nota,
    })

  if (insertError) {
    if (insertError.code === '23505') return { success: false, error: 'Ese versículo ya está en la colección.' }
    return { success: false, error: 'No se pudo agregar el versículo.' }
  }

  await (supabase as any)
    .from('pastoral_colecciones')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', coleccionId)
    .eq('profile_id', user.id)

  revalidatePath('/pastoral/colecciones')
  revalidatePath(`/pastoral/colecciones/${coleccionId}`)
  return { success: true }
}

export async function eliminarVersiculoPastoral(id: string, coleccionId: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_versiculos')
    .delete()
    .eq('id', id)
    .eq('coleccion_id', coleccionId)
    .eq('profile_id', user.id)

  if (deleteError) return { success: false, error: 'No se pudo eliminar el versículo.' }

  revalidatePath('/pastoral/colecciones')
  revalidatePath(`/pastoral/colecciones/${coleccionId}`)
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
