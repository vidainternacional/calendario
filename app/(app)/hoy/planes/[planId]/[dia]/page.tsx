import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PlanDiaCompletarButton from '@/components/biblia/PlanDiaCompletarButton'

export const metadata: Metadata = { title: 'Plan de lectura' }

export default async function PlanDiaPage({ params }: { params: Promise<{ planId: string; dia: string }> }) {
  const { planId, dia } = await params
  const numeroDia = Number(dia)
  if (!Number.isInteger(numeroDia) || numeroDia < 1) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [planResult, dayResult, progressResult] = await Promise.all([
    (supabase as any)
      .from('planes_lectura')
      .select('id, titulo, descripcion, duracion_dias')
      .eq('id', planId)
      .eq('publicado', true)
      .maybeSingle(),
    (supabase as any)
      .from('planes_lectura_dias')
      .select('plan_id, numero_dia, titulo, book_code, book_name, chapter, verse_start, verse_end, referencia, devocional, pregunta_reflexion')
      .eq('plan_id', planId)
      .eq('numero_dia', numeroDia)
      .maybeSingle(),
    (supabase as any)
      .from('planes_lectura_dias_progreso')
      .select('completado_en')
      .eq('profile_id', user.id)
      .eq('plan_id', planId)
      .eq('numero_dia', numeroDia)
      .maybeSingle(),
  ])

  const plan = planResult.data
  const reading = dayResult.data
  if (!plan || !reading) notFound()

  const paragraphs = String(reading.devocional ?? '')
    .replaceAll('\\n', '\n')
    .split(/\n\s*\n/)
    .map((text: string) => text.trim())
    .filter(Boolean)

  const bibleHref = `/biblia?book=${encodeURIComponent(String(reading.book_code))}&chapter=${Number(reading.chapter)}${reading.verse_start ? `&verse=${Number(reading.verse_start)}` : ''}`
  const studyHref = `/estudios/profundo?pasaje=${encodeURIComponent(String(reading.referencia))}&auto=1`
  const previousDay = numeroDia > 1 ? numeroDia - 1 : null
  const nextDay = numeroDia < Number(plan.duracion_dias) ? numeroDia + 1 : null

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/hoy" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />
        Planes de lectura
      </Link>

      <header className="mt-4 border-b border-slate-100 pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">{plan.titulo} · Día {numeroDia} de {plan.duracion_dias}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#171923]">{reading.titulo}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Lee el pasaje, toma unos minutos para reflexionar y marca el día cuando termines.</p>
      </header>

      <section className="py-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><BookOpen className="h-5 w-5 text-[#C0392B]" />Lectura bíblica</div>
        <h2 className="mt-3 text-2xl font-bold text-slate-950">{reading.referencia}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={bibleHref} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-3 text-sm font-bold text-white"><BookOpen className="h-4 w-4" />Abrir Biblia</Link>
          <Link href={studyHref} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-bold text-slate-700"><Sparkles className="h-4 w-4" />Estudiar</Link>
        </div>
      </section>

      <section className="py-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-950">Devocional</h2>
        <div className="mt-3 space-y-4 text-[16px] leading-7 text-slate-700">
          {paragraphs.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>

      <section className="py-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><MessageCircleQuestion className="h-5 w-5 text-[#C0392B]" />Pregunta para reflexionar</div>
        <p className="mt-3 text-lg font-semibold leading-8 text-slate-800">{reading.pregunta_reflexion}</p>
      </section>

      <div className="py-6">
        <PlanDiaCompletarButton planId={String(plan.id)} numeroDia={numeroDia} initialCompleted={Boolean(progressResult.data?.completado_en)} />
      </div>

      <nav className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        {previousDay ? <Link href={`/hoy/planes/${planId}/${previousDay}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4" />Día {previousDay}</Link> : <span />}
        {nextDay ? <Link href={`/hoy/planes/${planId}/${nextDay}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-slate-600">Día {nextDay}<ChevronRight className="h-4 w-4" /></Link> : <Link href="/hoy" className="inline-flex min-h-11 items-center text-sm font-bold text-[#C0392B]">Volver a planes</Link>}
      </nav>
    </main>
  )
}
