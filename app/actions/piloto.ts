'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PilotIssueStatus, PilotRole } from '@/lib/pilot/types'

function esUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no válida.')
  return { supabase, user }
}

async function requirePilotManager() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, activo, estado_cuenta, es_pastor_general')
    .eq('id', user.id)
    .single()

  const permitido = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (
      profile?.rol === 'pastor'
      || profile?.rol === 'administrador'
      || profile?.es_pastor_general === true
    )

  if (!permitido) throw new Error('No tienes permiso para administrar el piloto.')
  return { supabase, user }
}

export async function agregarParticipantePiloto(profileId: string) {
  if (!esUuid(profileId)) return { success: false, error: 'Usuario inválido.' }

  try {
    const { supabase, user } = await requirePilotManager()
    const { error } = await (supabase as any)
      .from('pilot_participants')
      .upsert({
        profile_id: profileId,
        active: true,
        cohort: 'piloto-inicial',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })

    if (error) throw error
    revalidatePath('/admin/analisis')
    return { success: true }
  } catch (error) {
    console.error('[piloto] agregar participante', error)
    return { success: false, error: 'No fue posible agregar a la persona al piloto.' }
  }
}

export async function desactivarParticipantePiloto(profileId: string) {
  if (!esUuid(profileId)) return { success: false, error: 'Usuario inválido.' }

  try {
    const { supabase } = await requirePilotManager()
    const { error } = await (supabase as any)
      .from('pilot_participants')
      .update({ active: false })
      .eq('profile_id', profileId)

    if (error) throw error
    revalidatePath('/admin/analisis')
    return { success: true }
  } catch (error) {
    console.error('[piloto] desactivar participante', error)
    return { success: false, error: 'No fue posible retirar a la persona del piloto.' }
  }
}

export async function guardarProgresoOnboarding(input: {
  role: PilotRole
  currentStep: number
  completed: boolean
  notificationsPrompted?: boolean
  notificationsEnabled?: boolean | null
}) {
  try {
    const { supabase, user } = await requireUser()
    const currentStep = Number.isFinite(input.currentStep) ? Math.max(0, Math.trunc(input.currentStep)) : 0
    const completedAt = input.completed ? new Date().toISOString() : null

    const { error } = await (supabase as any)
      .from('pilot_onboarding_progress')
      .upsert({
        profile_id: user.id,
        role_snapshot: input.role,
        onboarding_version: 1,
        current_step: currentStep,
        completed: input.completed,
        notifications_prompted: Boolean(input.notificationsPrompted),
        notifications_enabled: input.notificationsEnabled ?? null,
        completed_at: completedAt,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[piloto] guardar onboarding', error)
    return { success: false, error: 'No fue posible guardar el progreso del recorrido.' }
  }
}

export async function crearReportePiloto(input: {
  role: PilotRole
  route: string
  description: string
  expectedResult?: string
  deviceInfo?: Record<string, unknown>
}) {
  const description = input.description.trim()
  const expectedResult = input.expectedResult?.trim() || null

  if (description.length < 5 || description.length > 4000) {
    return { success: false, error: 'Describe el problema con un poco más de detalle.' }
  }

  try {
    const { supabase, user } = await requireUser()
    const { error } = await (supabase as any)
      .from('pilot_issue_reports')
      .insert({
        profile_id: user.id,
        role_snapshot: input.role,
        route: input.route.slice(0, 240),
        description,
        expected_result: expectedResult,
        device_info: input.deviceInfo || {},
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[piloto] crear reporte', error)
    return { success: false, error: 'No fue posible enviar el reporte.' }
  }
}

export async function actualizarEstadoReportePiloto(reportId: string, status: PilotIssueStatus) {
  if (!esUuid(reportId) || !['nuevo', 'revisando', 'resuelto'].includes(status)) {
    return { success: false, error: 'Reporte inválido.' }
  }

  try {
    const { supabase } = await requirePilotManager()
    const { error } = await (supabase as any)
      .from('pilot_issue_reports')
      .update({
        status,
        resolved_at: status === 'resuelto' ? new Date().toISOString() : null,
      })
      .eq('id', reportId)

    if (error) throw error
    revalidatePath('/admin/analisis')
    return { success: true }
  } catch (error) {
    console.error('[piloto] actualizar reporte', error)
    return { success: false, error: 'No fue posible actualizar el reporte.' }
  }
}
