import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BosquejosClient from '@/components/pastoral/BosquejosClient'

export const metadata: Metadata = { title: 'Bosquejos pastorales' }

export default async function BosquejosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') redirect('/inicio')

  const { data } = await (supabase as any)
    .from('pastoral_bosquejos')
    .select('id, titulo, tema, pasaje_base, estado, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/pastoral" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700"><ArrowLeft className="h-4 w-4" /> Panel Pastoral</Link>
      <header className="mb-6 mt-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Preparación de prédicas</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Bosquejos pastorales</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Crea, organiza y recupera la estructura de tus mensajes.</p>
      </header>
      <BosquejosClient bosquejos={(data ?? []) as any} />
    </main>
  )
}
