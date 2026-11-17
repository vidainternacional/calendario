import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, ChevronDown, ChevronLeft, ChevronRight, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PlanDiaCompletarButton from '@/components/biblia/PlanDiaCompletarButton'
import PlanDiaLecturaAcordeon from '@/components/biblia/PlanDiaLecturaAcordeon'

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
    .replace(/\\+n/g, '\n')
    .split(/\n\s*\n/)
    .map((text: string) => text.trim())
    .filter(Boolean)

  const preguntas = String(reading.pregunta_reflexion ?? '')
    .replaceAll('\\n', '\n')
    .split(/\n+/)
    .map((text: string) => text.trim())
    .filter(Boolean)

  // Reutiliza la misma biblioteca RV1909 aprobada de VIDA (ccvida), sin API externa.
  const { data: textoBiblico, error: errorBiblia } = await (supabase as any)
    .from('biblical_verse_texts')
    .select('verse, original_text')
    .eq('source_id', 'b6fef01a-f304-4fd0-98aa-5fe070279946')
    .eq('language', 'spanish')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', reading.book_code)
    .eq('chapter', reading.chapter)
    .order('verse', { ascending: true })

  const versosDelDia: Array<{ numero: number; texto: string }> = errorBiblia ? [] : (textoBiblico ?? [])
    .filter((row: any) =>
      (reading.verse_start == null || Number(row.verse) >= Number(reading.verse_start)) &&
      (reading.verse_end == null || Number(row.verse) <= Number(reading.verse_end)))
    .map((row: any) => ({ numero: Number(row.verse), texto: String(row.original_text ?? '') }))
    .filter((row: { numero: number; texto: string }) => Number.isInteger(row.numero) && row.texto.trim().length > 0)

  const bibleHref = `/biblia?book=${encodeURIComponent(String(reading.book_code))}&chapter=${Number(reading.chapter)}${reading.verse_start ? `&verse=${Number(reading.verse_start)}` : ''}`
  const studyHref = `/estudios/profundo?pasaje=${encodeURIComponent(String(reading.referencia))}&auto=1`
  const previousDay = numeroDia > 1 ? numeroDia - 1 : null
  const nextDay = numeroDia < Number(plan.duracion_dias) ? numeroDia + 1 : null

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/hoy/planes" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />
        Planes de lectura
      </Link>

      <header className="mt-4 border-b border-slate-100 pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">{plan.titulo} · Día {numeroDia} de {plan.duracion_dias}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#171923]">{reading.titulo}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Lee el pasaje, toma unos minutos para reflexionar y marca el día cuando termines.</p>
      </header>

      <section className="border-b border-slate-100 py-4">
        <PlanDiaLecturaAcordeon
          key={planId + '-' + numeroDia}
          referencia={String(reading.referencia)}
          versos={versosDelDia}
          bookCode={String(reading.book_code)}
          chapter={Number(reading.chapter)}
          verseStart={reading.verse_start == null ? null : Number(reading.verse_start)}
          verseEnd={reading.verse_end == null ? null : Number(reading.verse_end)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={bibleHref} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-2 text-center text-xs font-bold text-white sm:text-sm"><BookOpen className="h-4 w-4 shrink-0" />Abrir Biblia</Link>
          <Link href={studyHref} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-2 text-center text-xs font-bold text-slate-700 sm:text-sm"><Sparkles className="h-4 w-4 shrink-0" />Estudiar con IA</Link>
        </div>
      </section>

      <section className="border-b border-slate-100 py-4">
        <h2 className="text-lg font-bold text-slate-950">Devocional</h2>
        <div className="mt-3 space-y-4 pb-2 text-[16px] leading-7 text-slate-700">
          {paragraphs.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>

      <section className="border-b border-slate-100 py-4">
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><MessageCircleQuestion className="h-5 w-5 text-[#C0392B]" />{preguntas.length > 1 ? 'Preguntas para reflexionar' : 'Pregunta para reflexionar'}</span>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 space-y-3 pb-2 text-lg font-semibold leading-8 text-slate-800">
            {preguntas.map((pregunta: string, index: number) => <p key={index}>{pregunta}</p>)}
          </div>
        </details>
      </section>

      <div className="py-6">
        <PlanDiaCompletarButton planId={String(plan.id)} numeroDia={numeroDia} initialCompleted={Boolean(progressResult.data?.completado_en)} />
      </div>

      <nav className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        {previousDay ? <Link href={`/hoy/planes/${planId}/${previousDay}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4" />Día {previousDay}</Link> : <span />}
        {nextDay ? <Link href={`/hoy/planes/${planId}/${nextDay}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-slate-600">Día {nextDay}<ChevronRight className="h-4 w-4" /></Link> : <Link href="/hoy/planes" className="inline-flex min-h-11 items-center text-sm font-bold text-[#C0392B]">Volver a planes</Link>}
      </nav>
    </main>
  )
}
