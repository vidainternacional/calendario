import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronRight, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Planes de lectura' }

type PlanSummary = {
  id: string
  title: string
  description: string
  total: number
  completed: number
  nextDay: number
  nextLabel: string
  done: boolean
}

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

  const summaries: PlanSummary[] = planes.map((plan: any) => {
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
  const featured = summaries.find(plan => plan.id === featuredPlanId) ?? summaries[0]
  const secondary = summaries.filter(plan => plan.id !== featured?.id)
  const streak = calculateStreak(progreso.map((item: any) => item.completado_en))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/hoy" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />
        Hoy en VIDA
      </Link>

      <header className="mt-5 pb-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Crecer con propósito</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Planes de lectura</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Elige un objetivo que quieras trabajar. Cada tema tiene la duración que necesita; no todos los planes tienen que durar lo mismo.
        </p>
        {streak >= 2 ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#C0392B]"><Flame className="h-4 w-4" />Llevas {streak} días seguidos.</p>
        ) : null}
      </header>

      {featured ? (
        <section className="border-y border-slate-100 py-6" aria-labelledby="plan-actual-title">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#C0392B]">{featured.completed > 0 && !featured.done ? 'Tu plan actual' : 'Para comenzar'}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="plan-actual-title" className="text-xl font-bold tracking-[-0.02em] text-slate-950">{featured.title}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Objetivo</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{featured.description}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-500">{featured.total} días</span>
          </div>

          {featured.completed > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>Avance</span><span>{featured.completed}/{featured.total}</span></div>
              <div className="mt-2 h-1 overflow-hidden bg-slate-100"><div className="h-full bg-[#C0392B]" style={{ width: `${Math.round((featured.completed / Math.max(featured.total, 1)) * 100)}%` }} /></div>
            </div>
          ) : null}

          <Link href={`/hoy/planes/${featured.id}/${featured.nextDay}`} className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#C0392B] px-4 text-sm font-bold text-white">
            {featured.done ? 'Revisar plan' : featured.completed > 0 ? `Continuar · Día ${featured.nextDay}` : 'Comenzar plan'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      {secondary.length > 0 ? (
        <section className="pt-7" aria-labelledby="otros-planes-title">
          <h2 id="otros-planes-title" className="text-sm font-bold text-slate-950">Otros objetivos</h2>
          <div className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
            {secondary.map(plan => (
              <Link key={plan.id} href={`/hoy/planes/${plan.id}/${plan.nextDay}`} className="flex min-h-[104px] items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-950">{plan.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{plan.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{plan.total} días{plan.completed > 0 ? ` · ${plan.completed} completados` : ''}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
