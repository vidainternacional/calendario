import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { youtubeVideo } from '@/lib/estudios/youtube-link'

export const metadata: Metadata = { title: 'Devocionales y mensajes' }
export const dynamic = 'force-dynamic'

export default async function MensajePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ origen?: string }>
}) {
  const { id } = await params
  const { origen } = await searchParams
  const desdePastoral = origen === 'pastoral'
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent('/estudios/mensajes/' + id))

  // La tabla nueva aplica RLS al JWT del usuario. Si no pertenece a la audiencia,
  // la consulta devuelve null y el enlace directo también queda protegido.
  const db = client as unknown as SupabaseClient
  const { data: dirigido, error: dirigidoError } = await db.from('vida_devocionales')
    .select('titulo,descripcion,video_url,published_at')
    .eq('id', id).eq('publicado', true).maybeSingle()
  if (dirigidoError) throw new Error('No se pudo comprobar el acceso al mensaje.')

  let titulo: string
  let descripcion: string
  let fecha: string | null
  let enlace: string

  if (dirigido) {
    titulo = String(dirigido.titulo)
    descripcion = String(dirigido.descripcion || '')
    fecha = typeof dirigido.published_at === 'string' ? dirigido.published_at : null
    enlace = String(dirigido.video_url)
  } else {
    // Compatibilidad de solo lectura con mensajes publicados del módulo anterior.
    // Esta RPC conserva íntegra su autorización histórica.
    const { data, error } = await db.rpc('get_internal_pastoral_package', { p_id: id })
    if (error) throw new Error('No se pudo cargar el mensaje. Intentá nuevamente.')
    if (!data || data.access !== 'granted' || data.audiencia !== 'iglesia' || data.bosquejo || data.coleccion) notFound()
    titulo = String(data.titulo)
    descripcion = String(data.descripcion_publica || '')
    fecha = typeof data.published_at === 'string' ? data.published_at : null
    enlace = String(data.instrucciones || '')
  }

  const video = youtubeVideo(enlace)
  if (!video || video.url !== enlace) notFound()

  return <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
    <Link href={desdePastoral ? '/estudios/mensajes?origen=pastoral' : '/estudios/mensajes'}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600">
      <ArrowLeft className="h-4 w-4" />Devocionales y mensajes
    </Link>
    <article className="mt-5">
      <h1 className="break-words text-3xl font-bold leading-tight text-slate-900">{titulo}</h1>
      {fecha && <p className="mt-3 text-sm text-slate-500">{new Intl.DateTimeFormat('es-SV', {
        dateStyle: 'long', timeZone: 'America/El_Salvador',
      }).format(new Date(fecha))}</p>}
      <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe src={video.embed} title={titulo} loading="lazy" className="h-full w-full border-0"
          allow="encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <a href={video.url} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-700">
        Abrir en YouTube<ExternalLink className="h-4 w-4" />
      </a>
      <p className="text-xs leading-5 text-slate-500">Si el video no permite reproducirse aquí, podés abrirlo en YouTube.</p>
      {descripcion && <div className="mt-7 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{descripcion}</div>}
    </article>
  </main>
}
