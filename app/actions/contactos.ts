'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/webpush'
import { revalidatePath } from 'next/cache'

/** Busca un perfil por su token de QR y envía solicitud de contacto. */
export async function enviarSolicitudPorQr(qrToken: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const token = qrToken.trim().replace(/^vida:/, '')
  if (!token) return { error: 'QR inválido' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: target } = await db
    .from('profiles')
    .select('id, nombre_completo')
    .eq('qr_token', token)
    .maybeSingle()

  if (!target) return { error: 'Este QR no pertenece a ningún usuario de la app.' }
  if (target.id === user.id) return { error: '¡Ese es tu propio QR! 😄' }

  // ¿Ya existe relación en cualquier dirección?
  const { data: existente } = await db
    .from('contactos')
    .select('id, estado, solicitante_id')
    .or(`and(solicitante_id.eq.${user.id},destinatario_id.eq.${target.id}),and(solicitante_id.eq.${target.id},destinatario_id.eq.${user.id})`)
    .maybeSingle()

  if (existente) {
    if (existente.estado === 'aceptado') return { error: `${target.nombre_completo} ya está en tus contactos.` }
    if (existente.estado === 'pendiente') return { error: 'Ya hay una solicitud pendiente entre ustedes.' }
    // rechazado → permitir reintento: eliminar la vieja
    await db.from('contactos').delete().eq('id', existente.id)
  }

  const { error } = await db.from('contactos').insert({
    solicitante_id: user.id,
    destinatario_id: target.id,
  })
  if (error) return { error: 'No se pudo enviar la solicitud.' }

  // Notificación push al destinatario
  const { data: yo } = await db.from('profiles').select('nombre_completo').eq('id', user.id).single()
  await notifyUser(supabase, target.id, {
    title: 'Nueva solicitud de contacto 🤝',
    body: `${yo?.nombre_completo ?? 'Alguien'} desea agregarte a sus contactos.`,
    url: '/contactos',
    tag: 'contacto',
  })

  revalidatePath('/contactos')
  return { success: true, nombre: target.nombre_completo }
}

export async function responderSolicitudContacto(id: string, aceptar: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: sol } = await db
    .from('contactos')
    .select('id, solicitante_id, destinatario_id, estado')
    .eq('id', id)
    .eq('destinatario_id', user.id)
    .maybeSingle()

  if (!sol || sol.estado !== 'pendiente') return { error: 'Solicitud no encontrada.' }

  const { error } = await db
    .from('contactos')
    .update({ estado: aceptar ? 'aceptado' : 'rechazado', resuelto_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: 'No se pudo actualizar.' }

  if (aceptar) {
    const { data: yo } = await db.from('profiles').select('nombre_completo').eq('id', user.id).single()
    await notifyUser(supabase, sol.solicitante_id, {
      title: '¡Solicitud aceptada! 🎉',
      body: `${yo?.nombre_completo ?? 'Tu solicitud'} aceptó tu solicitud de contacto.`,
      url: '/contactos',
      tag: 'contacto',
    })
  }

  revalidatePath('/contactos')
  return { success: true }
}

export async function eliminarContacto(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('contactos').delete().eq('id', id)
  revalidatePath('/contactos')
  return { success: true }
}
