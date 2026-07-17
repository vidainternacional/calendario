'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ────────────────────────────────────────────────────────────────────────────
// PROPONER INTERCAMBIO
// ────────────────────────────────────────────────────────────────────────────
export async function proponerIntercambio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const asignacion_origen_id = formData.get('asignacion_origen_id') as string
  const destinatario_id = formData.get('destinatario_id') as string
  const mensaje = formData.get('mensaje') as string

  if (!asignacion_origen_id) return { error: 'Datos incompletos' }

  // Use .from<any> to bypass strict generated types that don't include Insert
  const db = supabase as any
  const { error } = await db.from('intercambios').insert({
    asignacion_origen_id,
    solicitante_id: user.id,
    destinatario_id: destinatario_id || null,
    mensaje: mensaje || null,
    estado: 'pendiente',
  })

  if (error) {
    console.error('Error proponiendo intercambio:', error)
    return { error: 'Error al proponer el intercambio' }
  }

  revalidatePath('/calendario')
  revalidatePath('/intercambios')
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// ACEPTAR INTERCAMBIO
// ────────────────────────────────────────────────────────────────────────────
export async function aceptarIntercambio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const intercambio_id = formData.get('intercambio_id') as string
  if (!intercambio_id) return { error: 'Falta el ID' }

  const db = supabase as any

  // Obtener la info del intercambio
  const { data: exchange, error: fetchErr } = await db
    .from('intercambios')
    .select('*')
    .eq('id', intercambio_id)
    .single()

  if (fetchErr || !exchange) return { error: 'Intercambio no encontrado' }
  if (exchange.estado !== 'pendiente') return { error: 'Este intercambio ya no está pendiente' }

  // Transferir asignación al usuario que acepta
  const { error: asigErr } = await db
    .from('evento_asignaciones')
    .update({ profile_id: user.id, estado: 'asignado' })
    .eq('id', exchange.asignacion_origen_id)

  if (asigErr) {
    console.error('Error transfiriendo asignacion:', asigErr)
    return { error: 'Error al transferir la asignación' }
  }

  // Marcar intercambio como aceptado
  const { error: updateErr } = await db
    .from('intercambios')
    .update({
      estado: 'aceptado',
      resuelto_at: new Date().toISOString(),
      destinatario_id: exchange.destinatario_id || user.id,
    })
    .eq('id', intercambio_id)

  if (updateErr) {
    console.error('Error actualizando intercambio:', updateErr)
  }

  revalidatePath('/calendario')
  revalidatePath('/intercambios')
  return { success: true }
}

// ────────────────────────────────────────────────────────────────────────────
// RECHAZAR INTERCAMBIO
// ────────────────────────────────────────────────────────────────────────────
export async function rechazarIntercambio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const intercambio_id = formData.get('intercambio_id') as string
  if (!intercambio_id) return { error: 'Falta el ID' }

  const db = supabase as any
  const { error } = await db
    .from('intercambios')
    .update({
      estado: 'rechazado',
      resuelto_at: new Date().toISOString(),
    })
    .eq('id', intercambio_id)
    .eq('destinatario_id', user.id) // solo el destinatario puede rechazar

  if (error) {
    console.error('Error rechazando intercambio:', error)
    return { error: 'Error al rechazar el intercambio' }
  }

  revalidatePath('/calendario')
  revalidatePath('/intercambios')
  return { success: true }
}
