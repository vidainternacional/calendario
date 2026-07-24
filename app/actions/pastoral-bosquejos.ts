'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type PuntoBosquejo = { titulo: string; contenido: string }

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
    return { supabase, user, error: 'No tienes permiso para administrar bosquejos.' }
  }

  return { supabase, user, error: null }
}

function texto(formData: FormData, campo: string, maximo: number) {
  return String(formData.get(campo) ?? '').trim().slice(0, maximo)
}

function estadoValido(valor: string) {
  return ['borrador', 'listo', 'predicado'].includes(valor) ? valor : 'borrador'
}

function puntosDesdeFormulario(formData: FormData): PuntoBosquejo[] {
  const titulos = formData.getAll('punto_titulo').map((valor) => String(valor).trim())
  const contenidos = formData.getAll('punto_contenido').map((valor) => String(valor).trim())
  return titulos.map((titulo, index) => ({
    titulo: titulo.slice(0, 160),
    contenido: (contenidos[index] ?? '').slice(0, 5000),
  })).filter((punto) => punto.titulo || punto.contenido).slice(0, 12)
}

export async function crearBosquejoPastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 120)
  const tema = texto(formData, 'tema', 100)
  const pasajeBase = texto(formData, 'pasaje_base', 120)
  const proposito = texto(formData, 'proposito', 600)

  if (!titulo) return { success: false, error: 'Escribe un título para el bosquejo.' }

  const { data, error: insertError } = await (supabase as any)
    .from('pastoral_bosquejos')
    .insert({
      profile_id: user.id,
      titulo,
      tema,
      pasaje_base: pasajeBase,
      proposito,
    })
    .select('id')
    .single()

  if (insertError || !data) return { success: false, error: 'No se pudo crear el bosquejo.' }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/bosquejos')
  return { success: true, id: data.id as string }
}

export async function editarBosquejoPastoral(id: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 120)
  if (!titulo) return { success: false, error: 'El título es obligatorio.' }

  const fecha = texto(formData, 'fecha_predicacion', 10)
  const actualizacion = {
    titulo,
    tema: texto(formData, 'tema', 100),
    pasaje_base: texto(formData, 'pasaje_base', 120),
    proposito: texto(formData, 'proposito', 600),
    introduccion: texto(formData, 'introduccion', 4000),
    puntos: puntosDesdeFormulario(formData),
    conclusion: texto(formData, 'conclusion', 4000),
    estado: estadoValido(texto(formData, 'estado', 20)),
    fecha_predicacion: fecha || null,
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await (supabase as any)
    .from('pastoral_bosquejos')
    .update(actualizacion)
    .eq('id', id)
    .eq('profile_id', user.id)

  if (updateError) return { success: false, error: 'No se pudo guardar el bosquejo.' }

  revalidatePath('/pastoral/bosquejos')
  revalidatePath(`/pastoral/bosquejos/${id}`)
  return { success: true }
}

export async function eliminarBosquejoPastoral(id: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_bosquejos')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (deleteError) return { success: false, error: 'No se pudo eliminar el bosquejo.' }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/bosquejos')
  return { success: true }
}
