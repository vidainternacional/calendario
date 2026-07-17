'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  revalidatePath('/avisos')
  return { success: true }
}
