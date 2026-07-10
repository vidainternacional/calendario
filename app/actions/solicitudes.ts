'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function actualizarEstadoSolicitud(id: string, estado: 'aprobada' | 'rechazada', path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Podríamos volver a verificar permisos aquí (ideal para prod) pero nos fiaremos del RLS y de la UI por ahora
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('solicitudes')
    .update({ 
      estado,
      revisado_por: user.id,
      resuelto_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(path)
}

export async function crearSolicitud(
  ministerioId: string,
  _state: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const titulo = formData.get('titulo') as string
  const detalle = formData.get('detalle') as string
  const tipo = formData.get('tipo') as 'salon' | 'equipo_sonido' | 'presupuesto' | 'otro'

  if (!titulo || !detalle || !tipo) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('solicitudes').insert({
    ministerio_id: ministerioId,
    solicitado_por: user.id,
    titulo,
    detalle,
    tipo,
    estado: 'pendiente'
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/ministerios/${ministerioId}/solicitudes`)
}

