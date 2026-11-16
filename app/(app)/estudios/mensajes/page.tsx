import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import MensajesBiblioteca from '@/components/estudios/MensajesBiblioteca'
import { cargarMensajesSemanales } from '@/lib/estudios/mensajes-semanales'

export const metadata: Metadata = { title: 'Devocionales y mensajes' }
export const dynamic = 'force-dynamic'

export default async function MensajesPage({ searchParams }: { searchParams: Promise<{ pagina?: string; origen?: string }> }) {
  const params = await searchParams
  const pagina = Math.min(100, Math.max(1, Number.parseInt(params.pagina || '1', 10) || 1))
  const desdePastoral = params.origen === 'pastoral'
  const sufijo = desdePastoral ? '&origen=pastoral' : ''
  const data = await cargarMensajesSemanales(pagina)
  if (!data.autenticado) redirect('/login?next=%2Festudios%2Fmensajes')
  return <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
    <Link href={desdePastoral ? "/pastoral/mensajes" : "/estudios"} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />{desdePastoral ? "Volver a Devocionales" : "Estudios Bíblicos"}</Link>
    <header className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Vida Internacional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Devocionales y mensajes</h1><p className="mt-3 text-sm leading-6 text-slate-500">Devocionales y mensajes en video para acompañarte durante la semana.</p></header>
    {data.error ? <p role="alert" className="mt-7 rounded-xl border border-red-200 bg-white p-5 text-sm text-red-800">{data.error}</p> : <>
      <MensajesBiblioteca mensajes={data.mensajes} pagina={pagina} desdePastoral={desdePastoral} />
      {(pagina > 1 || data.haySiguiente) && <nav className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-4" aria-label="Páginas de mensajes">{pagina > 1 ? <Link className="min-h-11 py-3 text-sm font-bold text-violet-700" href={`/estudios/mensajes?pagina=${pagina - 1}${sufijo}`}>Más recientes</Link> : <span />}<span className="text-xs text-slate-500">Página {pagina}</span>{data.haySiguiente && pagina < 100 ? <Link className="min-h-11 py-3 text-sm font-bold text-violet-700" href={`/estudios/mensajes?pagina=${pagina + 1}${sufijo}`}>Anteriores</Link> : <span />}</nav>}
    </>}
  </main>
}
