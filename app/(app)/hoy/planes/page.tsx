import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PlanesLecturaSelector, { type ReadingPlanChoice } from '@/components/biblia/PlanesLecturaSelector'

export const metadata: Metadata = { title: 'Planes de lectura' }

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

function themeForPlan(id: string, title: string) {
  if (id.includes('jesus')) return 'Jesús'
  if (id.includes('caminar')) return 'Caminar con Dios'
  if (id.includes('panorama')) return 'Historia bíblica'
  return title
}

export default async function PlanesLecturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [planesResult, diasResult, progresoResult, seguimientoResult] = await Promise.all([
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

  const planes = Array.isArray(planesResult.data) ? planesResult.data : []
  const dias = Array.isArray(diasResult.data) ? diasResult.data : []
  const progreso = Array.isArray(progresoResult.data) ? progresoResult.data : []
  const seguimientos = Array.isArray(seguimientoResult.data) ? seguimientoResult.data : []
  const completados = new Set(progreso.map((item: any) => `${item.plan_id}:${item.numero_dia}`))

  const summaries: ReadingPlanChoice[] = planes.map((plan: any) => {
    const planDays = dias.filter((dia: any) => dia.plan_id === plan.id)
    const completed = planDays.filter((dia: any) => completados.has(`${plan.id}:${dia.numero_dia}`)).length
    const next = planDays.find((dia: any) => !completados.has(`${plan.id}:${dia.numero_dia}`)) ?? planDays[planDays.length - 1]
    const id = String(plan.id)
    const title = String(plan.titulo)

    return {
      id,
      title,
      theme: themeForPlan(id, title),
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
  const initialPlanId = String(seguimientoActivo?.plan_id ?? planConAvance?.id ?? summaries[0]?.id ?? '')
  const streak = calculateStreak(progreso.map((item: any) => item.completado_en))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/hoy" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />
        Hoy en VIDA
      </Link>

      <header className="mt-5 pb-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Crecer con propósito</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Elige tu plan de lectura</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Selecciona el tema que quieres trabajar. Cada plan tiene la duración que necesita según su objetivo.
        </p>
      </header>

      <PlanesLecturaSelector plans={summaries} initialPlanId={initialPlanId} streak={streak} />
    </main>
  )
}
