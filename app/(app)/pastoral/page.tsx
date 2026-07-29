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
    (supabase as any)
      .from('profiles')
      .select('nombre_completo, rol, es_pastor_general, estado_cuenta, acceso_centro_pastoral')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('pastoral_paquetes')
      .select('id, titulo, descripcion_publica, estado, updated_at')
      .eq('profile_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3),
  ])

  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)
  const recientes = (paquetes ?? []) as Array<{ id: string; titulo: string; descripcion_publica: string; estado: string; updated_at: string }>

  const herramientas = [
    { href: '/pastoral/bosquejos', titulo: 'Bosquejos', texto: 'Prepare la estructura y los puntos del mensaje.', icono: FileText, clase: 'bg-violet-50 text-violet-700' },
    { href: '/pastoral/colecciones', titulo: 'Versículos', texto: 'Reúna los pasajes bíblicos del tema.', icono: BookHeart, clase: 'bg-indigo-50 text-indigo-700' },
    { href: '/pastoral/biblioteca', titulo: 'Biblioteca', texto: 'Adjunte archivos, enlaces y recursos de apoyo.', icono: Library, clase: 'bg-amber-50 text-amber-700' },
    { href: '/pastoral/materiales', titulo: 'Materiales', texto: 'Prepare guías y contenido para compartir.', icono: BookOpenCheck, clase: 'bg-cyan-50 text-cyan-700' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-indigo-600">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Centro pastoral</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{nombre ? `Hola, ${nombre}` : 'Centro Pastoral'}</h1>
          {esPastorGeneral && <span className="inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700">Pastor General</span>}
        </div>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Prepare y comparta cada mensaje desde un único espacio de trabajo.</p>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm" aria-labelledby="espacio-pastoral">
        <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-100">Un solo flujo de trabajo</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 id="espacio-pastoral" className="text-xl font-bold">Espacio pastoral</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-indigo-100">Bosquejo, versículos, recursos y material final permanecen unidos dentro de un paquete pastoral.</p>
            </div>
            <PackageOpen className="h-7 w-7 shrink-0 text-white/80" />
          </div>
          <Link href="/pastoral/paquetes" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 sm:w-auto">
            <Plus className="h-4 w-4" /> Crear nuevo paquete
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          {recientes.length > 0 && (
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Continuar trabajando</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Abra un paquete reciente y siga donde quedó.</p>
                </div>
                <Link href="/pastoral/paquetes" className="text-xs font-bold text-indigo-700">Ver todos</Link>
              </div>
              <div className="space-y-2">
                {recientes.map((paquete) => {
                  const estadoActual = estadoPaquete[paquete.estado] ?? estadoPaquete.borrador
                  return (
                    <Link key={paquete.id} href={`/pastoral/paquetes/${paquete.id}`} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition active:scale-[0.99]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm"><FolderOpen className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <strong className="truncate text-sm text-slate-900">{paquete.titulo}</strong>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${estadoActual.clase}`}>{estadoActual.texto}</span>
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{paquete.descripcion_publica || 'Paquete pastoral en preparación.'}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200" aria-label="Herramientas del espacio pastoral">
            {herramientas.map(({ href, titulo, texto, icono: Icono, clase }, index) => (
              <Link key={href} href={href} className={`flex min-h-20 items-center gap-3 bg-white p-4 transition hover:bg-slate-50 active:bg-slate-100 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${clase}`}><Icono className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-slate-900">{titulo}</strong>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{texto}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/biblia?from=pastoral" className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen className="h-5 w-5" /></span>
              <span><strong className="block text-sm text-slate-900">Biblia</strong><span className="text-[11px] text-slate-500">Leer y buscar</span></span>
            </Link>
            <Link href="/estudios/profundo?from=pastoral" className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#C0392B]"><Sparkles className="h-5 w-5" /></span>
              <span><strong className="block text-sm text-slate-900">Estudio</strong><span className="text-[11px] text-slate-500">Analizar pasaje</span></span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
