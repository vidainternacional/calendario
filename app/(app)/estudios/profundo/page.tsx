import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EstudioProfundoClient from '@/components/estudios/EstudioProfundoClient'
import FuentesBiblicasAprobadas from '@/components/estudios/FuentesBiblicasAprobadas'
import ContextoHistoricoVerificado from '@/components/estudios/ContextoHistoricoVerificado'
import MetodologiaEstudioProfundo from '@/components/estudios/MetodologiaEstudioProfundo'
import { ArrowLeft, BookOpen, Database, History, Languages, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estudio Profundo',
}

const AREAS = [
  { icon: Languages, title: 'Texto y lenguaje', text: 'Texto original, transliteración, traducción literal y palabras clave verificadas.' },
  { icon: History, title: 'Contexto histórico', text: 'Entorno cultural, religioso, político y social respaldado por fuentes.' },
  { icon: BookOpen, title: 'Interpretación responsable', text: 'Diferencia evidencia textual, lectura histórica, teología y reflexión espiritual.' },
  { icon: ShieldCheck, title: 'Límites explícitos', text: 'Señala debates, hipótesis y datos que la biblioteca todavía no puede sostener.' },
]

export default async function EstudioProfundoPage({ searchParams }: { searchParams: Promise<{ pasaje?: string; from?: string }> }) {
  const { pasaje, from } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const desdePastoral = from === 'pastoral'

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link
        href={desdePastoral ? '/pastoral' : '/estudios'}
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {desdePastoral ? 'Volver al Panel Pastoral' : 'Volver a Estudios'}
      </Link>

      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#681b16] via-[#9f2d23] to-[#C0392B] p-5 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10" />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/70">Herramienta de estudio bíblico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Estudio Profundo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
            Comprende el pasaje desde el texto antiguo, sus idiomas, contexto y recepción histórica, distinguiendo cuidadosamente los hechos, las interpretaciones y la reflexión espiritual.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
            <Database className="h-4 w-4" />
            Biblioteca interna con procedencia verificable
          </div>
        </div>
      </section>

      <section className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="note">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold">Fuentes antes que automatización</h2>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            Los datos aprobados de la biblioteca son la base del estudio. Cualquier asistencia automática debe limitarse a organizar esa evidencia, citar su procedencia y reconocer expresamente cuando no exista información suficiente.
          </p>
        </div>
      </section>

      <MetodologiaEstudioProfundo />

      <FuentesBiblicasAprobadas />

      <ContextoHistoricoVerificado pasaje={pasaje} from={from} />

      <EstudioProfundoClient initialPasaje={pasaje ?? ''} />

      <details className="group mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#C0392B]">Metodología visible</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Qué debe incluir cada estudio</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 group-open:hidden">Ver detalle</span>
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 group-open:inline">Ocultar</span>
        </summary>

        <div className="border-t border-slate-100 p-4 sm:p-6">
          <p className="mb-4 text-sm leading-6 text-slate-500">
            El resultado debe diferenciar el significado contextual probable, la historia de interpretación, las afirmaciones teológicas y la reflexión espiritual. Ninguna sección debe aparentar mayor certeza que la evidencia disponible.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {AREAS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C0392B] shadow-sm"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="text-sm font-bold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Secciones esenciales</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Texto original', 'Transliteración', 'Traducción literal', 'Interpretación', 'Versiones', 'Contexto', 'Lingüística', 'Intención del autor', 'Qué no afirma', 'Explicación', 'Reflexión'].map((item, index) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">{index + 1}. {item}</span>
              ))}
            </div>
          </div>
        </div>
      </details>
    </main>
  )
}
