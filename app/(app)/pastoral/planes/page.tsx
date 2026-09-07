import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookOpenCheck, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Planes de lectura · Centro Pastoral' }
export const dynamic = 'force-dynamic'

export default async function PastoralPlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = String(profile?.rol ?? '')
  const autorizado = Boolean(profile?.activo) && profile?.estado_cuenta === 'activo' && (rol === 'pastor' || rol === 'administrador')
  if (!autorizado) redirect('/pastoral')

  let query = (supabase as any)
    .from('planes_lectura')
    .select('id, titulo, descripcion, duracion_dias, publicado, creado_por, updated_at')
    .order('updated_at', { ascending: false })

  if (rol === 'pastor') query = query.eq('creado_por', user.id)

  const { data: planes, error } = await query
  if (error) throw new Error('No fue posible cargar los planes de lectura.')

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/pastoral" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />Centro Pastoral
      </Link>

      <header className="mt-4 flex items-end justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Contenido pastoral</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Planes de lectura</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">Crea planes por tema, prepara cada día y publícalos cuando estén completos.</p>
        </div>
        <Link href="/pastoral/planes/nuevo" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#C0392B] px-4 text-sm font-bold text-white">
          <Plus className="h-4 w-4" />Nuevo
        </Link>
      </header>

      <section className="divide-y divide-slate-100" aria-label="Planes administrables">
        {(planes ?? []).length ? (planes ?? []).map((plan: any) => (
          <Link key={plan.id} href={`/pastoral/planes/${plan.id}`} className="flex min-h-[92px] items-center gap-3 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#C0392B]"><BookOpenCheck className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-slate-950">{plan.titulo}</strong>
              <span className="mt-1 block line-clamp-1 text-xs text-slate-500">{plan.descripcion}</span>
              <span className="mt-1.5 block text-xs font-semibold text-slate-400">
                {plan.duracion_dias} días · {plan.publicado ? 'Publicado' : 'Borrador'}{rol === 'administrador' && !plan.creado_por ? ' · Sistema' : ''}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </Link>
        )) : (
          <p className="py-8 text-sm text-slate-500">Todavía no has creado planes de lectura.</p>
        )}
      </section>
    </main>
  )
}
