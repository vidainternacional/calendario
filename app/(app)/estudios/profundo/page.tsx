import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EstudioProfundoClient from '@/components/estudios/EstudioProfundoClient'
import { ArrowLeft, BookOpen, Languages, History, Sparkles, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estudio Profundo (IA)',
}

const AREAS = [
  { icon: Languages, title: 'Texto y lenguaje', text: 'Texto original, transliteración y traducciones.' },
  { icon: History, title: 'Contexto histórico', text: 'Entorno cultural, religioso y social del pasaje.' },
  { icon: BookOpen, title: 'Interpretación', text: 'Comparación de versiones y explicación coherente.' },
  { icon: ShieldCheck, title: 'Lectura responsable', text: 'Qué comunica el texto y qué no debería atribuirse.' },
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

      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#8f261d] via-[#C0392B] to-[#d65a4c] p-5 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10" />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/70">Herramienta de estudio bíblico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Estudio Profundo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
            Examina un pasaje desde su idioma original, contexto histórico, interpretación y aplicación espiritual.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
            <BookOpen className="h-4 w-4" />
            Análisis organizado en 11 secciones
          </div>
        </div>
      </section>

      <EstudioProfundoClient initialPasaje={pasaje ?? ''} />

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#C0392B]">Vista previa</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Lo que incluirá cada estudio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Estas áreas son visibles desde ahora. Los resultados completos aparecerán cuando el proveedor de IA esté configurado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {AREAS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C0392B] shadow-sm"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0"><h3 className="text-sm font-bold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Las 11 secciones del resultado</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Texto original', 'Transliteración', 'Traducción literal', 'Interpretación', 'Versiones', 'Contexto', 'Lingüística', 'Mensaje', 'Qué no significa', 'Explicación', 'Reflexión'].map((item, index) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">{index + 1}. {item}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
