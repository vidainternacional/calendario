'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearAviso(
  ministerioId: string,
  _state: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const titulo = formData.get('titulo') as string
  const cuerpo = formData.get('cuerpo') as string

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
    ministerio_id: ministerioId,
    autor_id: user.id,
    tipo: 'aviso',
    titulo,
    cuerpo,
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/ministerios/${ministerioId}/avisos`)
}
