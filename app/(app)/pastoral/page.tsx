import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookHeart,
  BookOpen,
  ChevronRight,
  FileText,
  Library,
  PackageOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Panel Pastoral' }

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

  const nombre = (profile as { nombre_completo?: string } | null)?.nombre_completo?.split(' ')[0]
  const esPastorGeneral = Boolean((profile as { es_pastor_general?: boolean } | null)?.es_pastor_general)

  const etapas = [
    { numero: '1', titulo: 'Investigar', texto: 'Biblia, concordancia y estudio profundo.' },
    { numero: '2', titulo: 'Preparar', texto: 'Colecciones y bosquejo del mensaje.' },
    { numero: '3', titulo: 'Reunir', texto: 'Archivos, enlaces y recursos de apoyo.' },
    { numero: '4', titulo: 'Compartir', texto: 'Paquete final para la iglesia.' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <div className="mb-3 flex items-center gap-2 text-indigo-600"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Centro pastoral</p></div>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">{nombre ? `Bienvenido, ${nombre}` : 'Panel Pastoral'}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">Prepara el mensaje, reúne los recursos y entrega una guía completa a la congregación desde un solo flujo.</p>
        {esPastorGeneral && <span className="mt-3 inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700">Pastor General</span>}
      </header>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-800 via-violet-800 to-slate-950 p-5 text-white shadow-[0_18px_55px_rgba(67,56,202,0.28)] sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><PackageOpen className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Resultado final</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Paquetes pastorales</h2>
          <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">Une bosquejo, versículos, biblioteca y aplicación en una sola guía lista para imprimir, copiar o compartir con la iglesia.</p>
        </div>
        <Link href="/pastoral/paquetes" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-indigo-800 shadow-sm lg:mt-0 lg:w-auto lg:min-w-48">Abrir paquetes <ChevronRight className="h-4 w-4" /></Link>
      </section>

      <section className="mt-6" aria-labelledby="flujo-pastoral">
        <div className="mb-3"><h2 id="flujo-pastoral" className="text-sm font-bold text-slate-900">Flujo de preparación</h2><p className="mt-0.5 text-xs text-slate-500">Cada herramienta alimenta el paquete final.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {etapas.map((etapa) => <article key={etapa.numero} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{etapa.numero}</span><h3 className="mt-3 font-bold text-slate-900">{etapa.titulo}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{etapa.texto}</p></article>)}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="herramientas-pastorales">
        <div className="mb-3"><h2 id="herramientas-pastorales" className="text-sm font-bold text-slate-900">Herramientas del mensaje</h2><p className="mt-0.5 text-xs text-slate-500">Trabaja cada parte y después relaciónala dentro del paquete.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/pastoral/colecciones" className="group rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm transition-transform active:scale-[0.99]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><BookHeart className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-indigo-500">Fundamento bíblico</p><h3 className="mt-1 text-lg font-bold text-slate-900">Colecciones</h3><p className="mt-2 text-sm leading-6 text-slate-500">Agrupa versículos y notas por tema o mensaje.</p><span className="mt-4 flex items-center justify-between text-sm font-bold text-indigo-700">Abrir <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></Link>
          <Link href="/pastoral/bosquejos" className="group rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm transition-transform active:scale-[0.99]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><FileText className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-violet-500">Desarrollo del mensaje</p><h3 className="mt-1 text-lg font-bold text-slate-900">Bosquejos</h3><p className="mt-2 text-sm leading-6 text-slate-500">Prepara, predica y presenta desde cualquier dispositivo.</p><span className="mt-4 flex items-center justify-between text-sm font-bold text-violet-700">Abrir <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></Link>
          <Link href="/pastoral/biblioteca" className="group rounded-[24px] border border-amber-100 bg-white p-5 shadow-sm transition-transform active:scale-[0.99]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Library className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-amber-600">Recursos de apoyo</p><h3 className="mt-1 text-lg font-bold text-slate-900">Biblioteca</h3><p className="mt-2 text-sm leading-6 text-slate-500">Conserva archivos, enlaces, estudios y presentaciones.</p><span className="mt-4 flex items-center justify-between text-sm font-bold text-amber-700">Abrir <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="apoyo-investigacion">
        <div className="mb-3"><h2 id="apoyo-investigacion" className="text-sm font-bold text-slate-900">Investigación y apoyo</h2></div>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
          <Link href="/biblia?from=pastoral" className="group flex min-h-[112px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen className="h-5 w-5" /></span><span className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-900">Biblia <ChevronRight className="h-4 w-4 text-slate-300" /></span></Link>
          <Link href="/estudios/profundo?from=pastoral" className="group flex min-h-[112px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#C0392B]"><Sparkles className="h-5 w-5" /></span><span className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-900">Estudio Profundo <ChevronRight className="h-4 w-4 text-slate-300" /></span></Link>
        </div>
      </section>
    </main>
  )
}
