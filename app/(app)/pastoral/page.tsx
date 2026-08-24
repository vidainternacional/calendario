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
    {
      id: 'bosquejo',
      titulo: 'Bosquejo',
      href: '/pastoral/bosquejos',
      accion: 'Abrir bosquejos',
      icono: FileText,
      iconClass: 'text-violet-600 bg-violet-50',
    },
    {
      id: 'versiculos',
      titulo: 'Versículos',
      href: '/pastoral/colecciones',
      accion: 'Abrir versículos',
      icono: BookHeart,
      iconClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'biblia',
      titulo: 'Biblia',
      href: '/biblia?from=pastoral',
      accion: 'Leer y buscar en la Biblia',
      icono: BookOpen,
      iconClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'estudio',
      titulo: 'Estudio bíblico',
      href: '/estudios/profundo?from=pastoral',
      accion: 'Analizar un pasaje',
      icono: Sparkles,
      iconClass: 'text-[#C0392B] bg-rose-50',
    },
    {
      id: 'biblioteca',
      titulo: 'Biblioteca',
      href: '/pastoral/biblioteca',
      accion: 'Abrir biblioteca',
      icono: Library,
      iconClass: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'materiales',
      titulo: 'Materiales',
      href: '/pastoral/materiales',
      accion: 'Abrir materiales',
      icono: BookOpenCheck,
      iconClass: 'text-cyan-700 bg-cyan-50',
    },
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

      <section className="pastoral-work-areas" aria-label="Áreas del proyecto pastoral">
        {areas.map(({ id, titulo, href, accion, icono: Icono, iconClass }) => (
          <details key={id} className="pastoral-work-section">
            <summary>
              <span className={`pastoral-work-icon ${iconClass}`}><Icono aria-hidden="true" /></span>
              <strong>{titulo}</strong>
              <ChevronRight className="pastoral-work-chevron" aria-hidden="true" />
            </summary>
            <div className="pastoral-work-panel">
              <Link href={href} className="pastoral-secondary-action">
                {accion}
                <ChevronRight aria-hidden="true" />
              </Link>
            </div>
          </details>
        ))}

        <details className="pastoral-work-section">
          <summary>
            <span className="pastoral-work-icon bg-slate-100 text-slate-700"><PackageOpen aria-hidden="true" /></span>
            <strong>Proyectos</strong>
            <ChevronRight className="pastoral-work-chevron" aria-hidden="true" />
          </summary>
          <div className="pastoral-work-panel pastoral-project-list">
            {recientes.length > 0 ? recientes.map((paquete) => {
              const estadoActual = estadoPaquete[paquete.estado] ?? estadoPaquete.borrador
              return (
                <Link key={paquete.id} href={`/pastoral/paquetes/${paquete.id}`} className="pastoral-project-row">
                  <span className="min-w-0 flex-1">
                    <strong className="truncate">{paquete.titulo}</strong>
                    <span>{estadoActual.texto}</span>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </Link>
              )
            }) : <p className="pastoral-project-empty">No hay proyectos recientes.</p>}
            <Link href="/pastoral/paquetes" className="pastoral-secondary-action">
              Ver todos los proyectos
              <ChevronRight aria-hidden="true" />
            </Link>
          </div>
        </details>
      </section>
    </main>
  )
}
