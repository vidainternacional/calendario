'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyMultipleUsers, notifyUsersOnceByReference } from '@/lib/webpush'
import { contextoPastoral } from '@/lib/auth/permisos'

import { validarAudienciaSedes, destinatariosSedes } from '@/lib/sedes/servidor'
import type { AudienciaSedes } from '@/lib/sedes/audiencias'

import { notificacionSedes } from '@/lib/sedes/notificacion'
import type { SupabaseClient } from '@supabase/supabase-js'

const AUDIENCIAS = ['iglesia', 'lideres', 'servidores', 'publico'] as const

type Audiencia = (typeof AUDIENCIAS)[number]


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
  seleccionSedes?: AudienciaSedes | null,
  revision?: string,
) {
  const { supabase, user, error } = await contextoPastoral('No tienes permiso para publicar paquetes pastorales.')
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  let scoped = seleccionSedes
  try { if (scoped) scoped = await validarAudienciaSedes(supabase as unknown as SupabaseClient, scoped) } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Revisa los destinatarios.' } }
  const audienciaFinal = scoped ? 'iglesia' as const : audienciaValida(audiencia)
  const { data: anterior } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('titulo, descripcion_publica, publicado, public_slug, published_at, vida_audiencia, updated_at')
    .eq('id', paqueteId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!anterior) return { success: false, error: 'No se encontró el paquete pastoral.' }
  if (revision && revision !== anterior.updated_at) return { success: false, error: 'El material cambió en otra ventana. Vuelve a cargar antes de guardar.' }

  const esPublicacionNueva = publicado && !Boolean(anterior.publicado)
  const cambios: Record<string, unknown> = {
    ...(scoped ? { vida_audiencia: scoped } : {}),
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
    .eq('updated_at', anterior.updated_at)
    .select('titulo, descripcion_publica, public_slug, audiencia, publicado, destacado, updated_at')
    .single()

  if (updateError || !data) {
    return { success: false, error: 'No se pudo actualizar la distribución del paquete.' }
  }

  let notificaciones = 0
  let aviso: string | undefined

  if (esPublicacionNueva) {
    try {
    const { admin, profileIds: historicos } = await destinatariosPorAudiencia(audienciaFinal)
    const profileIds = scoped || anterior.vida_audiencia ? await destinatariosSedes('paquete', paqueteId) : historicos
    const payload = notificacionSedes(scoped || anterior.vida_audiencia, {
      title: destacado ? '✨ Nuevo material importante' : '📖 Nuevo material de la iglesia',
      body: data.descripcion_publica
        ? `${data.titulo}: ${String(data.descripcion_publica).slice(0, 120)}`
        : `Ya está disponible “${data.titulo}”.`,
      url: `/material/${data.public_slug}`,
      tag: `pastoral-${paqueteId}`,
    })
    if (scoped || anterior.vida_audiencia) {
      const resultado = await notifyUsersOnceByReference(profileIds, payload, { tipo: 'paquete_sede', referenciaId: paqueteId })
      notificaciones = resultado.devices
    } else notificaciones = await notifyMultipleUsers(admin, profileIds, payload)
    } catch { aviso = 'El material está publicado. No se pudo confirmar el envío de avisos; revisa la audiencia antes de reintentar.' }
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
    aviso,
    revision: String(data.updated_at),
  }
}
