import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpenCheck, ChevronRight, CirclePlus, Eye, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Materiales de estudio' }

const audienciaLabel: Record<string, string> = {
  iglesia: 'Iglesia',
  lideres: 'Líderes',
  servidores: 'Servidores',
  publico: 'Público',
}

export default async function MaterialesPastoralesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a los materiales pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data, error } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, estado, audiencia, publicado, public_slug, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar los materiales pastorales.')

  const materiales = (data ?? []) as Array<{
    id: string
    titulo: string
    descripcion_publica: string
    estado: string
    audiencia: string
    publicado: boolean
    public_slug: string | null
    updated_at: string
  }>

  const accion = (
    <Link href="/pastoral/paquetes" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
      <CirclePlus className="h-4 w-4" /> Nuevo material
    </Link>
  )

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <PastoralPageHeader
        eyebrow="Publicación"
        title="Materiales de estudio"
        description="Revisa, publica y administra las guías que recibirá la congregación."
        icon={BookOpenCheck}
        action={accion}
      />

      {materiales.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-indigo-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <BookOpenCheck className="mx-auto h-11 w-11 text-indigo-300" />
          <div className="pastoral-centered-copy">
            <h2 className="mt-4 text-lg font-bold text-slate-900">Todavía no hay materiales</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Crea un paquete y publícalo cuando la guía esté lista.</p>
          </div>
          <Link href="/pastoral/paquetes" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">Crear primer material <ChevronRight className="h-4 w-4" /></Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materiales.map((material) => (
            <article key={material.id} className="flex min-h-[230px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><BookOpenCheck className="h-5 w-5" /></span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${material.publicado ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{material.publicado ? 'Publicado' : 'Sin publicar'}</span>
              </div>
              <h2 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-slate-950">{material.titulo}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{material.descripcion_publica || 'Material en preparación.'}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><Share2 className="h-4 w-4" /> Audiencia: {audienciaLabel[material.audiencia] ?? 'Iglesia'}</div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <Link href={`/pastoral/paquetes/${material.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Administrar <ChevronRight className="h-4 w-4" /></Link>
                {material.publicado && material.public_slug ? <Link href={`/material/${material.public_slug}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><Eye className="h-4 w-4" /> Ver publicado</Link> : <Link href={`/pastoral/paquetes/${material.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700">Publicar</Link>}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
