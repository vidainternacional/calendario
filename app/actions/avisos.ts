'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyMultipleUsers } from '@/lib/webpush'

export type AvisoState = { error?: string; success?: boolean; pendiente?: boolean } | undefined

/**
 * Crea un aviso/publicación.
 * - Avisos de ministerio: siempre aprobado.
 * - Avisos globales: 'aprobado' si es pastor_general o administrador, 'pendiente' si no.
 */
export async function crearAviso(
  ministerioId: string,
  _state: AvisoState,
  formData: FormData
): Promise<AvisoState> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  const minIdForm = (formData.get('ministerio_id') as string) ?? ministerioId

  if (!titulo || !cuerpo) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  // Determinar estado: globales de no-pastor/admin quedan pendientes
  const isGlobal = !minIdForm || minIdForm === ''
  let estado = 'aprobado'

  if (isGlobal) {
    const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
    const p = profile as any
    const puedePublicarDirecto = p?.rol === 'administrador' || p?.es_pastor_general
    if (!puedePublicarDirecto) {
      estado = 'pendiente'
    }
  }

  const { error } = await (supabase as any).from('publicaciones').insert({
    ministerio_id: minIdForm === '' ? null : minIdForm,
    autor_id: user.id,
    tipo: 'aviso',
    titulo,
    cuerpo,
    estado,
  })

  if (error) {
    return { error: error.message }
  }

  // Solo disparar notificación si queda aprobado
  if (estado === 'aprobado') {
    await _enviarNotificacionAviso(supabase, user.id, minIdForm || '', titulo)
  }

  revalidatePath('/avisos')
  revalidatePath('/inicio')
  return { success: true, pendiente: estado === 'pendiente' }
}

async function _enviarNotificacionAviso(supabase: any, autorId: string, minIdForm: string, titulo: string) {
  const { data: ministerio } = minIdForm
    ? await supabase.from('ministerios').select('nombre').eq('id', minIdForm).single()
    : { data: { nombre: 'General' } }

  const minNombre = (ministerio as any)?.nombre || 'General'

  let targetUserIds: string[] = []
  if (!minIdForm) {
    const { data: allUsers } = await supabase.from('profiles').select('id').neq('id', autorId)
    if (allUsers) targetUserIds = allUsers.map((u: any) => u.id)
  } else {
    const { data: miembros } = await supabase.from('ministerio_miembros').select('profile_id').eq('ministerio_id', minIdForm).neq('profile_id', autorId)
    if (miembros) targetUserIds = miembros.map((m: any) => m.profile_id)
  }

  if (targetUserIds.length > 0) {
    const { data: prefData } = await supabase
      .from('notificaciones_preferencias')
      .select('profile_id')
      .eq('activo', false)
      .eq('ministerio_id', minIdForm || 'uuid-00000000-0000-0000-0000-000000000000')

    const disabledIds = new Set(prefData?.map((p: any) => p.profile_id) || [])
    const finalUserIds = targetUserIds.filter((id: string) => !disabledIds.has(id))

    if (finalUserIds.length > 0) {
      await notifyMultipleUsers(supabase, finalUserIds, {
        title: `Nuevo aviso en ${minNombre}`,
        body: titulo,
        url: minIdForm ? `/ministerios/${minIdForm}/avisos` : '/avisos',
        tag: 'aviso_nuevo',
      })
    }
  }
}

export async function aprobarAviso(avisoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  if (p?.rol !== 'administrador' && !p?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos para aprobar avisos.' }
  }

  // Fetch the aviso to send notification
  const { data: aviso } = await (supabase as any)
    .from('publicaciones')
    .select('titulo, autor_id, ministerio_id')
    .eq('id', avisoId)
    .single()

  const { error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'aprobado' })
    .eq('id', avisoId)

  if (error) return { success: false, error: error.message }

  // Dispatch notification now
  if (aviso) {
    await _enviarNotificacionAviso(supabase, aviso.autor_id, aviso.ministerio_id || '', aviso.titulo)
  }

  revalidatePath('/avisos/pendientes-aprobacion')
  revalidatePath('/avisos')
  revalidatePath('/inicio')
  return { success: true }
}

export async function rechazarAviso(avisoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  if (p?.rol !== 'administrador' && !p?.es_pastor_general) {
    return { success: false, error: 'No tienes permisos para rechazar avisos.' }
  }

  const { error } = await (supabase as any)
    .from('publicaciones')
    .update({ estado: 'rechazado' })
    .eq('id', avisoId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/avisos/pendientes-aprobacion')
  return { success: true }
}


