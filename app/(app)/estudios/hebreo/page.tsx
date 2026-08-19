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
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/estudios"
          aria-label="Volver a Estudios"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-white text-slate-800 shadow-[0_5px_18px_rgba(15,23,42,0.08)] transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <p lang="he" dir="rtl" className="text-[11px] font-bold text-indigo-600">עברית מקראית</p>
          <h1 className="truncate text-2xl font-bold leading-tight text-[#171923]">Hebreo Bíblico</h1>
        </div>
      </header>

      <section className="mb-8 pt-1" aria-labelledby="bienvenida-hebreo">
        <p lang="he" dir="rtl" className="text-[2.7rem] font-black leading-none text-slate-950">בחרת נכון.</p>
        <h2 id="bienvenida-hebreo" className="mt-1.5 text-lg font-black leading-tight text-slate-700">Has tomado una buena decisión.</h2>
        <p className="mt-2 text-sm font-medium text-slate-500"><span lang="he" dir="rtl">היום מתחילים</span> · Hoy empieza tu camino.</p>
      </section>

      <section className="mb-9" aria-labelledby="ruta-hebreo-title">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tu camino</p>
          <h2 id="ruta-hebreo-title" className="mt-0.5 text-lg font-bold text-slate-950">Aprende en este orden</h2>
        </div>

        <div className="border-y border-slate-200 bg-white/70">
          <a href="#alef-bet" className="flex min-h-[70px] items-center gap-3 border-b border-slate-100 py-3 transition-colors active:bg-slate-50">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-indigo-600">01</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-indigo-600" lang="he" dir="rtl">אותיות</p>
              <p className="text-sm font-black text-slate-950">Alef-bet</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-600">Ahora</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
          </a>

          <div className="flex min-h-[70px] items-center gap-3 border-b border-slate-100 py-3">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">02</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400" lang="he" dir="rtl">תנועות</p>
              <p className="text-sm font-bold text-slate-700">Vocales y sílabas</p>
            </div>
          </div>

          <div className="flex min-h-[70px] items-center gap-3 border-b border-slate-100 py-3">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">03</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400" lang="he" dir="rtl">מילים</p>
              <p className="text-sm font-bold text-slate-700">Vocabulario</p>
            </div>
          </div>

          <div className="flex min-h-[70px] items-center gap-3 py-3">
            <span className="w-7 shrink-0 text-[11px] font-black tabular-nums text-slate-300">04</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400" lang="he" dir="rtl">דקדוק</p>
              <p className="text-sm font-bold text-slate-700">Reglas gramaticales</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-9" aria-labelledby="herramientas-hebreo-title">
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Consultar</p>
          <h2 id="herramientas-hebreo-title" className="mt-0.5 text-lg font-bold text-slate-950">Herramientas</h2>
        </div>

        <div className="border-y border-slate-200 bg-white/70">
          <div aria-disabled="true" className="flex min-h-[66px] items-center gap-3 border-b border-slate-100 py-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400" lang="he" dir="rtl">מילון</p>
              <p className="text-sm font-bold text-slate-700">Diccionario bíblico</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-300">Después</span>
          </div>

          <details className="group">
            <summary className="flex min-h-[66px] cursor-pointer list-none items-center gap-3 py-3 marker:content-none">
              <BookOpenText className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400" lang="he" dir="rtl">על העברית</p>
                <p className="text-sm font-bold text-slate-800">Conoce el hebreo</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="pb-4 pl-8 pr-1">
              <p className="text-sm leading-relaxed text-slate-600">Se lee de derecha a izquierda. Aquí podrás consultar historia, escritura y funcionamiento sin interrumpir las lecciones.</p>
            </div>
          </details>
        </div>
      </section>

      <section id="alef-bet" className="scroll-mt-5" aria-labelledby="alef-bet-title">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <p lang="he" dir="rtl" className="text-sm font-black text-indigo-600">אָלֶף־בֵּית</p>
          </div>
          <h2 id="alef-bet-title" className="mt-1 text-xl font-bold text-slate-950">Alef-bet</h2>
          <p className="mt-1 text-sm text-slate-500">Reconoce la forma, el nombre, el valor y el sonido.</p>
        </div>

        <AlefBetExplorer />
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-5 text-[10px] leading-relaxed text-slate-400">
        Fuente textual para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0.
      </footer>
    </main>
  )
}
