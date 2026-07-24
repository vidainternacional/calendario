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

export const metadata: Metadata = { title: 'Centro Pastoral' }

const estadoPaquete: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-slate-100 text-slate-600' },
  listo: { texto: 'Listo', clase: 'bg-emerald-50 text-emerald-700' },
  compartido: { texto: 'Compartido', clase: 'bg-indigo-50 text-indigo-700' },
}

export default async function PastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: paquetes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo, rol, es_pastor_general, estado_cuenta')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('pastoral_paquetes')
      .select('id, titulo, descripcion_publica, estado, updated_at')
      .eq('profile_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(4),
  ])

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') redirect('/inicio')

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)
  const recientes = (paquetes ?? []) as Array<{ id: string; titulo: string; descripcion_publica: string; estado: string; updated_at: string }>

  const herramientas = [
    { href: '/pastoral/bosquejos', titulo: 'Bosquejos', texto: 'Preparar y predicar', icono: FileText, clase: 'bg-violet-50 text-violet-700' },
    { href: '/pastoral/colecciones', titulo: 'Versículos', texto: 'Colecciones bíblicas', icono: BookHeart, clase: 'bg-indigo-50 text-indigo-700' },
    { href: '/pastoral/biblioteca', titulo: 'Biblioteca', texto: 'Archivos y enlaces', icono: Library, clase: 'bg-amber-50 text-amber-700' },
    { href: '/pastoral/materiales', titulo: 'Materiales', texto: 'Guías y distribución', icono: BookOpenCheck, clase: 'bg-cyan-50 text-cyan-700' },
    { href: '/pastoral/paquetes', titulo: 'Paquetes', texto: 'Preparar y compartir', icono: PackageOpen, clase: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7 lg:px-8">
      <header className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 text-indigo-600"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Centro pastoral</p></div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{nombre ? `Hola, ${nombre}` : 'Centro Pastoral'}</h1>
          {esPastorGeneral && <span className="inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700">Pastor General</span>}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Prepare el mensaje, reúna sus recursos y comparta el resultado con la iglesia desde este mismo espacio.</p>
      </header>

      <section aria-labelledby="paquetes-recientes" className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="paquetes-recientes" className="text-lg font-bold text-slate-950">Sus paquetes pastorales</h2>
            <p className="mt-0.5 text-xs text-slate-500">Continúe donde quedó o prepare uno nuevo.</p>
          </div>
          <Link href="/pastoral/paquetes" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white sm:px-4"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nuevo paquete</span><span className="sm:hidden">Nuevo</span></Link>
        </div>

        {recientes.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recientes.map((paquete) => {
              const estadoActual = estadoPaquete[paquete.estado] ?? estadoPaquete.borrador
              return (
                <Link key={paquete.id} href={`/pastoral/paquetes/${paquete.id}`} className="group flex min-h-[154px] flex-col rounded-[20px] border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm"><FolderOpen className="h-5 w-5" /></span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${estadoActual.clase}`}>{estadoActual.texto}</span>
                  </div>
                  <h3 className="mt-4 line-clamp-2 font-bold leading-snug text-slate-900">{paquete.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{paquete.descripcion_publica || 'Paquete pastoral listo para completar.'}</p>
                  <span className="mt-auto flex items-center justify-end pt-3 text-xs font-bold text-indigo-700">Abrir <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-[20px] border border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm"><PackageOpen className="h-6 w-6" /></span>
            <h3 className="mt-3 font-bold text-slate-900">Todavía no hay paquetes</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Cree el primero para unir bosquejo, versículos, recursos y material para la congregación.</p>
            <Link href="/pastoral/paquetes" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Crear primer paquete</Link>
          </div>
        )}

        {recientes.length > 0 && <Link href="/pastoral/paquetes" className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">Ver todos los paquetes <ChevronRight className="h-4 w-4" /></Link>}
      </section>

      <section className="mt-5" aria-labelledby="herramientas-centro">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 id="herramientas-centro" className="text-base font-bold text-slate-950">Herramientas de preparación</h2><p className="mt-0.5 text-xs text-slate-500">Todo lo que agregue aquí puede formar parte de un paquete.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {herramientas.map(({ href, titulo, texto, icono: Icono, clase }) => (
            <Link key={href} href={href} className="group flex min-h-[126px] flex-col rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${clase}`}><Icono className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-bold text-slate-900 sm:text-base">{titulo}</h3>
              <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] leading-4 text-slate-500 sm:text-xs">{texto}<ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5" aria-labelledby="investigacion-pastoral">
        <h2 id="investigacion-pastoral" className="mb-3 text-base font-bold text-slate-950">Investigar</h2>
        <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
          <Link href="/biblia?from=pastoral" className="flex min-h-[92px] items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen className="h-5 w-5" /></span><span className="min-w-0"><strong className="block text-sm text-slate-900">Biblia</strong><span className="block truncate text-[11px] text-slate-500 sm:text-xs">Leer y buscar</span></span></Link>
          <Link href="/estudios/profundo?from=pastoral" className="flex min-h-[92px] items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#C0392B]"><Sparkles className="h-5 w-5" /></span><span className="min-w-0"><strong className="block text-sm text-slate-900">Estudio profundo</strong><span className="block truncate text-[11px] text-slate-500 sm:text-xs">Analizar un pasaje</span></span></Link>
        </div>
      </section>
    </main>
  )
}
