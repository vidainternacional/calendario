'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PantryNeedStatus } from '@/lib/solidarity/types'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

async function requireManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no válida.')
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('activo, estado_cuenta, rol, es_pastor_general')
    .eq('id', user.id)
    .single()
  const allowed = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile?.rol === 'pastor' || profile?.rol === 'administrador' || profile?.es_pastor_general === true)
  if (!allowed) throw new Error('No tienes permiso para administrar Ayuda Solidaria.')
  return { supabase, user }
}

function refresh() {
  revalidatePath('/ayuda-solidaria')
  revalidatePath('/perfil')
  revalidatePath('/inicio')
}

export async function guardarNecesidadServicio(input: {
  id?: string
  category: string
  title: string
  detail?: string
  status: PantryNeedStatus
}) {
  const category = cleanText(input.category, 80) || 'habilidades'
  const title = cleanText(input.title, 140)
  const detail = cleanText(input.detail, 1000) || null
  if (!title) return { success: false, error: 'Escribe la necesidad.' }
  if (!['activa', 'cubierta', 'pausada'].includes(input.status)) return { success: false, error: 'Estado inválido.' }
  if (input.id && !isUuid(input.id)) return { success: false, error: 'Necesidad inválida.' }

  try {
    const { supabase, user } = await requireManager()
    const payload = { categoria: category, titulo: title, detalle: detail, estado: input.status, updated_by: user.id, updated_at: new Date().toISOString() }
    const query = input.id
      ? (supabase as any).from('ayuda_necesidades_servicio').update(payload).eq('id', input.id)
      : (supabase as any).from('ayuda_necesidades_servicio').insert({ ...payload, created_by: user.id })
    const { error } = await query
    if (error) throw error
    refresh()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad-inventario] guardar necesidad servicio', error)
    return { success: false, error: 'No fue posible guardar la necesidad.' }
  }
}

export async function eliminarNecesidadServicio(id: string) {
  if (!isUuid(id)) return { success: false, error: 'Necesidad inválida.' }
  try {
    const { supabase } = await requireManager()
    const { error } = await (supabase as any).from('ayuda_necesidades_servicio').delete().eq('id', id)
    if (error) throw error
    refresh()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad-inventario] eliminar necesidad servicio', error)
    return { success: false, error: 'No fue posible eliminar la necesidad.' }
  }
}

export async function guardarPaqueteDespensa(input: { id?: string; name: string; active?: boolean; makeDefault?: boolean }) {
  const name = cleanText(input.name, 120)
  if (!name) return { success: false, error: 'Escribe el nombre del paquete.' }
  if (input.id && !isUuid(input.id)) return { success: false, error: 'Paquete inválido.' }

  try {
    const { supabase, user } = await requireManager()
    if (input.makeDefault) {
      const { error: clearError } = await (supabase as any).from('despensa_paquetes').update({ es_predeterminado: false, updated_by: user.id, updated_at: new Date().toISOString() }).eq('es_predeterminado', true)
      if (clearError) throw clearError
    }
    const payload = {
      nombre: name,
      activo: input.active !== false,
      es_predeterminado: Boolean(input.makeDefault),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }
    const query = input.id
      ? (supabase as any).from('despensa_paquetes').update(payload).eq('id', input.id)
      : (supabase as any).from('despensa_paquetes').insert({ ...payload, created_by: user.id })
    const { error } = await query
    if (error) throw error
    refresh()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad-inventario] guardar paquete', error)
    return { success: false, error: 'No fue posible guardar el paquete.' }
  }
}

export async function guardarItemPaqueteDespensa(input: { packageId: string; needId: string; quantity: number }) {
  if (!isUuid(input.packageId) || !isUuid(input.needId)) return { success: false, error: 'Producto o paquete inválido.' }
  const quantity = Number(input.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, error: 'Cantidad inválida.' }
  try {
    const { supabase } = await requireManager()
    const { error } = await (supabase as any)
      .from('despensa_paquete_items')
      .upsert({ paquete_id: input.packageId, necesidad_id: input.needId, cantidad: quantity, updated_at: new Date().toISOString() }, { onConflict: 'paquete_id,necesidad_id' })
    if (error) throw error
    refresh()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad-inventario] guardar item paquete', error)
    return { success: false, error: 'No fue posible guardar el producto del paquete.' }
  }
}

export async function eliminarItemPaqueteDespensa(id: string) {
  if (!isUuid(id)) return { success: false, error: 'Producto del paquete inválido.' }
  try {
    const { supabase } = await requireManager()
    const { error } = await (supabase as any).from('despensa_paquete_items').delete().eq('id', id)
    if (error) throw error
    refresh()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad-inventario] eliminar item paquete', error)
    return { success: false, error: 'No fue posible quitar el producto del paquete.' }
  }
}
