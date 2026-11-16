import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cargarMisMensajesSemanales } from '@/lib/estudios/mensajes-semanales'
import MensajesSemanalesEditor from '@/components/estudios/MensajesSemanalesEditor'

export const metadata: Metadata = { title: 'Devocionales y mensajes · Centro Pastoral' }
export const dynamic = 'force-dynamic'

export default async function PastoralMensajesPage() {
  const data = await cargarMisMensajesSemanales()
  if (!data.autenticado) redirect('/login?next=%2Fpastoral%2Fmensajes')
  if (!data.puedeGestionar) redirect('/pastoral')

  return <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
    <Link href="/pastoral" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600">
      <ArrowLeft className="h-4 w-4" />Centro Pastoral
    </Link>
    <header className="mt-4 border-b border-slate-100 pb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Contenido pastoral</p>
      <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Devocionales y mensajes</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Prepara los videos en YouTube, guarda un borrador y publícalos para la iglesia cuando estén listos.</p>
    </header>
    {data.error
      ? <p role="alert" className="mt-6 text-sm text-red-700">{data.error}</p>
      : <MensajesSemanalesEditor mensajes={data.propios} />}
    <Link href="/estudios/mensajes" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-700">
      Ver biblioteca en Estudios <ChevronRight className="h-4 w-4" />
    </Link>
  </main>
}
