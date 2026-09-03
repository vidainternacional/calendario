import Link from 'next/link'
import { CalendarDays, ChevronDown, Music2 } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { cargarCalendarioMinisterial } from '@/lib/programacion/calendario-ministerial'
import MusicianSetlistClient, { type MusicianSetlistSong } from '@/components/ministerios/MusicianSetlistClient'

export const dynamic = 'force-dynamic'

function fechaServicio(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function rangoSetlist() {
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const end = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString() }
}

export default async function SetlistAlabanzaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ evento?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')
  const esAdmin = profile.rol === 'administrador'
  if (!membresia && !esAdmin) redirect(`/ministerios/${id}`)
  if (String(ministerio.nombre || '').trim().toLowerCase() !== 'alabanza') redirect(`/ministerios/${id}`)

  const { start, end } = rangoSetlist()
  const { items } = await cargarCalendarioMinisterial(admin, id, start, end)
  const servicios = items.filter((item) => item.kind === 'event' && item.preparado)
  const servicio = servicios.find((item) => item.id === String(query.evento || '')) || servicios[0] || null
  const color = ministerio.color_primario || '#5b3df5'
  const puedeEditarOficial = esAdmin || membresia?.es_lider === true

  if (!servicio) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+5.5rem)] sm:px-6">
        <div className="rounded-[24px] bg-white px-5 py-12 text-center ring-1 ring-black/[0.04]">
          <Music2 className="mx-auto h-8 w-8 text-slate-300" />
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">Setlist de Alabanza</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Todavía no hay un servicio preparado para Alabanza.</p>
        </div>
      </main>
    )
  }

  const { data: rows = [] } = await admin
    .from('evento_repertorio')
    .select('id,cancion_id,orden,titulo,tonalidad,notas,spotify_url,youtube_url,ministerio_canciones(id,titulo,artista,spotify_url,youtube_url,tonalidad_base,acordes)')
    .eq('evento_id', servicio.id)
    .eq('ministerio_id', id)
    .order('orden')
    .order('created_at')

  const songs: MusicianSetlistSong[] = (rows as any[]).map((row) => {
    const library = Array.isArray(row.ministerio_canciones) ? row.ministerio_canciones[0] : row.ministerio_canciones
    return {
      rowId: String(row.id),
      songId: library?.id ? String(library.id) : row.cancion_id ? String(row.cancion_id) : null,
      title: String(row.titulo || library?.titulo || 'Canción'),
      artist: library?.artista || null,
      serviceTone: String(row.tonalidad || library?.tonalidad_base || ''),
      baseTone: String(library?.tonalidad_base || row.tonalidad || ''),
      chords: String(library?.acordes || ''),
      notes: String(row.notas || ''),
    }
  })

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+5.25rem)]">
      <header className="px-4 pb-4 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Vista para músicos</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">{servicio.titulo}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{fechaServicio(servicio.fecha_inicio)}{servicio.ubicacion ? ` · ${servicio.ubicacion}` : ''}</p>
      </header>

      {servicios.length > 1 ? (
        <details className="mx-4 mb-4 overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.04] sm:mx-6">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-xs font-extrabold text-slate-700 [&::-webkit-details-marker]:hidden">Cambiar servicio <ChevronDown className="h-4 w-4 text-slate-400" /></summary>
          <div className="border-t border-slate-100">
            {servicios.map((item) => <Link key={item.id} href={`/ministerios/${id}/setlist?evento=${item.id}`} className={`block border-b border-slate-100 px-4 py-3 text-sm last:border-0 ${item.id === servicio.id ? 'font-extrabold text-violet-700' : 'font-semibold text-slate-700'}`}><span className="block">{item.titulo}</span><span className="mt-0.5 block text-[10px] font-medium text-slate-400">{fechaServicio(item.fecha_inicio)}</span></Link>)}
          </div>
        </details>
      ) : null}

      <section className="mx-4 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.04] sm:mx-6">
        <div className="border-b border-slate-100 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Setlist</p><p className="mt-0.5 text-sm font-extrabold text-slate-800">{songs.length} {songs.length === 1 ? 'canción preparada' : 'canciones preparadas'}</p></div>
        <MusicianSetlistClient ministerioId={id} songs={songs} canEditOfficial={puedeEditarOficial} />
      </section>
    </main>
  )
}
