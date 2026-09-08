import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Archive, ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Paquetes recibidos' }
export const dynamic = 'force-dynamic'

type Paquete = {
  id: string
  titulo: string
  descripcion_publica: string | null
  published_at: string | null
  public_slug: string
  audiencia: string
}

export default async function PaquetesRecibidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await (supabase as any).rpc('get_received_pastoral_packages')
  const paquetes = ((data || []) as Paquete[])
    .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/inicio" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-slate-500">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Inicio
      </Link>

      <header className="mt-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-violet-600">Para tu crecimiento</p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900">Paquetes recibidos</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Los paquetes dejan Inicio después de 48 horas, pero permanecen guardados aquí para que puedas volver a consultarlos.</p>
      </header>

      {paquetes.length === 0 ? (
        <section className="mt-6 rounded-[24px] bg-white p-8 text-center ring-1 ring-slate-200">
          <Archive className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-slate-700">Aún no has recibido paquetes pastorales.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Cuando se publique uno para ti, aparecerá primero en Inicio y después quedará guardado aquí.</p>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-[24px] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {paquetes.map((paquete) => {
              const fecha = paquete.published_at
                ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(paquete.published_at))
                : 'Fecha no disponible'

              return (
                <Link key={paquete.id} href={`/material/${paquete.public_slug}`} className="group flex min-h-[82px] items-center gap-3 px-4 py-3.5 active:bg-violet-50/40">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">{paquete.titulo}</span>
                    <span className="mt-1 block line-clamp-1 text-[11px] text-slate-500">{paquete.descripcion_publica || 'Paquete pastoral recibido'}</span>
                    <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.08em] text-violet-500">Publicado {fecha}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
