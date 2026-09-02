'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  PantryNeedStatus,
  SolidarityContactPreference,
  SolidarityContributionStatus,
  SolidarityContributionType,
  SolidarityRequestStatus,
} from '@/lib/solidarity/types'

const REQUEST_STATUSES: SolidarityRequestStatus[] = [
  'enviada',
  'revisando',
  'aprobada',
  'programada',
  'entregada',
  'rechazada',
  'cancelada',
]
const CONTRIBUTION_STATUSES: SolidarityContributionStatus[] = [
  'ofrecido',
  'contactando',
  'recibido',
  'asignado',
  'completado',
  'cancelado',
]
const CONTACTS: SolidarityContactPreference[] = ['aplicacion', 'telefono', 'whatsapp']
const CONTRIBUTION_TYPES: SolidarityContributionType[] = [
  'alimentos',
  'monetario',
  'voluntariado',
  'tiempo',
  'transporte',
  'herramientas',
  'objetos',
  'conocimientos',
  'oficios',
  'habilidades',
  'otro',
]
const PANTRY_STATUSES: PantryNeedStatus[] = ['activa', 'cubierta', 'pausada']

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

function revalidateSolidarity() {
  revalidatePath('/ayuda-solidaria')
  revalidatePath('/pastoral/ayuda-solidaria')
  revalidatePath('/admin/ayuda-solidaria')
  revalidatePath('/admin/analisis')
  revalidatePath('/admin')
  revalidatePath('/inicio')
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no válida.')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('activo, estado_cuenta, rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  if (!profile?.activo || profile?.estado_cuenta !== 'activo') {
    throw new Error('La cuenta no está activa.')
  }

  return { supabase, user, profile }
}

async function requireManager() {
  const context = await requireUser()
  const allowed = context.profile?.rol === 'pastor'
    || context.profile?.rol === 'administrador'
    || context.profile?.es_pastor_general === true
  if (!allowed) throw new Error('No tienes permiso para administrar Ayuda Solidaria.')
  return context
}

export async function crearSolicitudAyudaSolidaria(input: {
  householdSize?: number | null
  need: string
  additionalDetail?: string
  phone?: string
  contactPreference: SolidarityContactPreference
}) {
  const need = cleanText(input.need, 3000)
  const additionalDetail = cleanText(input.additionalDetail, 3000) || null
  const phone = cleanText(input.phone, 40) || null
  const rawHousehold = input.householdSize
  const householdSize = rawHousehold === null || rawHousehold === undefined || rawHousehold === 0
    ? null
    : Math.max(1, Math.min(30, Math.trunc(Number(rawHousehold))))

  if (!CONTACTS.includes(input.contactPreference)) return { success: false, error: 'Forma de contacto inválida.' }
  if (!need) return { success: false, error: 'Cuéntanos qué necesitas.' }
  if (rawHousehold !== null && rawHousehold !== undefined && rawHousehold !== 0 && !Number.isFinite(Number(rawHousehold))) {
    return { success: false, error: 'Cantidad de personas inválida.' }
  }
  if (input.contactPreference !== 'aplicacion' && !phone) {
    return { success: false, error: 'Agrega un teléfono para la forma de contacto seleccionada.' }
  }

  try {
    const { supabase, user } = await requireUser()
    const { error } = await (supabase as any)
      .from('solicitudes_ayuda_solidaria')
      .insert({
        profile_id: user.id,
        hogar_personas: householdSize,
        urgencia: 'normal',
        necesidad: need,
        detalle_adicional: additionalDetail,
        telefono: phone,
        contacto_preferido: input.contactPreference,
      })

    if (error) throw error
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] crear solicitud', error)
    return { success: false, error: 'No fue posible enviar el mensaje. Intenta nuevamente.' }
  }
}

