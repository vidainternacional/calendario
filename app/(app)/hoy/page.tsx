import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VidaHoyClient, { type VidaPlanSummary } from '@/components/biblia/VidaHoyClient'

export const metadata: Metadata = { title: 'Hoy en VIDA' }

function vidaDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function previousDayKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day - 1, 12))
  return date.toISOString().slice(0, 10)
}

function calculateStreak(completedAt: Array<string | null | undefined>) {
  const dates = new Set(completedAt.filter(Boolean).map(value => vidaDateKey(String(value))))
  if (dates.size === 0) return 0

  const today = vidaDateKey(new Date())
  let cursor = dates.has(today) ? today : previousDayKey(today)
  let streak = 0

  while (dates.has(cursor)) {
    streak += 1
    cursor = previousDayKey(cursor)
  }

  return streak
}

export default async function HoyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [preferenciaResult, planesResult, diasResult, progresoResult, seguimientoResult] = await Promise.all([
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
      .select('plan_id, numero_dia, completado_en')
      .eq('profile_id', user.id),
    (supabase as any)
      .from('planes_lectura_usuario')
      .select('plan_id, ultimo_acceso_en, completado_en')
      .eq('profile_id', user.id)
      .order('ultimo_acceso_en', { ascending: false }),
  ])

  const preferencia = preferenciaResult.data
  const planes = Array.isArray(planesResult.data) ? planesResult.data : []
  const dias = Array.isArray(diasResult.data) ? diasResult.data : []
  const progreso = Array.isArray(progresoResult.data) ? progresoResult.data : []
  const seguimientos = Array.isArray(seguimientoResult.data) ? seguimientoResult.data : []
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

  const seguimientoActivo = seguimientos.find((item: any) => !item.completado_en)
  const planConAvance = summaries.find(plan => !plan.done && plan.completed > 0)
  const featuredPlanId = String(seguimientoActivo?.plan_id ?? planConAvance?.id ?? summaries[0]?.id ?? '')
  const streak = calculateStreak(progreso.map((item: any) => item.completado_en))

  return (
    <VidaHoyClient
      initialActive={Boolean(preferencia?.activo)}
      initialHour={Number.isInteger(preferencia?.hora_local) ? Number(preferencia.hora_local) : 7}
      plans={summaries}
      featuredPlanId={featuredPlanId}
      streak={streak}
    />
  )
}
