'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notifyMultipleUsers } from '@/lib/webpush'

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

async function destinatariosPorAudiencia(audiencia: Audiencia) {
  const admin = createAdminClient() as any
  let consulta = admin
    .from('profiles')
    .select('id')
    .eq('estado_cuenta', 'activo')

  if (audiencia === 'lideres') {
    consulta = consulta.in('rol', ['lider', 'pastor', 'administrador'])
  } else if (audiencia === 'servidores') {
    consulta = consulta.in('rol', ['servidor', 'lider', 'pastor', 'administrador'])
  }

  const { data, error } = await consulta
  if (error) {
    console.error('[pastoral] No se pudieron obtener destinatarios:', error)
    return { admin, profileIds: [] as string[] }
  }

  return {
    admin,
    profileIds: (data ?? []).map((perfil: { id: string }) => perfil.id),
  }
}

export async function actualizarDistribucionPaquete(
  paqueteId: string,
  audiencia: string,
  publicado: boolean,
  destacado = false,
) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const audienciaFinal = audienciaValida(audiencia)
  const { data: anterior } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('titulo, descripcion_publica, publicado, public_slug, published_at')
    .eq('id', paqueteId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!anterior) return { success: false, error: 'No se encontró el paquete pastoral.' }

  const esPublicacionNueva = publicado && !Boolean(anterior.publicado)
  const cambios: Record<string, unknown> = {
    audiencia: audienciaFinal,
    publicado,
    destacado: Boolean(destacado),
    updated_at: new Date().toISOString(),
  }

  if (esPublicacionNueva) cambios.published_at = new Date().toISOString()
  if (!publicado) cambios.published_at = null

  const { data, error: updateError } = await (supabase as any)
    .from('pastoral_paquetes')
    .update(cambios)
    .eq('id', paqueteId)
    .eq('profile_id', user.id)
    .select('titulo, descripcion_publica, public_slug, audiencia, publicado, destacado')
    .single()

  if (updateError || !data) {
    return { success: false, error: 'No se pudo actualizar la distribución del paquete.' }
  }

  let notificaciones = 0

  if (esPublicacionNueva) {
    const { admin, profileIds } = await destinatariosPorAudiencia(audienciaFinal)
    notificaciones = await notifyMultipleUsers(admin, profileIds, {
      title: destacado ? '✨ Nuevo material importante' : '📖 Nuevo material de la iglesia',
      body: data.descripcion_publica
        ? `${data.titulo}: ${String(data.descripcion_publica).slice(0, 120)}`
        : `Ya está disponible “${data.titulo}”.`,
      url: `/material/${data.public_slug}`,
      tag: `pastoral-${paqueteId}`,
    })
  }

  revalidatePath('/inicio')
  revalidatePath('/pastoral')
  revalidatePath('/pastoral/paquetes')
  revalidatePath(`/pastoral/paquetes/${paqueteId}`)
  revalidatePath(`/material/${data.public_slug}`)

  return {
    success: true,
    publicSlug: data.public_slug as string,
    audiencia: data.audiencia as Audiencia,
    publicado: Boolean(data.publicado),
    destacado: Boolean(data.destacado),
    notificaciones,
  }
}
