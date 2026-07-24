import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BosquejoEditorClient from '@/components/pastoral/BosquejoEditorClient'

export const metadata: Metadata = { title: 'Editar bosquejo' }

export default async function BosquejoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: bosquejo } = await (supabase as any)
    .from('pastoral_bosquejos')
    .select('id, titulo, tema, pasaje_base, proposito, introduccion, puntos, conclusion, estado, fecha_predicacion')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!bosquejo) notFound()

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/pastoral/bosquejos" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700"><ArrowLeft className="h-4 w-4" /> Bosquejos</Link>
      <header className="mb-6 mt-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Editor pastoral</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Preparar bosquejo</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Construye el mensaje por secciones y conserva el progreso.</p>
      </header>
      <BosquejoEditorClient bosquejo={bosquejo as any} />
    </main>
  )
}
