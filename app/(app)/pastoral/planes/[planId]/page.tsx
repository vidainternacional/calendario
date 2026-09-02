import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PastoralPlanEditor, { type PastoralPlanData, type PastoralPlanDay } from '@/components/pastoral/PastoralPlanEditor'

export const metadata: Metadata = { title: 'Editar plan de lectura' }
export const dynamic = 'force-dynamic'

export default async function EditarPlanPastoralPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
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

  const { data: plan } = await (supabase as any)
    .from('planes_lectura')
    .select('id, titulo, descripcion, duracion_dias, publicado, creado_por')
    .eq('id', planId)
    .maybeSingle()

  if (!plan) notFound()
  if (rol !== 'administrador' && plan.creado_por !== user.id) redirect('/pastoral/planes')

  const { data: days, error } = await (supabase as any)
    .from('planes_lectura_dias')
    .select('plan_id, numero_dia, titulo, book_code, book_name, chapter, verse_start, verse_end, referencia, devocional, pregunta_reflexion')
    .eq('plan_id', planId)
    .order('numero_dia', { ascending: true })

  if (error) throw new Error('No fue posible cargar los días del plan.')

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/pastoral/planes" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />Planes de lectura
      </Link>

      <header className="mt-4 pb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Editor pastoral</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">{plan.titulo}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Prepara el contenido completo y publícalo cuando todos los días estén listos.</p>
      </header>

      <PastoralPlanEditor plan={plan as PastoralPlanData} days={(days ?? []) as PastoralPlanDay[]} />
    </main>
  )
}
