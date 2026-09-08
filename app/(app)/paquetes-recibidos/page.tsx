import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Archive, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaquetesRecibidosClient, { type PaqueteRecibido } from '@/components/inicio/PaquetesRecibidosClient'

export const metadata: Metadata = { title: 'Paquetes recibidos' }
export const dynamic = 'force-dynamic'

export default async function PaquetesRecibidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await (supabase as any).rpc('get_received_pastoral_packages')
  const paquetes = ((data || []) as PaqueteRecibido[])
    .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/inicio" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-slate-500">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Inicio
      </Link>

      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-[-.03em] text-slate-900">Paquetes recibidos</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Aquí quedan guardados los paquetes que el pastor ha enviado para que puedas volver a consultarlos cuando quieras.</p>
      </header>

      {paquetes.length === 0 ? (
        <section className="mt-6 rounded-[24px] bg-white p-8 text-center ring-1 ring-slate-200">
          <Archive className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-slate-700">Aún no has recibido paquetes pastorales.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Cuando se publique uno para ti, aparecerá aquí automáticamente.</p>
        </section>
      ) : (
        <PaquetesRecibidosClient paquetes={paquetes} />
      )}
    </main>
  )
}
