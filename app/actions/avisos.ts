'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyMultipleUsers } from '@/lib/webpush'

export type AvisoState = { error?: string; success?: boolean } | undefined

/**
 * Crea un aviso/publicación.
 * @param ministerioId - UUID del ministerio, o "" para publicación global (visible a todos).
 */
export async function crearAviso(
  ministerioId: string,
  _state: AvisoState,
  formData: FormData
): Promise<AvisoState> {
  const titulo = (formData.get('titulo') as string)?.trim()
  const cuerpo = (formData.get('cuerpo') as string)?.trim()
  // Si viene del formulario, el campo ministerio_id del form tiene prioridad
  const minIdForm = (formData.get('ministerio_id') as string) ?? ministerioId

  if (!titulo || !cuerpo) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('publicaciones').insert({
    ministerio_id: minIdForm === '' ? null : minIdForm,
    autor_id: user.id,
    tipo: 'aviso',
    titulo,
    cuerpo,
  })

  if (error) {
    return { error: error.message }
  }

  // Enviar notificación push
  // NOTA: Si el ministerio_id es null (global), obtenemos todos los perfiles, sino solo los del ministerio
  const { data: ministerio } = minIdForm 
    ? await supabase.from('ministerios').select('nombre').eq('id', minIdForm).single()
    : { data: { nombre: 'General' } }

  const minNombre = (ministerio as any)?.nombre || 'General'

  let targetUserIds: string[] = []
  if (!minIdForm) {
    // Todos los usuarios
    const { data: allUsers } = await supabase.from('profiles').select('id').neq('id', user.id)
    if (allUsers) targetUserIds = allUsers.map((u: any) => u.id)
  } else {
    // Solo miembros del ministerio
    const { data: miembros } = await supabase.from('ministerio_miembros').select('profile_id').eq('ministerio_id', minIdForm).neq('profile_id', user.id)
    if (miembros) targetUserIds = miembros.map((m: any) => m.profile_id)
  }

  // Filtrar por preferencias de notificaciones (omitimos a los que tienen activo = false explícitamente)
  if (targetUserIds.length > 0) {
    const { data: prefData } = await supabase
      .from('notificaciones_preferencias')
      .select('profile_id')
      .eq('activo', false)
      .eq('ministerio_id', minIdForm || 'uuid-00000000-0000-0000-0000-000000000000')
    
    const disabledIds = new Set(prefData?.map((p: any) => p.profile_id) || [])
    const finalUserIds = targetUserIds.filter(id => !disabledIds.has(id))

    if (finalUserIds.length > 0) {
      await notifyMultipleUsers(supabase, finalUserIds, {
        title: `Nuevo aviso en ${minNombre}`,
        body: titulo,
        url: minIdForm ? `/ministerios/${minIdForm}/avisos` : '/avisos',
        tag: 'aviso_nuevo',
      })
    }
  }

  revalidatePath('/avisos')
  return { success: true }
}
