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

  const recursos = [
    {
      href: '/estudios/profundo',
      title: 'Estudio Profundo con IA',
      description: 'Ingresa cualquier pasaje bíblico y recibe un análisis integral con contexto histórico, lenguas originales y hermenéutica.',
      icon: Sparkles,
      iconClass: 'bg-[#C0392B] text-white shadow-inner shadow-red-900/20',
      hoverClass: 'hover:border-[#C0392B]/30',
      arrowClass: 'group-hover:text-[#C0392B]',
      badge: 'Nuevo',
    },
    {
      href: '/biblia',
      title: 'Biblia',
      description: 'Lee cualquier libro y capítulo, escúchalo en voz alta y envíalo al Estudio Profundo con un toque.',
      icon: BookOpen,
      iconClass: 'bg-indigo-600 text-white',
      hoverClass: 'hover:border-indigo-300',
      arrowClass: 'group-hover:text-indigo-600',
      badge: 'Nuevo',
    },
  ]

  const proximamente = [
    {
      title: 'Prédicas en video',
      description: 'Accede a los mensajes del domingo y series de estudio.',
      icon: Video,
    },
    {
      title: 'Devocionales ministeriales',
      description: 'Reflexiones y guías de estudio para tu ministerio.',
      icon: FileText,
    },
  ]

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 max-w-2xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#C0392B]">Formación</p>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Estudios Bíblicos</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Recursos, devocionales y herramientas para profundizar en la Palabra.
        </p>
      </header>

      <section className="space-y-3 sm:space-y-4" aria-label="Recursos disponibles">
        {recursos.map(({ href, title, description, icon: Icon, iconClass, hoverClass, arrowClass, badge }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex min-h-[132px] items-center gap-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] sm:p-6 ${hoverClass}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">{title}</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  {badge}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
            </div>

            <ChevronRight className={`h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 ${arrowClass}`} aria-hidden="true" />
          </Link>
        ))}
      </section>

      <section className="mt-7" aria-labelledby="proximamente-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="proximamente-title" className="text-sm font-bold text-[#171923]">Próximamente</h2>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">En desarrollo</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {proximamente.map(({ title, description, icon: Icon }) => (
            <article key={title} className="flex min-w-0 items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-4 opacity-70 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-tight text-slate-800">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