export async function registrarAporteSolidario(input: {
  type: SolidarityContributionType
  amount?: number | null
  detail: string
  phone?: string
  anonymous?: boolean
  pantryNeedId?: string | null
}) {
  const detail = cleanText(input.detail, 2000)
  const phone = cleanText(input.phone, 40) || null
  const amount: number | null = input.type === 'monetario' ? Number(input.amount) : null
  const pantryNeedId = input.type === 'alimentos' && input.pantryNeedId ? String(input.pantryNeedId) : null

  if (!CONTRIBUTION_TYPES.includes(input.type)) return { success: false, error: 'Tipo de siembra inválido.' }
  if (!detail) return { success: false, error: 'Cuéntanos cómo te gustaría ayudar.' }
  if (input.type === 'monetario' && (amount === null || !Number.isFinite(amount) || amount <= 0)) {
    return { success: false, error: 'Ingresa un monto válido para la siembra.' }
  }
  if (pantryNeedId && !isUuid(pantryNeedId)) return { success: false, error: 'Necesidad de despensa inválida.' }

  try {
    const { supabase, user } = await requireUser()

    if (pantryNeedId) {
      const { data: need } = await (supabase as any)
        .from('despensa_necesidades')
        .select('id')
        .eq('id', pantryNeedId)
        .eq('estado', 'activa')
        .maybeSingle()
      if (!need) return { success: false, error: 'La necesidad seleccionada ya no está disponible.' }
    }

    const { error } = await (supabase as any)
      .from('aportes_ayuda_solidaria')
      .insert({
        profile_id: user.id,
        tipo: input.type,
        monto: amount,
        moneda: 'USD',
        detalle: detail,
        telefono: phone,
        anonimo: Boolean(input.anonymous),
        necesidad_despensa_id: pantryNeedId,
      })

    if (error) throw error
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] registrar aporte', error)
    return { success: false, error: 'No fue posible registrar tu siembra. Intenta nuevamente.' }
  }
}

export async function guardarNecesidadDespensa(input: {
  id?: string
  product: string
  unit: string
  currentStock: number
  minimumStock: number
  status: PantryNeedStatus
}) {
  const product = cleanText(input.product, 120)
  const unit = cleanText(input.unit, 40)
  const currentStock = Number(input.currentStock)
  const minimumStock = Number(input.minimumStock)

  if (!product) return { success: false, error: 'Escribe el producto o necesidad.' }
  if (!unit) return { success: false, error: 'Escribe la unidad.' }
  if (!Number.isFinite(currentStock) || currentStock < 0) return { success: false, error: 'Existencia actual inválida.' }
  if (!Number.isFinite(minimumStock) || minimumStock < 0) return { success: false, error: 'Mínimo necesario inválido.' }
  if (!PANTRY_STATUSES.includes(input.status)) return { success: false, error: 'Estado inválido.' }
  if (input.id && !isUuid(input.id)) return { success: false, error: 'Necesidad inválida.' }

  try {
    const { supabase, user } = await requireManager()
    const now = new Date().toISOString()

    if (input.id) {
      const { error } = await (supabase as any)
        .from('despensa_necesidades')
        .update({
          producto: product,
          unidad: unit,
          existencia_actual: currentStock,
          minimo_necesario: minimumStock,
          estado: input.status,
          updated_by: user.id,
          updated_at: now,
        })
        .eq('id', input.id)
      if (error) throw error
    } else {
      const { error } = await (supabase as any)
        .from('despensa_necesidades')
        .insert({
          producto: product,
          unidad: unit,
          existencia_actual: currentStock,
          minimo_necesario: minimumStock,
          estado: input.status,
          created_by: user.id,
          updated_by: user.id,
          created_at: now,
          updated_at: now,
        })
      if (error) throw error
    }

    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] guardar despensa', error)
    return { success: false, error: 'No fue posible guardar esta necesidad de despensa.' }
  }
}

export async function eliminarNecesidadDespensa(id: string) {
  if (!isUuid(id)) return { success: false, error: 'Necesidad inválida.' }

  try {
    const { supabase } = await requireManager()
    const { error } = await (supabase as any)
      .from('despensa_necesidades')
      .delete()
      .eq('id', id)
    if (error) throw error

    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] eliminar despensa', error)
    return { success: false, error: 'No fue posible eliminar esta necesidad de despensa.' }
  }
}

