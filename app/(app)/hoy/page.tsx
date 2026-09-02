import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VidaHoyClient, { type VidaPlanSummary } from '@/components/biblia/VidaHoyClient'

export const metadata: Metadata = { title: 'Hoy en VIDA' }

export default async function HoyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [preferenciaResult, planesResult, diasResult, progresoResult] = await Promise.all([
    (supabase as any)
      .from('versiculo_diario_preferencias')
      .select('activo, hora_local')
      .eq('profile_id', user.id)
      .maybeSingle(),
    (supabase as any)
      .from('planes_lectura')
      .select('id, titulo, descripcion, duracion_dias')
      .eq('publicado', true)
      .order('duracion_dias', { ascending: true }),
    (supabase as any)
      .from('planes_lectura_dias')
      .select('plan_id, numero_dia, referencia')
      .order('numero_dia', { ascending: true }),
    (supabase as any)
      .from('planes_lectura_dias_progreso')
      .select('plan_id, numero_dia')
      .eq('profile_id', user.id),
  ])

  const preferencia = preferenciaResult.data
  const planes = Array.isArray(planesResult.data) ? planesResult.data : []
  const dias = Array.isArray(diasResult.data) ? diasResult.data : []
  const progreso = Array.isArray(progresoResult.data) ? progresoResult.data : []
  const completados = new Set(progreso.map((item: any) => `${item.plan_id}:${item.numero_dia}`))

  const summaries: VidaPlanSummary[] = planes.map((plan: any) => {
    const planDays = dias.filter((dia: any) => dia.plan_id === plan.id)
    const completed = planDays.filter((dia: any) => completados.has(`${plan.id}:${dia.numero_dia}`)).length
    const next = planDays.find((dia: any) => !completados.has(`${plan.id}:${dia.numero_dia}`)) ?? planDays[planDays.length - 1]

    return {
      id: String(plan.id),
      title: String(plan.titulo),
      description: String(plan.descripcion),
      total: Number(plan.duracion_dias),
      completed,
      nextDay: Number(next?.numero_dia ?? 1),
      nextLabel: String(next?.referencia ?? 'Abrir lectura'),
      done: completed >= Number(plan.duracion_dias),
    }
  })

  return (
    <VidaHoyClient
      initialActive={Boolean(preferencia?.activo)}
      initialHour={Number.isInteger(preferencia?.hora_local) ? Number(preferencia.hora_local) : 7}
      plans={summaries}
    />
  )
}
