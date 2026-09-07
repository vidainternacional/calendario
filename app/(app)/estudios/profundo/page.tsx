import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  ChevronDown,
  Database,
  Landmark,
  ShieldCheck,
} from 'lucide-react'
import EstudioProfundoClient from '@/components/estudios/EstudioProfundoClient'
import AutoSubmitStudyQuery from '@/components/estudios/AutoSubmitStudyQuery'
import StudyAnalyticsTracker from '@/components/estudios/StudyAnalyticsTracker'
import FuentesBiblicasAprobadas from '@/components/estudios/FuentesBiblicasAprobadas'
import BibliotecaBiblicaVerificada from '@/components/estudios/BibliotecaBiblicaVerificada'
import ContextoHistoricoVerificado from '@/components/estudios/ContextoHistoricoVerificado'
import MetodologiaEstudioProfundo from '@/components/estudios/MetodologiaEstudioProfundo'

export const metadata: Metadata = {
  title: 'Estudio Profundo',
}

export default async function EstudioProfundoPage({
  searchParams,
}: {
  searchParams: Promise<{ pasaje?: string; q?: string; tab?: string; from?: string; auto?: string }>
}) {
  const { pasaje, q, tab, from, auto } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const desdePastoral = from === 'pastoral'
  const desdeBiblia = from === 'biblia'
  const initialQuery = q ?? pasaje ?? ''
  const initialTab = tab === 'concordancias' ? 'concordance' : 'study'
  const backHref = desdePastoral ? '/pastoral' : desdeBiblia ? '/biblia' : '/estudios'
  const backLabel = desdePastoral ? 'Volver al Panel Pastoral' : desdeBiblia ? 'Volver a Biblia' : 'Volver a Estudios'

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link
        href={backHref}
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <header className="mb-5 flex items-start gap-3 sm:mb-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C0392B] text-white shadow-sm">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Estudio Profundo</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Busque un versículo, una palabra o una pregunta y consulte la biblioteca bíblica interna desde un solo lugar.
          </p>
        </div>
      </header>

      <EstudioProfundoClient initialPasaje={initialQuery} initialTab={initialTab} />
      <StudyAnalyticsTracker />
      <AutoSubmitStudyQuery query={initialQuery} enabled={auto === '1' && Boolean(initialQuery.trim())} />

      <details className="group mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Database className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-800">Información del estudio</span>
              <span className="mt-0.5 block text-xs text-slate-400">Fuentes, evidencia y metodología</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          <details className="group/item overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <Landmark className="h-4 w-4 text-amber-700" aria-hidden="true" />
                Evidencia del pasaje
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open/item:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-100 p-3 sm:p-4">
              <BibliotecaBiblicaVerificada pasaje={pasaje} from={from} />
              <ContextoHistoricoVerificado pasaje={pasaje} from={from} />
            </div>
          </details>

          <details className="group/item overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <BookOpenCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Fuentes verificadas
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open/item:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-100 p-3 sm:p-4">
              <FuentesBiblicasAprobadas />
            </div>
          </details>

          <details className="group/item overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-[#C0392B]" aria-hidden="true" />
                Metodología y límites
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open/item:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-100 p-3 sm:p-4">
              <MetodologiaEstudioProfundo />
            </div>
          </details>
        </div>
      </details>
    </main>
  )
}