export async function cancelarSolicitudAyudaSolidaria(requestId: string) {
  if (!isUuid(requestId)) return { success: false, error: 'Mensaje inválido.' }

  try {
    const { user } = await requireUser()
    const service = createServiceClient()
    const { data: request } = await (service as any)
      .from('solicitudes_ayuda_solidaria')
      .select('profile_id, estado')
      .eq('id', requestId)
      .single()

    if (!request || request.profile_id !== user.id) return { success: false, error: 'No puedes modificar este mensaje.' }
    if (!['enviada', 'revisando', 'aprobada'].includes(request.estado)) {
      return { success: false, error: 'Este mensaje ya no puede cancelarse desde la aplicación.' }
    }

    const { error } = await (service as any)
      .from('solicitudes_ayuda_solidaria')
      .update({ estado: 'cancelada' })
      .eq('id', requestId)
    if (error) throw error

    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] cancelar solicitud', error)
    return { success: false, error: 'No fue posible cancelar el mensaje.' }
  }
}

export async function cancelarAporteSolidario(contributionId: string) {
  if (!isUuid(contributionId)) return { success: false, error: 'Siembra inválida.' }

  try {
    const { user } = await requireUser()
    const service = createServiceClient()
    const { data: contribution } = await (service as any)
      .from('aportes_ayuda_solidaria')
      .select('profile_id, estado')
      .eq('id', contributionId)
      .single()

    if (!contribution || contribution.profile_id !== user.id) return { success: false, error: 'No puedes modificar esta siembra.' }
    if (!['ofrecido', 'contactando', 'asignado'].includes(contribution.estado)) {
      return { success: false, error: 'Esta siembra ya no puede cancelarse desde la aplicación.' }
    }

    const { error } = await (service as any)
      .from('aportes_ayuda_solidaria')
      .update({ estado: 'cancelado' })
      .eq('id', contributionId)
    if (error) throw error

    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] cancelar aporte', error)
    return { success: false, error: 'No fue posible cancelar la siembra.' }
  }
}

export async function actualizarSolicitudAyudaSolidaria(input: {
  id: string
  status: SolidarityRequestStatus
  response?: string
}) {
  if (!isUuid(input.id) || !REQUEST_STATUSES.includes(input.status)) {
    return { success: false, error: 'Mensaje o estado inválido.' }
  }

  const response = cleanText(input.response, 2000)
  if (input.status === 'rechazada' && !response) {
    return { success: false, error: 'Escribe una nota breve para explicar cómo puede continuar la persona.' }
  }

  try {
    const { user } = await requireManager()
    const service = createServiceClient()
    const now = new Date().toISOString()
    const { error } = await (service as any)
      .from('solicitudes_ayuda_solidaria')
      .update({
        estado: input.status,
        respuesta: response || null,
        revisado_por: user.id,
        revisado_at: now,
        entregado_at: input.status === 'entregada' ? now : null,
      })
      .eq('id', input.id)

    if (error) throw error
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] actualizar solicitud', error)
    return { success: false, error: 'No fue posible actualizar el mensaje.' }
  }
}

export async function actualizarAporteSolidario(input: {
  id: string
  status: SolidarityContributionStatus
  response?: string
}) {
  if (!isUuid(input.id) || !CONTRIBUTION_STATUSES.includes(input.status)) {
    return { success: false, error: 'Siembra o estado inválido.' }
  }

  try {
    const { user } = await requireManager()
    const service = createServiceClient()
    const { error } = await (service as any)
      .from('aportes_ayuda_solidaria')
      .update({
        estado: input.status,
        respuesta: cleanText(input.response, 2000) || null,
        revisado_por: user.id,
        revisado_at: new Date().toISOString(),
      })
      .eq('id', input.id)

    if (error) throw error
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] actualizar aporte', error)
    return { success: false, error: 'No fue posible actualizar la siembra.' }
  }
}
