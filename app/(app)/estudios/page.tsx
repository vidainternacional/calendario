import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  Video,
  Clock3,
  NotebookPen,
  Languages,
  Sparkles,
  HeartHandshake,
  UsersRound,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Estudios Bíblicos',
}

export default async function EstudiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const crecimiento = [
    {
      href: '/hoy',
      title: 'Versículo del día',
      description: 'Versículo diario, recordatorio configurable y acceso directo a la Biblia o al Estudio.',
      action: 'Ver versículo de hoy',
      icon: Sparkles,
      iconClass: 'bg-[#C0392B] text-white',
      actionClass: 'text-[#C0392B]',
    },
    {
      href: '/hoy/planes',
      title: 'Devocionales y planes de lectura',
      description: '12 planes temáticos con lectura, devocional, pregunta para reflexionar, progreso personal y racha.',
      action: 'Abrir devocionales',
      icon: BookOpenCheck,
      iconClass: 'bg-emerald-600 text-white',
      actionClass: 'text-emerald-700',
    },
  ]

  const recursos = [
    {
      href: '/biblia',
      title: 'Biblia',
      description: 'Lee cualquier libro y capítulo, escúchalo en voz alta y envíalo al Estudio Profundo con un toque.',
      action: 'Abrir Biblia',
      icon: BookOpen,
      iconClass: 'bg-indigo-600 text-white',
      hoverClass: 'hover:border-indigo-300',
      arrowClass: 'group-hover:text-indigo-600',
      actionClass: 'text-indigo-600',
    },
    {
      href: '/estudios/profundo',
      title: 'Estudio Profundo',
      description: 'Busca versículos, palabras o preguntas y consulta estudios, contexto y concordancias desde una sola herramienta.',
      action: 'Comenzar estudio',
      icon: BookOpen,
      iconClass: 'bg-[#C0392B] text-white shadow-inner shadow-red-900/20',
      hoverClass: 'hover:border-[#C0392B]/30',
      arrowClass: 'group-hover:text-[#C0392B]',
      actionClass: 'text-[#C0392B]',
    },
    {
      href: '/estudios/hebreo',
      title: 'Hebreo Bíblico',
      description: 'Aprende el Alef-bet paso a paso y prepárate para leer el texto hebreo y arameo con herramientas guiadas.',
      action: 'Empezar hebreo',
      icon: Languages,
      iconClass: 'bg-slate-900 text-white shadow-inner shadow-black/20',
      hoverClass: 'hover:border-slate-400',
      arrowClass: 'group-hover:text-slate-900',
      actionClass: 'text-slate-700',
    },
    {
      href: '/biblia/notas',
      title: 'Cuaderno',
      description: 'Reúne en un solo lugar tus notas personales, estudios guardados, versículos y predicaciones para seguir trabajando en ellas.',
      action: 'Abrir cuaderno',
      icon: NotebookPen,
      iconClass: 'bg-violet-600 text-white shadow-inner shadow-violet-900/20',
      hoverClass: 'hover:border-violet-300',
      arrowClass: 'group-hover:text-violet-600',
      actionClass: 'text-violet-600',
    },
  ]

  const vida = [
    {
      href: '/ayuda-solidaria',
      title: 'Centro de Ayuda',
      description: 'Necesito ayuda, Quiero sembrar, conversaciones privadas, despensa y otras formas de servicio.',
      icon: HeartHandshake,
      iconClass: 'bg-rose-600 text-white',
    },
    {
      href: '/ministerios',
      title: 'Ministerios',
      description: 'Accede a tus equipos. Alabanza conserva programación, repertorio y la vista práctica para músicos.',
      icon: UsersRound,
      iconClass: 'bg-violet-600 text-white',
    },
  ]

  const proximamente = [
    {
      title: 'Prédicas en video',
      description: 'Accede a los mensajes del domingo y series de estudio.',
      icon: Video,
    },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#C0392B]">Formación</p>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Estudios Bíblicos</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Versículo diario, devocionales, planes de lectura, Biblia, estudio, Hebreo y Cuaderno en un solo lugar.
        </p>
      </header>

      <section className="mb-8" aria-labelledby="crecimiento-diario-title">
        <div className="mb-3 px-1">
          <h2 id="crecimiento-diario-title" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Para cada día</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Lo que ya está disponible para cualquier persona con cuenta.</p>
        </div>

        <div className="space-y-3">
          {crecimiento.map(({ href, title, description, action, icon: Icon, iconClass, actionClass }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-[112px] items-center gap-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconClass}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-base text-slate-950">{title}</strong>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
                <span className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${actionClass}`}>
                  {action}<ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4" aria-labelledby="recursos-disponibles-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recursos-disponibles-title" className="text-sm font-bold text-[#171923]">Herramientas de estudio</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Listas para usar
          </span>
        </div>

        {recursos.map(({ href, title, description, action, icon: Icon, iconClass, hoverClass, arrowClass, actionClass }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex min-h-[138px] items-center gap-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] sm:p-6 ${hoverClass}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${actionClass}`}>
                {action}
                <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${arrowClass}`} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-8" aria-labelledby="vida-disponible-title">
        <div className="mb-3 px-1">
          <h2 id="vida-disponible-title" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">También disponible en VIDA</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {vida.map(({ href, title, description, icon: Icon, iconClass }) => (
            <Link key={title} href={href} className="flex min-h-[112px] items-start gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-950">{title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
              </span>
              <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="proximamente-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="proximamente-title" className="text-sm font-bold text-[#171923]">Próximamente</h2>
            <p className="mt-0.5 text-xs text-slate-500">Estos recursos todavía no están disponibles.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            En desarrollo
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {proximamente.map(({ title, description, icon: Icon }) => (
            <article key={title} aria-disabled="true" className="flex min-w-0 items-start gap-3 rounded-[18px] border border-dashed border-slate-300 bg-slate-100/70 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-tight text-slate-700">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">Aún no disponible</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
