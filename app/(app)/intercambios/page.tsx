import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowLeftRight, CalendarDays, Check, Clock3, ExternalLink, Music2, Palette, X } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { aceptarIntercambio, rechazarIntercambio } from '@/app/actions/intercambios'
import BackButton from '@/components/navigation/BackButton'
import UserAvatar from '@/components/comunidad/UserAvatar'
import EstadoAsignacionControl from '@/components/ministerios/EstadoAsignacionMusico'
import type { EstadoAsignacionMusico } from '@/app/actions/asignaciones-musico'

export const metadata: Metadata = { title: 'Mis servicios' }
export const dynamic = 'force-dynamic'

type Servicio = {
  key: string
  eventoId: string
  ministerioId: string
  ministerioNombre: string
  color: string
  titulo: string
  fechaInicio: string
  ubicacion: string | null
  funciones: string[]
  estados: string[]
  estado: EstadoAsignacionMusico
}

function normalizarEstado(estados: string[]): EstadoAsignacionMusico {
  if (estados.some((estado) => estado === 'no_disponible' || estado === 'declinado')) return 'no_disponible'
  if (estados.length > 0 && estados.every((estado) => estado === 'confirmado')) return 'confirmado'
  return 'pendiente'
}

function fechaServicio(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function estadoTexto(estado: EstadoAsignacionMusico) {
  if (estado === 'confirmado') return 'Confirmado'
  if (estado === 'no_disponible') return 'No disponible'
  return 'Pendiente'
}

function estadoClases(estado: EstadoAsignacionMusico) {
  if (estado === 'confirmado') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (estado === 'no_disponible') return 'bg-rose-50 text-rose-700 ring-rose-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
}

export default async function MisServiciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabase as any
  const admin = createAdminClient() as any

  const { data: asignacionesRows = [] } = await db
    .from('evento_asignaciones')
    .select('id,evento_id,ministerio_id,capacidad_id,estado,updated_at')
    .eq('profile_id', user.id)

  const eventoIds = Array.from(new Set((asignacionesRows as any[]).map((row) => String(row.evento_id)).filter(Boolean)))
  const capacidadIds = Array.from(new Set((asignacionesRows as any[]).map((row) => String(row.capacidad_id || '')).filter(Boolean)))

  const [eventosReq, capacidadesReq] = await Promise.all([
    eventoIds.length ? admin.from('eventos').select('id,titulo,fecha_inicio,ubicacion,ministerio_id').in('id', eventoIds) : Promise.resolve({ data: [] }),
    capacidadIds.length ? admin.from('ministerio_capacidades').select('id,nombre,ministerio_id').in('id', capacidadIds) : Promise.resolve({ data: [] }),
  ])

  const eventos = (eventosReq.data || []) as any[]
  const capacidades = (capacidadesReq.data || []) as any[]
  const eventosMap = new Map(eventos.map((row) => [String(row.id), row]))
  const capacidadesMap = new Map(capacidades.map((row) => [String(row.id), row]))

  const ministerioIds = Array.from(new Set([
    ...(asignacionesRows as any[]).map((row) => String(row.ministerio_id || '')).filter(Boolean),
    ...eventos.map((row) => String(row.ministerio_id || '')).filter(Boolean),
    ...capacidades.map((row) => String(row.ministerio_id || '')).filter(Boolean),
  ]))

  const { data: ministeriosRows = [] } = ministerioIds.length
    ? await admin.from('ministerios').select('id,nombre,color_primario').in('id', ministerioIds)
    : { data: [] as any[] }
  const ministeriosMap = new Map((ministeriosRows as any[]).map((row) => [String(row.id), row]))

  const serviciosMap = new Map<string, Servicio>()
  const ahora = Date.now()

  for (const row of asignacionesRows as any[]) {
    const evento = eventosMap.get(String(row.evento_id)) as any
    if (!evento || new Date(evento.fecha_inicio).getTime() < ahora) continue

    const capacidad = row.capacidad_id ? capacidadesMap.get(String(row.capacidad_id)) as any : null
    const ministerioId = String(row.ministerio_id || capacidad?.ministerio_id || evento.ministerio_id || '')
    if (!ministerioId) continue
    const ministerio = ministeriosMap.get(ministerioId) as any
    const key = `${evento.id}:${ministerioId}`
    const actual = serviciosMap.get(key) || {
      key,
      eventoId: String(evento.id),
      ministerioId,
      ministerioNombre: String(ministerio?.nombre || 'Ministerio'),
      color: String(ministerio?.color_primario || '#5b3df5'),
      titulo: String(evento.titulo || 'Servicio'),
      fechaInicio: String(evento.fecha_inicio),
      ubicacion: evento.ubicacion ? String(evento.ubicacion) : null,
      funciones: [],
      estados: [],
      estado: 'pendiente' as EstadoAsignacionMusico,
    }

    if (capacidad?.nombre && !actual.funciones.includes(String(capacidad.nombre))) actual.funciones.push(String(capacidad.nombre))
    actual.estados.push(String(row.estado || 'asignado'))
    actual.estado = normalizarEstado(actual.estados)
    serviciosMap.set(key, actual)
  }

  const servicios = Array.from(serviciosMap.values()).sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
  const proximo = servicios[0] || null

  let repertorio: any[] = []
  let paleta: any = null
  if (proximo) {
    const [repReq, palReq] = await Promise.all([
      admin.from('evento_repertorio').select('id,orden,titulo,tonalidad,enlace,notas,spotify_url,youtube_url,cancion_id').eq('evento_id', proximo.eventoId).eq('ministerio_id', proximo.ministerioId).order('orden').order('created_at'),
      admin.from('evento_paletas').select('colores,observaciones,referencia_url,ministerio_id,updated_at').eq('evento_id', proximo.eventoId).or(`ministerio_id.eq.${proximo.ministerioId},ministerio_id.is.null`).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    repertorio = repReq.data || []
    paleta = palReq.data || null

    const cancionIds = Array.from(new Set(repertorio.map((row: any) => String(row.cancion_id || '')).filter(Boolean)))
    if (cancionIds.length) {
      const { data: canciones = [] } = await admin.from('ministerio_canciones').select('id,titulo,artista,spotify_url,youtube_url').in('id', cancionIds)
      const cancionesMap = new Map((canciones as any[]).map((row: any) => [String(row.id), row]))
      repertorio = repertorio.map((row: any) => ({ ...row, cancion: row.cancion_id ? cancionesMap.get(String(row.cancion_id)) : null }))
    }
  }

  const { data: membresias = [] } = await db.from('ministerio_miembros').select('ministerio_id').eq('profile_id', user.id)
  const misMinisterios = (membresias as any[]).map((row) => String(row.ministerio_id))

  const { data: pendientesRows = [] } = await db
    .from('intercambios')
    .select('id,mensaje,estado,created_at,solicitante_id,destinatario_id,profiles!solicitante_id(nombre_completo,avatar_url),evento_asignaciones!asignacion_origen_id(eventos(titulo,fecha_inicio,ministerio_id))')
    .eq('estado', 'pendiente')

  const recibidos = (pendientesRows as any[]).filter((item: any) => {
    if (item.destinatario_id === user.id) return true
    const evento = item.evento_asignaciones?.eventos
    return Boolean(!item.destinatario_id && item.solicitante_id !== user.id && evento?.ministerio_id && misMinisterios.includes(String(evento.ministerio_id)))
  })

  const { data: enviados = [] } = await db
    .from('intercambios')
    .select('id,mensaje,estado,created_at,destinatario_id,profiles!destinatario_id(nombre_completo,avatar_url),evento_asignaciones!asignacion_origen_id(eventos(titulo,fecha_inicio))')
    .eq('solicitante_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const coloresPaleta: string[] = Array.isArray(paleta?.colores) ? paleta.colores : []

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:pt-8">
      <div className="mb-5"><BackButton /></div>
      <header className="mb-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-500">Programación ministerial</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Mis servicios</h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">Confirma tus asignaciones y revisa lo que necesitas para servir.</p>
      </header>

      {proximo ? (
        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_8px_30px_rgba(20,24,40,0.08)] ring-1 ring-black/[0.04]">
          <div className="p-5" style={{ background: `linear-gradient(145deg, ${proximo.color}16, #ffffff 68%)` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ backgroundColor: `${proximo.color}18`, color: proximo.color }}>{proximo.ministerioNombre}</span>
                <h2 className="mt-3 break-words text-xl font-extrabold tracking-[-0.025em] text-slate-900">{proximo.titulo}</h2>
                <p className="mt-1 text-xs capitalize leading-5 text-slate-500">{fechaServicio(proximo.fechaInicio)}{proximo.ubicacion ? ` · ${proximo.ubicacion}` : ''}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ring-1 ${estadoClases(proximo.estado)}`}>{estadoTexto(proximo.estado)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{proximo.funciones.map((funcion) => <span key={funcion} className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-extrabold text-white">{funcion}</span>)}</div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">Tu respuesta</p>
              <EstadoAsignacionControl ministerioId={proximo.ministerioId} eventoId={proximo.eventoId} initialEstado={proximo.estado} />
            </div>
          </div>

          <div className="border-t-[6px] border-slate-100 p-4">
            <div className="flex items-center gap-2"><Music2 className="h-4 w-4 text-violet-500" /><h3 className="text-sm font-extrabold text-slate-800">Repertorio</h3></div>
            {repertorio.length === 0 ? <p className="mt-2 text-xs text-slate-400">Todavía no hay canciones publicadas para este servicio.</p> : (
              <div className="mt-3 space-y-2">{repertorio.map((row: any, index: number) => { const titulo = row.cancion?.titulo || row.titulo || 'Canción'; const artista = row.cancion?.artista || null; const spotify = row.cancion?.spotify_url || row.spotify_url || null; const youtube = row.cancion?.youtube_url || row.youtube_url || null; return <div key={row.id} className="rounded-2xl bg-violet-50/60 p-3 ring-1 ring-violet-100/70"><div className="flex items-start gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[10px] font-extrabold text-violet-600 ring-1 ring-violet-100">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="truncate text-xs font-extrabold text-slate-800">{titulo}</p>{row.tonalidad && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold text-slate-500">{row.tonalidad}</span>}</div>{artista && <p className="mt-0.5 truncate text-[10px] text-slate-400">{artista}</p>}{(spotify || youtube || row.enlace) && <div className="mt-2 flex flex-wrap gap-1.5">{spotify && <a href={spotify} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-600">Spotify <ExternalLink className="h-3 w-3" /></a>}{youtube && <a href={youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-600">YouTube <ExternalLink className="h-3 w-3" /></a>}</div>}{row.notas && <p className="mt-2 text-[10px] leading-4 text-slate-500">{row.notas}</p>}</div></div></div>})}</div>
            )}
          </div>

          <div className="border-t-[6px] border-slate-100 p-4">
            <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-pink-500" /><h3 className="text-sm font-extrabold text-slate-800">Paleta de colores</h3></div>
            {coloresPaleta.length ? <><div className="mt-3 flex h-12 overflow-hidden rounded-2xl ring-1 ring-black/5">{coloresPaleta.map((color, index) => <span key={`${color}-${index}`} className="flex-1" style={{ backgroundColor: color }} />)}</div>{paleta?.observaciones && <p className="mt-3 rounded-xl bg-pink-50 px-3 py-2.5 text-[10px] leading-4 text-slate-600 ring-1 ring-pink-100">{paleta.observaciones}</p>}</> : <p className="mt-2 text-xs text-slate-400">Todavía no hay una paleta publicada para este servicio.</p>}
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] bg-white px-5 py-8 text-center ring-1 ring-black/[0.04]"><CalendarDays className="mx-auto h-6 w-6 text-slate-300" /><h2 className="mt-3 text-sm font-extrabold text-slate-700">Sin servicios próximos</h2><p className="mt-1 text-xs leading-5 text-slate-400">Cuando un líder te programe, tu servicio aparecerá aquí.</p></section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between px-1"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Próximas asignaciones</p><h2 className="mt-0.5 text-lg font-extrabold text-slate-900">Tu agenda de servicio</h2></div><Clock3 className="h-5 w-5 text-slate-300" /></div>
        {servicios.length === 0 ? <div className="rounded-[22px] bg-white p-5 text-center text-xs text-slate-400 ring-1 ring-black/[0.04]">No tienes asignaciones próximas.</div> : <div className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.04]">{servicios.map((servicio, index) => <div key={servicio.key} className={`flex items-center gap-3 px-4 py-3.5 ${index < servicios.length - 1 ? 'border-b border-slate-100' : ''}`}><span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: servicio.color }} /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="truncate text-sm font-extrabold text-slate-800">{servicio.titulo}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold ring-1 ${estadoClases(servicio.estado)}`}>{estadoTexto(servicio.estado)}</span></div><p className="mt-1 truncate text-[10px] text-slate-400">{fechaCorta(servicio.fechaInicio)} · {servicio.ministerioNombre}</p><p className="mt-1 truncate text-[10px] font-semibold text-indigo-500">{servicio.funciones.join(' · ')}</p></div></div>)}</div>}
      </section>

      <section id="cambios" className="mt-8 border-t border-slate-200 pt-7">
        <div className="mb-4 flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-indigo-500" /><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Cambios de turno</p><h2 className="text-lg font-extrabold text-slate-900">Intercambios</h2></div></div>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 px-1 text-xs font-extrabold text-slate-600">Recibidos</h3>
            {!recibidos.length ? <div className="rounded-[20px] bg-white p-4 text-xs text-slate-400 ring-1 ring-black/[0.04]">No tienes propuestas pendientes.</div> : <div className="space-y-3">{recibidos.map((item: any) => { const evento = item.evento_asignaciones?.eventos; const persona = item.profiles as any; return <div key={item.id} className="rounded-[20px] bg-white p-4 ring-1 ring-black/[0.04]"><div className="flex items-center gap-2.5"><UserAvatar nombre={persona?.nombre_completo} avatarUrl={persona?.avatar_url} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-800">{persona?.nombre_completo || 'Usuario'}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">Solicita cubrir {evento?.titulo || 'un servicio'}</p></div></div>{item.mensaje && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500">{item.mensaje}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><form action={aceptarIntercambio as any}><input type="hidden" name="intercambio_id" value={item.id} /><button className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700"><Check className="h-4 w-4" />Aceptar</button></form><form action={rechazarIntercambio as any}><input type="hidden" name="intercambio_id" value={item.id} /><button className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-xs font-bold text-rose-700"><X className="h-4 w-4" />Rechazar</button></form></div></div>})}</div>}
          </div>
          <div>
            <h3 className="mb-2 px-1 text-xs font-extrabold text-slate-600">Mis solicitudes</h3>
            {!enviados.length ? <div className="rounded-[20px] bg-white p-4 text-xs text-slate-400 ring-1 ring-black/[0.04]">No has solicitado cambios recientes.</div> : <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-black/[0.04]">{(enviados as any[]).map((item: any, index: number) => { const evento = item.evento_asignaciones?.eventos; const persona = item.profiles as any; return <div key={item.id} className={`px-4 py-3.5 ${index < enviados.length - 1 ? 'border-b border-slate-100' : ''}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-800">{evento?.titulo || 'Servicio'}</p><p className="mt-1 truncate text-[10px] text-slate-400">{persona?.nombre_completo ? `Propuesto a ${persona.nombre_completo}` : 'Solicitud abierta al ministerio'}</p></div><span className="shrink-0 rounded-full bg-slate-50 px-2 py-1 text-[9px] font-extrabold text-slate-500">{item.estado}</span></div></div>})}</div>}
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-[10px] leading-4 text-slate-400">Las solicitudes guiadas de reemplazo por capacidad se incorporarán en el siguiente bloque.</p>
    </main>
  )
}
