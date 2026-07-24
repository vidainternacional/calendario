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
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Centro pastoral</p>
        </div>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">
          {nombre ? `Bienvenido, ${nombre}` : 'Panel Pastoral'}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Organiza prédicas, guías y materiales de apoyo desde un solo espacio de trabajo.
        </p>
        {esPastorGeneral && (
          <span className="mt-3 inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700">
            Pastor General
          </span>
        )}
      </header>

      <section className="overflow-hidden rounded-[26px] bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900 p-5 text-white shadow-[0_16px_45px_rgba(79,70,229,0.25)] sm:p-7" aria-labelledby="centro-colecciones-title">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <BookHeart className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/65">Herramienta principal</p>
        <h2 id="centro-colecciones-title" className="mt-2 text-2xl font-bold">Colecciones pastorales</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
          Prepara el paquete de una prédica o estudio: versículos, notas, introducción y material listo para imprimir, compartir o enviar por correo.
        </p>
        <Link href="/pastoral/colecciones" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 shadow-sm transition-transform active:scale-[0.99] sm:w-auto">
          Abrir colecciones
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="mt-6" aria-labelledby="accesos-rapidos-pastorales">
        <div className="mb-3">
          <h2 id="accesos-rapidos-pastorales" className="text-sm font-bold text-slate-900">Accesos rápidos</h2>
          <p className="mt-0.5 text-xs text-slate-500">Herramientas de apoyo que ya existen en la aplicación.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/biblia?from=pastoral" className="group flex min-h-[112px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 active:scale-[0.99]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
            <span className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-900">Biblia <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
          <Link href="/estudios/profundo?from=pastoral" className="group flex min-h-[112px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-rose-200 active:scale-[0.99]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#C0392B]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
            <span className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-900">Estudio Profundo <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="proximos-modulos-pastorales">
        <div className="mb-3">
          <h2 id="proximos-modulos-pastorales" className="text-sm font-bold text-[#171923]">Próximos espacios del centro</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Se habilitarán uno por uno dentro de esta fase.</p>
        </div>

        <div className="space-y-3">
          {proximos.map(({ title, description, icon: Icon }) => (
            <article key={title} aria-disabled="true" className="flex min-w-0 items-start gap-3 rounded-[18px] border border-dashed border-slate-300 bg-slate-100/70 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></div>
              <div className="min-w-0"><h3 className="font-bold leading-tight text-slate-700">{title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p><p className="mt-2 text-[11px] font-semibold text-slate-400">En construcción</p></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
