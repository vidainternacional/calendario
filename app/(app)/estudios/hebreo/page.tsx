import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookOpenText, GraduationCap, Languages, Sparkles } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Hebreo Bíblico',
}

export default async function HebreoBiblicoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/estudios"
          aria-label="Volver a Estudios"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-white text-slate-800 shadow-[0_5px_18px_rgba(15,23,42,0.08)] transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Formación · Texto original</p>
          <h1 className="truncate text-2xl font-bold leading-tight text-[#171923]">Hebreo Bíblico</h1>
          <p className="mt-0.5 text-xs text-slate-500">Aprende y lee los textos originales</p>
        </div>
      </header>

      <section className="relative mb-7 overflow-hidden rounded-[30px] bg-slate-950 px-5 py-6 text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
        <div aria-hidden="true" className="absolute -right-4 -top-10 select-none text-[9rem] font-medium leading-none text-white/[0.055]" dir="rtl" lang="he">
          א
        </div>
        <div className="relative max-w-[30rem]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Primer paso
          </span>
          <h2 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">Empieza por reconocer lo que ves</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Primero domina las letras y la dirección de lectura. Después iremos agregando vocales, sílabas y palabras reales de la Biblia sin depender siempre de la transliteración.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/70">
            <span>← lectura de derecha a izquierda</span>
            <span>22 letras</span>
            <span>5 formas finales</span>
          </div>
        </div>
      </section>

      <section className="mb-8" aria-labelledby="ruta-hebreo-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ruta</p>
            <h2 id="ruta-hebreo-title" className="mt-0.5 text-lg font-bold text-slate-950">Aprender paso a paso</h2>
          </div>
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700">Alef-bet activo</span>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <a href="#alef-bet" className="flex min-h-[94px] flex-col items-center justify-center border-r border-slate-100 px-2 text-center active:bg-slate-50">
            <GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <span className="mt-2 text-xs font-bold text-slate-900">Aprender</span>
            <span className="mt-0.5 text-[9px] font-semibold text-indigo-600">Alef-bet</span>
          </a>
          <a href="#alef-bet" className="flex min-h-[94px] flex-col items-center justify-center border-r border-slate-100 px-2 text-center active:bg-slate-50">
            <Languages className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <span className="mt-2 text-xs font-bold text-slate-900">Referencia</span>
            <span className="mt-0.5 text-[9px] font-semibold text-slate-400">22 letras</span>
          </a>
          <div aria-disabled="true" className="flex min-h-[94px] flex-col items-center justify-center px-2 text-center opacity-55">
            <BookOpenText className="h-5 w-5 text-slate-500" aria-hidden="true" />
            <span className="mt-2 text-xs font-bold text-slate-900">Leer</span>
            <span className="mt-0.5 text-[9px] font-semibold text-slate-400">Siguiente</span>
          </div>
        </div>
      </section>

      <section id="alef-bet" className="scroll-mt-5" aria-labelledby="alef-bet-title">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">Alef-bet</p>
          <h2 id="alef-bet-title" className="mt-0.5 text-xl font-bold text-slate-950">Las letras</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Toca una letra para reconocer su nombre, transliteración y forma final cuando exista.
          </p>
        </div>

        <AlefBetExplorer />
      </section>

      <section className="mt-9 border-t border-slate-200 pt-6" aria-labelledby="proximos-pasos-hebreo">
        <h2 id="proximos-pasos-hebreo" className="text-sm font-bold text-slate-900">Lo que viene después</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-[18px] bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-bold text-slate-800">Niqqud y lectura silábica</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Las vocales aparecerán cuando las consonantes ya sean familiares.</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-bold text-slate-800">Lector bíblico guiado</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Usará el corpus hebreo/arameo ya aprobado y enlazará al Estudio Profundo.</p>
          </div>
        </div>
      </section>

      <footer className="mt-7 text-[10px] leading-relaxed text-slate-400">
        Texto original para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0. La transliteración es una ayuda; no sustituye el aprendizaje de la escritura.
      </footer>
    </main>
  )
}
