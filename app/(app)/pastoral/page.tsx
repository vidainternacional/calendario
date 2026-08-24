import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookHeart,
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  FileText,
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

const estadoPaquete: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-slate-100 text-slate-600' },
  listo: { texto: 'Listo', clase: 'bg-emerald-50 text-emerald-700' },
  compartido: { texto: 'Compartido', clase: 'bg-indigo-50 text-indigo-700' },
}

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
    .order('updated_at', { ascending: false })
    .limit(3)

  if (paquetesError) throw new Error('No fue posible cargar los paquetes pastorales recientes.')

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)
  const recientes = (paquetes ?? []) as Array<{ id: string; titulo: string; descripcion_publica: string; estado: string; updated_at: string }>
  const proyectoActual = recientes[0]

  const areas = [
    { titulo: 'Bosquejo', href: '/pastoral/bosquejos', icono: FileText, iconClass: 'text-violet-600' },
    { titulo: 'Versículos', href: '/pastoral/colecciones', icono: BookHeart, iconClass: 'text-indigo-600' },
    { titulo: 'Biblia', href: '/biblia?from=pastoral', icono: BookOpen, iconClass: 'text-indigo-600' },
    { titulo: 'Estudio', href: '/estudios/profundo?from=pastoral', icono: Sparkles, iconClass: 'text-[#C0392B]' },
    { titulo: 'Biblioteca', href: '/pastoral/biblioteca', icono: Library, iconClass: 'text-amber-700' },
    { titulo: 'Materiales', href: '/pastoral/materiales', icono: BookOpenCheck, iconClass: 'text-cyan-700' },
    { titulo: 'Proyectos', href: '/pastoral/paquetes', icono: PackageOpen, iconClass: 'text-slate-700' },
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

      <section className="pastoral-project" aria-labelledby="proyecto-pastoral">
        <div className="pastoral-section-label">
          <PackageOpen aria-hidden="true" />
          <h2 id="proyecto-pastoral">Proyecto</h2>
        </div>

        {proyectoActual ? (
          <Link href={`/pastoral/paquetes/${proyectoActual.id}`} className="pastoral-current-project">
            <span className="pastoral-current-project-icon"><FolderOpen aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <strong className="truncate">{proyectoActual.titulo}</strong>
                <span className={`pastoral-project-status ${estadoPaquete[proyectoActual.estado]?.clase ?? estadoPaquete.borrador.clase}`}>
                  {estadoPaquete[proyectoActual.estado]?.texto ?? estadoPaquete.borrador.texto}
                </span>
              </span>
              <span className="pastoral-current-project-meta">Continuar trabajando</span>
            </span>
            <ChevronRight aria-hidden="true" />
          </Link>
        ) : (
          <p className="pastoral-project-empty">Aún no tienes un proyecto activo.</p>
        )}

        <Link href="/pastoral/paquetes" className="pastoral-primary-action">
          <Plus aria-hidden="true" />
          {proyectoActual ? 'Nuevo proyecto' : 'Crear proyecto'}
        </Link>
      </section>

      <nav className="pastoral-tool-grid" aria-label="Herramientas del Centro Pastoral">
        {areas.map(({ titulo, href, icono: Icono, iconClass }) => (
          <Link key={titulo} href={href} className="pastoral-tool-link">
            <Icono className={iconClass} aria-hidden="true" />
            <span>{titulo}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
