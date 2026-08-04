'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { composePushBody, notifyMultipleUsers } from '@/lib/webpush'

/** Líder/pastor/admin envía push a todos los servidores de un ministerio. */
export async function notificarMinisterio(ministerioId: string, titulo: string, mensaje: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  if (!titulo?.trim() || !mensaje?.trim()) return { error: 'Escribe título y mensaje.' }

  const db = supabase as any
  const [{ data: perfil }, { data: mem }, { data: min }] = await Promise.all([
    db.from('profiles').select('rol').eq('id', user.id).single(),
    db.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    db.from('ministerios').select('nombre').eq('id', ministerioId).single(),
  ])

  const autorizado = mem?.es_lider === true || ['pastor', 'administrador'].includes(perfil?.rol)
  if (!autorizado) return { error: 'Solo el líder del ministerio puede notificar.' }

  const service = createServiceClient() as any
  const [{ data: miembros, error: miembrosError }, { data: preferencias }] = await Promise.all([
    service.from('ministerio_miembros').select('profile_id').eq('ministerio_id', ministerioId),
    service
      .from('notificaciones_preferencias')
      .select('profile_id')
      .eq('ministerio_id', ministerioId)
      .eq('activo', false),
  ])

  if (miembrosError) {
    console.error('[ministerio-notificar] No se pudieron leer los miembros:', miembrosError)
    return { error: 'No se pudo preparar el envío.' }
  }

  const desactivados = new Set((preferencias || []).map((item: any) => item.profile_id))
  const destinatarios = [...new Set(
    (miembros || [])
      .map((item: any) => item.profile_id as string)
      .filter((profileId: string) => !desactivados.has(profileId))
  )]

  const enviadas = await notifyMultipleUsers(service, destinatarios, {
    title: min?.nombre || 'Ministerio',
    body: composePushBody(titulo, mensaje),
    url: `/ministerios/${ministerioId}`,
    tag: `ministerio-${ministerioId}-${Date.now()}`,
    renotify: true,
  })

  return {
    success: true,
    enviadas,
    destinatarios: destinatarios.length,
    error: enviadas === 0
      ? 'El mensaje se guardó, pero no encontramos dispositivos activos. Pide a los miembros abrir VIDA para reconectar las notificaciones.'
      : undefined,
  }
}
