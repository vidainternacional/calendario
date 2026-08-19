import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookOpenText, ChevronDown, ChevronRight, Languages, Search } from 'lucide-react'
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
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f7f7fa] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-7 flex items-center gap-3">
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
          <p className="mt-0.5 text-xs text-slate-500">Aprende desde sus fundamentos</p>
        </div>
      </header>

      <section className="mb-9 pt-1" aria-labelledby="bienvenida-hebreo">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Empieza aquí</p>
        <h2 id="bienvenida-hebreo" className="mt-2 max-w-[30rem] text-[2rem] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[2.3rem]">
          Has tomado una buena decisión.
        </h2>
        <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-slate-600">
          Hoy comienza tu camino para leer, pronunciar y comprender el hebreo bíblico desde sus fundamentos. Empezaremos por reconocer las letras; después vendrán vocales, sílabas, vocabulario y gramática.
        </p>
      </section>

      <section className="mb-9" aria-labelledby="ruta-hebreo-title">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tu camino</p>
          <h2 id="ruta-hebreo-title" className="mt-0.5 text-lg font-bold text-slate-950">Aprende en este orden</h2>
        </div>

        <div className="border-y border-slate-200 bg-white/70">
          <a href="#alef-bet" className="flex min-h-[76px] items-center gap-3 border-b border-slate-100 py-3.5 transition-colors active:bg-slate-50">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-indigo-600">01</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">Alef-bet</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Letras, sonidos y formas especiales.</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-600">Ahora</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
          </a>

          <div className="flex min-h-[76px] items-center gap-3 border-b border-slate-100 py-3.5">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">02</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700">Vocales y sílabas</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">Niqqud, combinación de sonidos y lectura progresiva.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Después</span>
          </div>

          <div className="flex min-h-[76px] items-center gap-3 border-b border-slate-100 py-3.5">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">03</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700">Vocabulario</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">Palabras frecuentes para reconocer y comprender lo que lees.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Después</span>
          </div>

          <div className="flex min-h-[76px] items-center gap-3 py-3.5">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">04</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700">Reglas gramaticales</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">Cómo se forman, cambian y relacionan las palabras.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Después</span>
          </div>
        </div>
      </section>

      <section className="mb-10" aria-labelledby="herramientas-hebreo-title">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Consultar cuando quieras</p>
          <h2 id="herramientas-hebreo-title" className="mt-0.5 text-lg font-bold text-slate-950">Herramientas</h2>
        </div>

        <div className="border-y border-slate-200 bg-white/70">
          <div aria-disabled="true" className="flex min-h-[72px] items-center gap-3 border-b border-slate-100 py-3.5">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700">Diccionario bíblico</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">Consulta una palabra y sus datos lingüísticos cuando lo necesites.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Más adelante</span>
          </div>

          <details className="group">
            <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 py-3.5 marker:content-none">
              <BookOpenText className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Conoce el hebreo</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">Qué es, un poco de historia y cómo funciona su escritura.</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="pb-4 pl-8 pr-1">
              <p className="text-sm leading-relaxed text-slate-600">
                El hebreo bíblico se lee de derecha a izquierda. En esta ruta lo aprenderás por capas: primero las letras, después la vocalización y las sílabas, luego palabras reales y finalmente las reglas que te ayudan a comprender cómo funciona el texto.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                La historia de la escritura, las formas antiguas y otros datos de contexto estarán disponibles aquí sin interrumpir las lecciones prácticas.
              </p>
            </div>
          </details>
        </div>
      </section>

      <section id="alef-bet" className="scroll-mt-5" aria-labelledby="alef-bet-title">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">Alef-bet</p>
          </div>
          <h2 id="alef-bet-title" className="mt-1 text-xl font-bold text-slate-950">Tu primer sistema de lectura</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Cada ficha prioriza la forma, el nombre, el sonido y las reglas que necesitas para reconocer la letra. Gírala cuando quieras consultar datos de referencia.
          </p>
        </div>

        <AlefBetExplorer />
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-5 text-[10px] leading-relaxed text-slate-400">
        Texto original para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0. La transliteración es una ayuda de consulta; no sustituye el aprendizaje de la escritura.
      </footer>
    </main>
  )
}
