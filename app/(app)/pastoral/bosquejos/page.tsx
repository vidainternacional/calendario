import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BosquejosClient from '@/components/pastoral/BosquejosClient'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Bosquejos pastorales' }

export default async function BosquejosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a los bosquejos pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data, error } = await (supabase as any)
    .from('pastoral_bosquejos')
    .select('id, titulo, tema, pasaje_base, estado, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar los bosquejos pastorales.')

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/pastoral" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700"><ArrowLeft className="h-4 w-4" /> Centro Pastoral</Link>
      <header className="mb-6 mt-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Preparación de prédicas</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Bosquejos pastorales</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Crea, organiza y recupera la estructura de tus mensajes.</p>
      </header>
      <BosquejosClient bosquejos={(data ?? []) as any} />
    </main>
  )
}
