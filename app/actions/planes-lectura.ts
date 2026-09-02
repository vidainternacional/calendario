'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completarDiaPlan(planId: string, numeroDia: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión para guardar tu progreso.' }
  if (!planId || !Number.isInteger(numeroDia) || numeroDia < 1) {
    return { error: 'Lectura no válida.' }
  }

  const { data: dia, error: diaError } = await (supabase as any)
    .from('planes_lectura_dias')
    .select('plan_id, numero_dia')
    .eq('plan_id', planId)
    .eq('numero_dia', numeroDia)
    .maybeSingle()

  if (diaError || !dia) return { error: 'No encontramos este día del plan.' }

  const ahora = new Date().toISOString()
  const { error: inscripcionError } = await (supabase as any)
    .from('planes_lectura_usuario')
    .upsert(
      { profile_id: user.id, plan_id: planId, ultimo_acceso_en: ahora },
      { onConflict: 'profile_id,plan_id' }
    )

  if (inscripcionError) return { error: 'No pudimos iniciar el seguimiento del plan.' }

  const { error: progresoError } = await (supabase as any)
    .from('planes_lectura_dias_progreso')
    .upsert(
      { profile_id: user.id, plan_id: planId, numero_dia: numeroDia, completado_en: ahora },
      { onConflict: 'profile_id,plan_id,numero_dia', ignoreDuplicates: true }
    )

  if (progresoError) return { error: 'No pudimos guardar este día como completado.' }

  const [{ count }, { data: plan }] = await Promise.all([
    (supabase as any)
      .from('planes_lectura_dias_progreso')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('plan_id', planId),
    (supabase as any)
      .from('planes_lectura')
      .select('duracion_dias')
      .eq('id', planId)
      .maybeSingle(),
  ])

  const planCompletado = Number(count ?? 0) >= Number(plan?.duracion_dias ?? Number.MAX_SAFE_INTEGER)

  await (supabase as any)
    .from('planes_lectura_usuario')
    .update({
      ultimo_acceso_en: ahora,
      ...(planCompletado ? { completado_en: ahora } : {}),
    })
    .eq('profile_id', user.id)
    .eq('plan_id', planId)

  revalidatePath('/hoy')
  revalidatePath(`/hoy/planes/${planId}/${numeroDia}`)

  return { success: true, planCompletado }
}
