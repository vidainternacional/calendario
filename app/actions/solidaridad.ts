'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type {
  SolidarityContactPreference,
  SolidarityContributionStatus,
  SolidarityContributionType,
  SolidarityRequestStatus,
  SolidarityUrgency,
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
const URGENCIES: SolidarityUrgency[] = ['normal', 'prioritaria', 'urgente']
const CONTACTS: SolidarityContactPreference[] = ['aplicacion', 'telefono', 'whatsapp']
const CONTRIBUTION_TYPES: SolidarityContributionType[] = ['alimentos', 'monetario', 'voluntariado', 'otro']

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

function revalidateSolidarity() {
  revalidatePath('/ayuda-solidaria')
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

async function trackEvent(supabase: any, profileId: string, eventName: string) {
  try {
    await supabase.from('pilot_usage_events').insert({
      profile_id: profileId,
      event_name: eventName,
      route: '/ayuda-solidaria',
      metadata: {},
    })
  } catch {
    // La telemetría es complementaria y nunca debe bloquear la solicitud.
  }
}

export async function crearSolicitudAyudaSolidaria(input: {
  householdSize: number
  urgency: SolidarityUrgency
  need: string
  phone?: string
  contactPreference: SolidarityContactPreference
}) {
  const householdSize = Math.max(1, Math.min(30, Math.trunc(Number(input.householdSize) || 1)))
  const need = cleanText(input.need, 3000)
  const phone = cleanText(input.phone, 40) || null

  if (!URGENCIES.includes(input.urgency)) return { success: false, error: 'Nivel de urgencia inválido.' }
  if (!CONTACTS.includes(input.contactPreference)) return { success: false, error: 'Forma de contacto inválida.' }
  if (need.length < 10) return { success: false, error: 'Explique brevemente la necesidad para poder orientarle.' }
  if (input.contactPreference !== 'aplicacion' && !phone) {
    return { success: false, error: 'Agregue un teléfono para la forma de contacto seleccionada.' }
  }

  try {
    const { supabase, user } = await requireUser()
    const { error } = await (supabase as any)
      .from('solicitudes_ayuda_solidaria')
      .insert({
        profile_id: user.id,
        hogar_personas: householdSize,
        urgencia: input.urgency,
        necesidad: need,
        telefono: phone,
        contacto_preferido: input.contactPreference,
      })

    if (error) throw error
    await trackEvent(supabase, user.id, 'solidarity_request_created')
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] crear solicitud', error)
    return { success: false, error: 'No fue posible enviar la solicitud. Intente nuevamente.' }
  }
}

export async function registrarAporteSolidario(input: {
  type: SolidarityContributionType
  amount?: number | null
  detail: string
  phone?: string
  anonymous?: boolean
}) {
  const detail = cleanText(input.detail, 2000)
  const phone = cleanText(input.phone, 40) || null
  const amount: number | null = input.type === 'monetario' ? Number(input.amount) : null

  if (!CONTRIBUTION_TYPES.includes(input.type)) return { success: false, error: 'Tipo de aporte inválido.' }
  if (detail.length < 5) return { success: false, error: 'Describa brevemente cómo desea colaborar.' }
  if (input.type === 'monetario' && (amount === null || !Number.isFinite(amount) || amount <= 0)) {
    return { success: false, error: 'Ingrese un monto válido para la siembra.' }
  }

  try {
    const { supabase, user } = await requireUser()
    const { error } = await (supabase as any)
      .from('aportes_ayuda_solidaria')
      .insert({
        profile_id: user.id,
        tipo: input.type,
        monto: amount,
        moneda: 'USD',
        detalle,
        telefono: phone,
        anonimo: Boolean(input.anonymous),
      })

    if (error) throw error
    await trackEvent(supabase, user.id, 'solidarity_contribution_created')
    revalidateSolidarity()
    return { success: true }
  } catch (error) {
    console.error('[solidaridad] registrar aporte', error)
    return { success: false, error: 'No fue posible registrar el aporte. Intente nuevamente.' }
  }
}

export async function cancelarSolicitudAyudaSolidaria(requestId: string) {
  if (!isUuid(requestId)) return { success: false, error: 'Solicitud inválida.' }

  try {
    const { user } = await requireUser()
    const service = createServiceClient()
    const { data: request } = await (service as any)
      .from('solicitudes_ayuda_solidaria')
      .select('profile_id, estado')
      .eq('id', requestId)
      .single()

    if (!request || request.profile_id !== user.id) return { success: false, error: 'No puede modificar esta solicitud.' }
    if (!['enviada', 'revisando'].includes(request.estado)) {
      return { success: false, error: 'Esta solicitud ya no puede cancelarse desde la aplicación.' }
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
    return { success: false, error: 'No fue posible cancelar la solicitud.' }
  }
}

export async function cancelarAporteSolidario(contributionId: string) {
  if (!isUuid(contributionId)) return { success: false, error: 'Aporte inválido.' }

  try {
    const { user } = await requireUser()
    const service = createServiceClient()
    const { data: contribution } = await (service as any)
      .from('aportes_ayuda_solidaria')
      .select('profile_id, estado')
      .eq('id', contributionId)
      .single()

    if (!contribution || contribution.profile_id !== user.id) return { success: false, error: 'No puede modificar este aporte.' }
    if (!['ofrecido', 'contactando'].includes(contribution.estado)) {
      return { success: false, error: 'Este aporte ya no puede cancelarse desde la aplicación.' }
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
    return { success: false, error: 'No fue posible cancelar el aporte.' }
  }
}

export async function actualizarSolicitudAyudaSolidaria(input: {
  id: string
  status: SolidarityRequestStatus
  response?: string
}) {
  if (!isUuid(input.id) || !REQUEST_STATUSES.includes(input.status)) {
    return { success: false, error: 'Solicitud o estado inválido.' }
  }

  try {
    const { user } = await requireManager()
    const service = createServiceClient()
    const now = new Date().toISOString()
    const { error } = await (service as any)
      .from('solicitudes_ayuda_solidaria')
      .update({
        estado: input.status,
        respuesta: cleanText(input.response, 2000) || null,
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
    return { success: false, error: 'No fue posible actualizar la solicitud.' }
  }
}

export async function actualizarAporteSolidario(input: {
  id: string
  status: SolidarityContributionStatus
  response?: string
}) {
  if (!isUuid(input.id) || !CONTRIBUTION_STATUSES.includes(input.status)) {
    return { success: false, error: 'Aporte o estado inválido.' }
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
    return { success: false, error: 'No fue posible actualizar el aporte.' }
  }
}
