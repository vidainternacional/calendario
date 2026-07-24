'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
    return { supabase, user, error: 'No tienes permiso para administrar paquetes pastorales.' }
  }

  return { supabase, user, error: null }
}

function texto(formData: FormData, campo: string, maximo: number) {
  return String(formData.get(campo) ?? '').trim().slice(0, maximo)
}

function uuidOpcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(texto) ? texto : null
}

function estadoValido(valor: string) {
  return ['borrador', 'listo', 'compartido'].includes(valor) ? valor : 'borrador'
}

function recursosDesdeFormulario(formData: FormData) {
  return Array.from(new Set(formData.getAll('recurso_ids').map((valor) => uuidOpcional(valor)).filter(Boolean)))
    .slice(0, 30) as string[]
}

export async function crearPaquetePastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 140)
  if (!titulo) return { success: false, error: 'Escribe un título para el paquete.' }

  const { data, error: insertError } = await (supabase as any)
    .from('pastoral_paquetes')
    .insert({
      profile_id: user.id,
      titulo,
      descripcion_publica: texto(formData, 'descripcion_publica', 2000),
      instrucciones: texto(formData, 'instrucciones', 3000),
      bosquejo_id: uuidOpcional(formData.get('bosquejo_id')),
      coleccion_id: uuidOpcional(formData.get('coleccion_id')),
      recurso_ids: recursosDesdeFormulario(formData),
      estado: estadoValido(texto(formData, 'estado', 20)),
    })
    .select('id')
    .single()

  if (insertError || !data) return { success: false, error: 'No se pudo crear el paquete pastoral.' }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/paquetes')
  return { success: true, id: data.id as string }
}

export async function editarPaquetePastoral(id: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 140)
  if (!titulo) return { success: false, error: 'El título es obligatorio.' }

  const { error: updateError } = await (supabase as any)
    .from('pastoral_paquetes')
    .update({
      titulo,
      descripcion_publica: texto(formData, 'descripcion_publica', 2000),
      instrucciones: texto(formData, 'instrucciones', 3000),
      bosquejo_id: uuidOpcional(formData.get('bosquejo_id')),
      coleccion_id: uuidOpcional(formData.get('coleccion_id')),
      recurso_ids: recursosDesdeFormulario(formData),
      estado: estadoValido(texto(formData, 'estado', 20)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (updateError) return { success: false, error: 'No se pudo guardar el paquete pastoral.' }

  revalidatePath('/pastoral/paquetes')
  revalidatePath(`/pastoral/paquetes/${id}`)
  return { success: true }
}

export async function eliminarPaquetePastoral(id: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_paquetes')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (deleteError) return { success: false, error: 'No se pudo eliminar el paquete pastoral.' }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/paquetes')
  return { success: true }
}
