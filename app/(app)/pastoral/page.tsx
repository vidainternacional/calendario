import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpenCheck,
  ChevronRight,
  FolderOpen,
  Library,
  PackageOpen,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'
import BackButton from '@/components/navigation/BackButton'

export const metadata: Metadata = { title: 'Centro Pastoral' }
export const dynamic = 'force-dynamic'

export default async function PastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('nombre_completo, rol, es_pastor_general, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso al Centro Pastoral.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data: paquetes, error: paquetesError } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, estado, updated_at')
    .eq('profile_id', user.id)
    .eq('estado', 'borrador')
    .order('updated_at', { ascending: false })
    .limit(3)

  if (paquetesError) throw new Error('No fue posible cargar los proyectos en preparación.')

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)
  const borradores = (paquetes ?? []) as Array<{ id: string; titulo: string; descripcion_publica: string; estado: string; updated_at: string }>

  const areas = [
    { titulo: 'Estudio', href: '/estudios/profundo?from=pastoral', icono: Sparkles, iconClass: 'text-[#C0392B]' },
    { titulo: 'Biblioteca', href: '/pastoral/biblioteca', icono: Library, iconClass: 'text-amber-700' },
    { titulo: 'Publicados', href: '/pastoral/materiales', icono: BookOpenCheck, iconClass: 'text-cyan-700' },
  ]

  return (
    <main className="pastoral-workspace mx-auto min-h-screen max-w-3xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <div className="pastoral-workspace-back">
        <BackButton />
      </div>

      <header className="pastoral-workspace-header">
        <div className="pastoral-eyebrow">
          <ShieldCheck aria-hidden="true" />
          <span>Centro Pastoral</span>
        </div>
        <div className="pastoral-workspace-heading">
          <h1>{nombre ? `Hola, ${nombre}` : 'Centro Pastoral'}</h1>
          {esPastorGeneral && <span className="pastoral-role-badge">Pastor General</span>}
        </div>
      </header>

      <section className="pastoral-project" aria-labelledby="preparacion-pastoral">
        <div className="pastoral-section-label">
          <PackageOpen aria-hidden="true" />
          <h2 id="preparacion-pastoral">En preparación</h2>
        </div>

        {borradores.length ? (
          <div className="divide-y divide-slate-200">
            {borradores.map((proyecto) => (
              <Link key={proyecto.id} href={`/pastoral/paquetes/${proyecto.id}`} className="flex min-h-[70px] items-center gap-3 py-3 text-slate-900">
                <span className="pastoral-current-project-icon"><FolderOpen aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate">{proyecto.titulo}</strong>
                  <span className="pastoral-current-project-meta">Continuar trabajando</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="pastoral-project-empty">No tienes proyectos en preparación.</p>
        )}

        <Link href="/pastoral/paquetes?nuevo=1" className="pastoral-primary-action">
          <Plus aria-hidden="true" />
          Nuevo proyecto
        </Link>

        <Link href="/pastoral/paquetes" className="mt-2 flex min-h-12 items-center justify-between border-t border-slate-200 px-1 pt-3 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2"><PackageOpen className="h-4 w-4" aria-hidden="true" /> Mis proyectos</span>
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        </Link>
      </section>

      <nav className="grid grid-cols-3 gap-x-3 gap-y-5 py-6" aria-label="Herramientas auxiliares del Centro Pastoral">
        {areas.map(({ titulo, href, icono: Icono, iconClass }) => (
          <Link
            key={titulo}
            href={href}
            className="group flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center text-slate-700 transition active:scale-95"
          >
            <Icono className={`h-7 w-7 stroke-[1.8] transition-transform group-active:scale-90 ${iconClass}`} aria-hidden="true" />
            <span className="text-[11px] font-bold leading-tight">{titulo}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
