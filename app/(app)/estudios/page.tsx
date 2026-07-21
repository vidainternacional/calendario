import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Sparkles, ChevronRight, Video, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Estudios Bíblicos',
}

export default async function EstudiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="px-4 py-8 max-w-2xl mx-auto pb-28">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Estudios Bíblicos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Recursos, devocionales y análisis profundo
        </p>
      </header>

      <div className="grid gap-4">
        {/* Main CTA for Deep Study */}
        <Link 
          href="/estudios/profundo"
          className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-[#C0392B]/30 hover:shadow-md transition-all overflow-hidden"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex items-start sm:items-center gap-4">
            <div className="bg-[#C0392B] p-3 rounded-xl shadow-inner shadow-red-900/20 text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Estudio Profundo con IA
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Nuevo
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Ingresa cualquier pasaje bíblico y recibe un análisis académico integral (contexto, lenguas originales y hermenéutica).
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#C0392B] group-hover:translate-x-1 transition-all shrink-0 mt-4 sm:mt-0 relative z-10" />
        </Link>

        {/* Biblia */}
        <Link
          href="/biblia"
          className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="relative z-10 flex items-start sm:items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl text-white shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Biblia
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Nuevo</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Lee cualquier libro y capítulo, escúchalo en voz alta y envíalo al Estudio Profundo con un toque.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-4 sm:mt-0" />
        </Link>

        {/* Placeholders for future sections */}
        <div className="opacity-60 pointer-events-none">
          <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="relative z-10 flex items-start sm:items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-xl text-slate-500 shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Prédicas en Video
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Próximamente: accede a los mensajes del domingo y series de estudio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="opacity-60 pointer-events-none">
          <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="relative z-10 flex items-start sm:items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-xl text-slate-500 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Devocionales Ministeriales
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Próximamente: reflexiones y guías de estudio para tu ministerio.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
