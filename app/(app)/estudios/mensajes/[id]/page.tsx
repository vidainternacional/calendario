import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import RegistrarVideoAbierto from '@/components/notificaciones/RegistrarVideoAbierto'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { youtubeVideo } from '@/lib/estudios/youtube-link'
import { TIPO_DEVOCIONAL_IDS, type TipoDevocional } from '@/lib/estudios/mensajes-dirigidos-tipos'

export const metadata: Metadata = { title: 'Devocionales y mensajes' }
export const dynamic = 'force-dynamic'

export default async function MensajePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ origen?: string; categoria?: string }>
}) {
  const { id } = await params
  const { origen, categoria: categoriaParametro } = await searchParams
  const desdePastoral = origen === 'pastoral'
  const categoria = TIPO_DEVOCIONAL_IDS.has(categoriaParametro as TipoDevocional) ? categoriaParametro as TipoDevocional : 'todos'
  const sufijo = [desdePastoral ? 'origen=pastoral' : '', categoria !== 'todos' ? 'categoria=' + categoria : ''].filter(Boolean).join('&')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent('/estudios/mensajes/' + id))

  // La tabla nueva aplica RLS al JWT del usuario. Si no pertenece a la audiencia,
  // la consulta devuelve null y el enlace directo también queda protegido.
  const db = client as unknown as SupabaseClient
  const { data: dirigido, error: dirigidoError } = await db.from('vida_devocionales')
    .select('titulo,descripcion,video_url,published_at,tipo,serie_titulo,serie_episodio,autor_id')
    .eq('id', id).eq('publicado', true).maybeSingle()
  if (dirigidoError) throw new Error('No se pudo comprobar el acceso al mensaje.')

  let titulo: string
  let descripcion: string
  let fecha: string | null
  let enlace: string
  let serie: { titulo: string; actual: number; episodios: Array<{ id: string; titulo: string; numero: number }> } | null = null

  if (dirigido) {
    titulo = String(dirigido.titulo)
    descripcion = String(dirigido.descripcion || '')
    fecha = typeof dirigido.published_at === 'string' ? dirigido.published_at : null
    enlace = String(dirigido.video_url)
    if (dirigido.tipo === 'serie' && typeof dirigido.serie_titulo === 'string' &&
        typeof dirigido.serie_episodio === 'number') {
      // Misma RLS por usuario: ningún episodio fuera de su audiencia aparece en este listado.
      const { data: capitulos, error: errorCapitulos } = await db.from('vida_devocionales')
        .select('id,titulo,serie_episodio')
        .eq('tipo', 'serie').eq('serie_titulo', dirigido.serie_titulo)
        .eq('autor_id', dirigido.autor_id).eq('publicado', true)
        .order('serie_episodio', { ascending: true }).limit(999)
      if (errorCapitulos) throw new Error('No se pudo cargar la serie.')
      serie = { titulo: dirigido.serie_titulo, actual: dirigido.serie_episodio,
        episodios: (capitulos ?? []).map(e => ({ id: String(e.id), titulo: String(e.titulo),
          numero: Number(e.serie_episodio) })) }
    }
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
    <Link href={'/estudios/mensajes' + (sufijo ? '?' + sufijo : '')}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600">
      <ArrowLeft className="h-4 w-4" />Devocionales y mensajes
    </Link>
    {dirigido && fecha ? <RegistrarVideoAbierto usuarioId={user.id} id={id} publicadoEn={new Date(fecha).toISOString()} /> : null}
    <article className="mt-5">
      {serie && <p className="mb-2 text-sm font-bold text-violet-700">Serie: {serie.titulo} · Episodio {serie.actual}</p>}
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
      {serie && <section className="mt-8 border-t border-slate-200 pt-5" aria-label="Episodios de la serie">
        <h2 className="text-lg font-bold text-slate-900">Episodios de {serie.titulo}</h2>
        <p className="mt-1 text-xs text-slate-500">Se muestran únicamente los episodios a los que tenés acceso.</p>
        <div className="mt-3 divide-y divide-slate-200">
          {serie.episodios.map(e => <Link key={e.id}
            href={'/estudios/mensajes/' + e.id + (sufijo ? '?' + sufijo : '')}
            aria-current={e.numero === serie?.actual ? 'page' : undefined}
            className={'flex min-h-12 items-center gap-3 py-2 text-sm ' +
              (e.numero === serie?.actual ? 'font-bold text-violet-700' : 'font-medium text-slate-700')}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">{e.numero}</span>
            <span className="min-w-0 break-words">{e.titulo}</span>
            {e.numero === serie?.actual && <span className="ml-auto shrink-0 text-[11px]">Actual</span>}
          </Link>)}
        </div>
      </section>}
    </article>
  </main>
}
