import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PastoralPlanCreateForm from '@/components/pastoral/PastoralPlanCreateForm'

export const metadata: Metadata = { title: 'Nuevo plan de lectura' }

export default async function NuevoPlanPastoralPage() {
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

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <Link href="/pastoral/planes" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
        <ArrowLeft className="h-4 w-4" />Planes de lectura
      </Link>

      <header className="mt-4 pb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Centro Pastoral</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Crear plan</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Define primero el tema, objetivo y duración. Después prepararás el contenido de cada día.</p>
      </header>

      <PastoralPlanCreateForm />
    </main>
  )
}
