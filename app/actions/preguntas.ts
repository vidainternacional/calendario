'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PreguntaState = { error?: string; success?: boolean } | undefined

export async function enviarPregunta(
  _state: PreguntaState,
  formData: FormData
): Promise<PreguntaState> {
  const texto = (formData.get('texto') as string)?.trim()
  const anonima = formData.get('anonima') === 'on'

  if (!texto) return { error: 'Por favor, escribe tu pregunta o feedback.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { error } = await (supabase as any).from('preguntas_congregacion').insert({
    profile_id: user.id,
    texto,
    es_anonima: anonima,
    estado: 'pendiente'
  })

  if (error) return { error: error.message }

  revalidatePath('/preguntas')
  return { success: true }
}

export async function responderPregunta(preguntaId: string, respuesta: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // Check permissions (Admin, Pastor, Pastor General)
  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  if (p?.rol !== 'administrador' && p?.rol !== 'pastor' && !p?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos.' }
  }

  const { error } = await (supabase as any).from('preguntas_congregacion').update({
    respuesta,
    respondida_por: user.id,
    estado: 'respondida'
  }).eq('id', preguntaId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/preguntas')
  revalidatePath('/preguntas')
  return { success: true }
}

export async function archivarPregunta(preguntaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  if (p?.rol !== 'administrador' && p?.rol !== 'pastor' && !p?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos.' }
  }

  const { error } = await (supabase as any).from('preguntas_congregacion').update({
    estado: 'archivada'
  }).eq('id', preguntaId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/preguntas')
  revalidatePath('/preguntas')
  return { success: true }
}
