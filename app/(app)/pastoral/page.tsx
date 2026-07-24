import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookHeart,
  BookOpen,
  ChevronRight,
  FileText,
  FolderOpen,
  Library,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Panel Pastoral',
}

export default async function PastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, rol, es_pastor_general, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') redirect('/inicio')

  const disponibles = [
    {
      href: '/pastoral/colecciones',
      title: 'Colecciones pastorales',
      description: 'Organiza versículos por tema, serie, prédica o propósito ministerial.',
      action: 'Abrir colecciones',
      icon: BookHeart,
      iconClass: 'bg-violet-600 text-white',
    },
    {
      href: '/biblia',
      title: 'Biblia y versículos',
      description: 'Lee, escucha y recupera los versículos que ya guardaste como favoritos.',
      action: 'Abrir Biblia',
      icon: BookOpen,
      iconClass: 'bg-indigo-600 text-white',
    },
    {
      href: '/estudios/profundo',
      title: 'Estudio Profundo',
      description: 'Prepara un análisis inicial de un pasaje para apoyar tu estudio y enseñanza.',
      action: 'Comenzar estudio',
      icon: Sparkles,
      iconClass: 'bg-[#C0392B] text-white',
    },
  ]

  const proximos = [
    {
      title: 'Bosquejos',
      description: 'Crea, edita y recupera bosquejos para prédicas y enseñanzas.',
      icon: FileText,
    },
    {
      title: 'Biblioteca',
      description: 'Conserva materiales, enlaces y recursos pastorales en un solo lugar.',
      icon: Library,
    },
    {
      title: 'Materiales de estudio',
      description: 'Prepara contenido para compartir con líderes y congregación.',
      icon: FolderOpen,
    },
  ]

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header className="mb-6 sm:mb-8">
        <div className="mb-3 flex items-center gap-2 text-indigo-600">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Espacio pastoral</p>
        </div>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">
          {nombre ? `Bienvenido, ${nombre}` : 'Panel Pastoral'}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Prepara, organiza y recupera contenido espiritual sin mezclarlo con la administración general.
        </p>
        {esPastorGeneral && (
          <span className="mt-3 inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700">
            Pastor General
          </span>
        )}
      </header>

      <section className="mb-8" aria-labelledby="herramientas-disponibles">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="herramientas-disponibles" className="text-sm font-bold text-[#171923]">Herramientas disponibles</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Listas para usar
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {disponibles.map(({ href, title, description, action, icon: Icon, iconClass }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-[168px] flex-col rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-[0.99]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-bold leading-tight text-slate-900">{title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                {action}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="modulos-en-construccion">
        <div className="mb-3">
          <h2 id="modulos-en-construccion" className="text-sm font-bold text-[#171923]">Módulos de esta fase</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Se habilitarán por bloques pequeños y verificables.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {proximos.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              aria-disabled="true"
              className="flex min-w-0 items-start gap-3 rounded-[18px] border border-dashed border-slate-300 bg-slate-100/70 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-tight text-slate-700">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">En construcción</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
