import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { youtubeVideo } from '@/lib/estudios/youtube-link'

export const metadata: Metadata = { title: 'Mensaje semanal' }
export const dynamic = 'force-dynamic'

export default async function MensajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/estudios/mensajes/${id}`)}`)
  const { data, error } = await (client as unknown as SupabaseClient).rpc('get_internal_pastoral_package', { p_id: id })
  if (error) throw new Error('No se pudo cargar el mensaje. Intenta nuevamente.')
  if (!data || data.access !== 'granted' || data.audiencia !== 'iglesia' || data.bosquejo || data.coleccion) notFound()
  const video = youtubeVideo(String(data.instrucciones || ''))
  if (!video || video.url !== data.instrucciones) notFound()
  return <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
    <Link href="/estudios/mensajes" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />Mensajes semanales</Link>
    <article className="mt-5"><h1 className="break-words text-3xl font-bold leading-tight text-slate-900">{String(data.titulo)}</h1>{data.published_at && <p className="mt-3 text-sm text-slate-500">{new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'America/El_Salvador' }).format(new Date(data.published_at))}</p>}
      <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black"><iframe src={video.embed} title={String(data.titulo)} loading="lazy" className="h-full w-full border-0" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-700">Abrir en YouTube<ExternalLink className="h-4 w-4" /></a>
      <p className="text-xs leading-5 text-slate-500">Si el video no permite reproducirse aquí, puedes abrirlo en YouTube.</p>
      {data.descripcion_publica && <div className="mt-7 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{String(data.descripcion_publica)}</div>}
    </article>
  </main>
}
