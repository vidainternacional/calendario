import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ChevronDown } from 'lucide-react'
import EstudioProfundoClient from '@/components/estudios/EstudioProfundoClient'
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
  searchParams: Promise<{ pasaje?: string; from?: string }>
}) {
  const { pasaje, from } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const desdePastoral = from === 'pastoral'

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link
        href={desdePastoral ? '/pastoral' : '/estudios'}
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {desdePastoral ? 'Volver al Panel Pastoral' : 'Volver a Estudios'}
      </Link>

      <header className="mb-5 flex items-start gap-3 sm:mb-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C0392B] text-white shadow-sm">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Estudio Profundo</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Elija un pasaje y reciba un análisis claro del texto, su contexto, lenguaje, significado y reflexión espiritual.
          </p>
        </div>
      </header>

      <EstudioProfundoClient initialPasaje={pasaje ?? ''} />

      <details className="group mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Fuentes, metodología y datos verificables</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <p className="text-xs leading-5 text-slate-500">
            Esta sección reúne la procedencia, las licencias, los límites metodológicos y los recursos internos disponibles. Permanece cerrada para mantener el estudio visualmente limpio.
          </p>
          <BibliotecaBiblicaVerificada pasaje={pasaje} from={from} />
          <ContextoHistoricoVerificado pasaje={pasaje} from={from} />
          <FuentesBiblicasAprobadas />
          <MetodologiaEstudioProfundo />
        </div>
      </details>
    </main>
  )
}
