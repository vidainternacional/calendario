'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/webpush'

/** Líder/pastor/admin envía push a todos los servidores de un ministerio. */
export async function notificarMinisterio(ministerioId: string, titulo: string, mensaje: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  if (!titulo?.trim() || !mensaje?.trim()) return { error: 'Escribe título y mensaje.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: perfil }, { data: mem }, { data: min }] = await Promise.all([
    db.from('profiles').select('rol').eq('id', user.id).single(),
    db.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    db.from('ministerios').select('nombre, emoji').eq('id', ministerioId).single(),
  ])

  const autorizado = mem?.es_lider === true || ['pastor', 'administrador'].includes(perfil?.rol)
  if (!autorizado) return { error: 'Solo el líder del ministerio puede notificar.' }

  const { data: miembros } = await db.from('ministerio_miembros').select('profile_id').eq('ministerio_id', ministerioId)

  let enviadas = 0
  for (const m of miembros ?? []) {
    await notifyUser(supabase, m.profile_id, {
      title: `${min?.emoji ?? '⛪'} ${min?.nombre ?? 'Tu ministerio'}: ${titulo.trim()}`,
      body: mensaje.trim().slice(0, 300),
      url: `/ministerios/${ministerioId}`,
      tag: `min-${ministerioId}`,
    })
    enviadas++
  }
  return { success: true, enviadas }
}
