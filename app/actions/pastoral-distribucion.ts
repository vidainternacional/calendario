'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const AUDIENCIAS = ['iglesia', 'lideres', 'servidores', 'publico'] as const

type Audiencia = (typeof AUDIENCIAS)[number]

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
    return { supabase, user, error: 'No tienes permiso para publicar paquetes pastorales.' }
  }

  return { supabase, user, error: null }
}

function audienciaValida(valor: string): Audiencia {
  return AUDIENCIAS.includes(valor as Audiencia) ? valor as Audiencia : 'iglesia'
}

export async function actualizarDistribucionPaquete(
  paqueteId: string,
  audiencia: string,
  publicado: boolean,
) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { data, error: updateError } = await (supabase as any)
    .from('pastoral_paquetes')
    .update({
      audiencia: audienciaValida(audiencia),
      publicado,
      published_at: publicado ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paqueteId)
    .eq('profile_id', user.id)
    .select('public_slug, audiencia, publicado')
    .single()

  if (updateError || !data) {
    return { success: false, error: 'No se pudo actualizar la distribución del paquete.' }
  }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/paquetes')
  revalidatePath(`/pastoral/paquetes/${paqueteId}`)
  revalidatePath(`/material/${data.public_slug}`)

  return {
    success: true,
    publicSlug: data.public_slug as string,
    audiencia: data.audiencia as Audiencia,
    publicado: Boolean(data.publicado),
  }
}
