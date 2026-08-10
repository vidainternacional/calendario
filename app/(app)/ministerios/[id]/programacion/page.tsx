import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Music2,
  Palette,
  Plus,
  Users,
} from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  agregarCancionAlabanza,
  actualizarCancionAlabanza,
  eliminarCancionAlabanza,
  guardarPaletaAlabanza,
} from '@/app/actions/programacion-alabanza'
import { crearServicioAlabanza } from '@/app/actions/servicios-alabanza'
import PaletaAlabanzaEditor from '@/components/ministerios/PaletaAlabanzaEditor'

export const dynamic = 'force-dynamic'

function mesActualSV() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  return `${parts.find((p) => p.type === 'year')?.value || '2026'}-${parts.find((p) => p.type === 'month')?.value || '01'}`
}

function rangoMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01T00:00:00-06:00`,
    end: `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00-06:00`,
  }
}

function moverMes(mes: string, delta: number) {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function nombreMes(mes: string) {
  const [year, month] = mes.split('-').map(Number)
  const text = new Intl.DateTimeFormat('es-SV', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function fechaSV(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ProgramacionMinisterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mes?: string; evento?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }, { data: respRows }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,emoji,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_responsabilidad_asignaciones').select('responsabilidad_id').eq('profile_id', user.id),
  ])

  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')

  let responsablePaleta = false
  if ((respRows || []).length) {
    const { data: paletaResp } = await admin
      .from('ministerio_responsabilidades')
      .select('id')
      .in('id', respRows.map((row: any) => row.responsabilidad_id))
      .eq('codigo', 'paleta_colores')
      .eq('activo', true)
      .limit(1)
    responsablePaleta = (paletaResp || []).length > 0
  }

  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  const puedePaleta = puedeProgramar || responsablePaleta
  if (!puedeProgramar && !puedePaleta) redirect(`/ministerios/${id}`)

  const mes = /^\d{4}-\d{2}$/.test(query.mes || '') ? query.mes! : mesActualSV()
  const { start, end } = rangoMes(mes)
  const { data: eventos = [] } = await admin
    .from('eventos')
    .select('id,titulo,fecha_inicio,ubicacion')
    .eq('ministerio_id', id)
    .gte('fecha_inicio', start)
    .lt('fecha_inicio', end)
    .order('fecha_inicio')

  const eventIds = (eventos as any[]).map((item: any) => String(item.id))
  const assignmentsByEvent = new Map<string, any[]>()

  if (eventIds.length > 0) {
    const { data: assignmentRows = [] } = await admin
      .from('evento_asignaciones')
      .select('evento_id,profile_id,capacidad_id,estado')
      .in('evento_id', eventIds)

    const profileIds = Array.from(new Set((assignmentRows as any[]).map((item: any) => item.profile_id).filter(Boolean)))
    const capabilityIds = Array.from(new Set((assignmentRows as any[]).map((item: any) => item.capacidad_id).filter(Boolean)))

    const [profilesReq, capabilitiesReq] = await Promise.all([
      profileIds.length
        ? admin.from('profiles').select('id,nombre_completo').in('id', profileIds)
        : Promise.resolve({ data: [] }),
      capabilityIds.length
        ? admin.from('ministerio_capacidades').select('id,nombre').in('id', capabilityIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map<string, any>((profilesReq.data || []).map((item: any) => [String(item.id), item]))
    const capabilityMap = new Map<string, any>((capabilitiesReq.data || []).map((item: any) => [String(item.id), item]))

    for (const assignment of assignmentRows as any[]) {
      const eventId = String(assignment.evento_id)
      assignmentsByEvent.set(eventId, [
        ...(assignmentsByEvent.get(eventId) || []),
        {
          ...assignment,
          persona: profileMap.get(String(assignment.profile_id)),
          capacidad: assignment.capacidad_id ? capabilityMap.get(String(assignment.capacidad_id)) : null,
        },
      ])
    }
  }

  const evento: any = (eventos as any[]).find((item: any) => item.id === query.evento) || (eventos as any[])[0] || null
  const asignadosEvento = evento ? assignmentsByEvent.get(String(evento.id)) || [] : []

  let repertorio: any[] = []
  let paleta: any = null
  if (evento) {
    const [repertorioReq, paletaReq] = await Promise.all([
      admin.from('evento_repertorio').select('*').eq('evento_id', evento.id).order('orden').order('created_at'),
      admin.from('evento_paletas').select('*').eq('evento_id', evento.id).maybeSingle(),
    ])
    repertorio = repertorioReq.data || []
    paleta = paletaReq.data || null
  }

  const color = ministerio.color_primario || '#5b3df5'
  const colores: string[] = Array.isArray(paleta?.colores) ? paleta.colores : []
  const defaults = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']
  const mesAnterior = moverMes(mes, -1)
  const mesSiguiente = moverMes(mes, 1)

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
      <header className="mb-5 flex items-center gap-3">
        <Link href={`/ministerios/${id}`} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
            {puedeProgramar ? 'Panel del líder' : 'Programación ministerial'}
          </p>
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">{ministerio.nombre}</h1>
        </div>
      </header>

      <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#171923]">Servicios de Alabanza</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Cada servicio es una fecha real del Calendario de VIDA. Aquí solo se prepara el equipo y contenido.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-300" />
        </div>

        {puedeProgramar && (
          <details className="mt-4 overflow-hidden rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-extrabold text-indigo-700">
              <Plus className="h-4 w-4" />
              Agregar servicio al Calendario
            </summary>
            <form action={crearServicioAlabanza.bind(null, id)} className="grid gap-3 border-t border-indigo-100 bg-white p-4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Nombre del servicio
                <input name="titulo" required placeholder="Ej.: Servicio dominical" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Fecha y hora
                <input name="fecha_inicio" type="datetime-local" required className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold" />
              </label>
              <div className="grid grid-cols-[1fr_112px] gap-2">
                <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Ubicación
                  <input name="ubicacion" placeholder="Templo principal" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-xs" />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Duración
                  <select name="duracion_minutos" defaultValue="120" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-2 text-xs font-semibold">
                    <option value="60">1 h</option>
                    <option value="90">1.5 h</option>
                    <option value="120">2 h</option>
                    <option value="180">3 h</option>
                  </select>
                </label>
              </div>
              <button className="h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar en Calendario</button>
              <p className="text-[10px] leading-4 text-slate-400">No crea un calendario paralelo: la fecha se guarda en el Calendario real del ministerio y aparece aquí automáticamente.</p>
            </form>
          </details>
        )}

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100">
          <Link href={`/ministerios/${id}/programacion?mes=${mesAnterior}`} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm" aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="px-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Mes</p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-800">{nombreMes(mes)}</p>
          </div>
          <Link href={`/ministerios/${id}/programacion?mes=${mesSiguiente}`} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm" aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {eventos.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-400">No hay servicios en {nombreMes(mes).toLowerCase()}.</p>
          ) : (eventos as any[]).map((item: any) => {
            const team = assignmentsByEvent.get(String(item.id)) || []
            const selected = evento?.id === item.id
            return (
              <Link
                key={item.id}
                href={`/ministerios/${id}/programacion?mes=${mes}&evento=${item.id}#servicio-activo`}
                className={`block rounded-2xl p-3 ring-1 transition active:scale-[0.995] ${selected ? 'bg-indigo-50 ring-indigo-200' : 'bg-slate-50 ring-slate-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-800">{item.titulo}</p>
                    <p className="mt-1 text-xs text-slate-500">{fechaSV(item.fecha_inicio)}{item.ubicacion ? ` · ${item.ubicacion}` : ''}</p>
                    <p className="mt-2 truncate text-[11px] font-semibold text-slate-500">
                      {team.length === 0
                        ? 'Equipo sin asignar'
                        : `${team.length} ${team.length === 1 ? 'integrante' : 'integrantes'} · ${team.slice(0, 3).map((assignment: any) => assignment.persona?.nombre_completo || 'Servidor').join(', ')}${team.length > 3 ? '…' : ''}`}
                    </p>
                  </div>
                  <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${selected ? 'text-indigo-500' : 'text-slate-300'}`} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {evento && (
        <section id="servicio-activo" className="mt-5 scroll-mt-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-500">Servicio seleccionado</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-[#171923]">{evento.titulo}</h2>
              <p className="mt-1 text-xs text-slate-500">{fechaSV(evento.fecha_inicio)}</p>
            </div>
            <CalendarDays className="h-5 w-5 shrink-0 text-indigo-400" />
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-extrabold text-slate-700">Equipo de este día</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-100">{asignadosEvento.length}</span>
            </div>
            {asignadosEvento.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Todavía no hay integrantes asignados.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {asignadosEvento.map((assignment: any, index: number) => (
                  <span key={`${assignment.profile_id}-${index}`} className="rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
                    {assignment.persona?.nombre_completo || 'Servidor'}{assignment.capacidad?.nombre ? ` · ${assignment.capacidad.nombre}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {puedeProgramar && (
            <Link href={`/ministerios/${id}/programacion/equipo?mes=${mes}&evento=${evento.id}`} className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-4 text-white active:bg-indigo-700">
              <span className="flex items-center gap-2 text-xs font-extrabold"><Users className="h-4 w-4" />Programar equipo</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      )}

      {evento && (
        <>
          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-violet-500" />
              <div>
                <h2 className="text-sm font-extrabold text-[#171923]">Repertorio</h2>
                <p className="text-xs text-slate-500">Agrega primero la lista. Los enlaces y notas pueden completarse después.</p>
              </div>
            </div>

            {puedeProgramar && (
              <form action={agregarCancionAlabanza.bind(null, id, evento.id)} className="mt-4 rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
                <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                  <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Canción
                    <input name="titulo" required placeholder="Nombre" className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-xs font-semibold ring-1 ring-violet-100" />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Tono
                    <input name="tonalidad" placeholder="G" className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-center text-xs font-bold ring-1 ring-violet-100" />
                  </label>
                </div>
                <button className="mt-2 h-11 w-full rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar a la lista</button>
              </form>
            )}

            <div className="mt-4 space-y-2">
              {repertorio.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Todavía no hay canciones agregadas.</p>
              ) : repertorio.map((song: any, index: number) => (
                <div key={song.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-extrabold text-violet-600 ring-1 ring-violet-100">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-slate-800">{song.titulo}</p>
                        {song.tonalidad && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-slate-500 ring-1 ring-slate-100">{song.tonalidad}</span>}
                      </div>
                      {(song.spotify_url || song.youtube_url || song.enlace) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {song.spotify_url && <a href={song.spotify_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">Spotify <ExternalLink className="h-3 w-3" /></a>}
                          {song.youtube_url && <a href={song.youtube_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">YouTube <ExternalLink className="h-3 w-3" /></a>}
                          {!song.spotify_url && !song.youtube_url && song.enlace && <a href={song.enlace} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">Enlace <ExternalLink className="h-3 w-3" /></a>}
                        </div>
                      )}
                      {song.notas && <p className="mt-2 text-[11px] leading-5 text-slate-500">{song.notas}</p>}
                    </div>
                  </div>

                  {puedeProgramar && (
                    <details className="mt-2 border-t border-slate-100 pt-2">
                      <summary className="cursor-pointer text-[10px] font-bold text-violet-600">Editar detalles</summary>
                      <form action={actualizarCancionAlabanza.bind(null, id, evento.id)} className="mt-3 grid gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                        <input type="hidden" name="cancion_id" value={song.id} />
                        <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                          <input name="titulo" defaultValue={song.titulo} required aria-label="Canción" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
                          <input name="tonalidad" defaultValue={song.tonalidad || ''} placeholder="Tono" aria-label="Tonalidad" className="h-10 w-full rounded-xl bg-slate-50 px-2 text-center text-xs" />
                        </div>
                        <input name="spotify_url" type="url" defaultValue={song.spotify_url || ''} placeholder="Link de Spotify" aria-label="Link de Spotify" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
                        <input name="youtube_url" type="url" defaultValue={song.youtube_url || ''} placeholder="Link de YouTube" aria-label="Link de YouTube" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
                        <textarea name="notas" defaultValue={song.notas || ''} placeholder="Notas opcionales" aria-label="Notas" className="min-h-16 w-full rounded-xl bg-slate-50 p-3 text-xs" />
                        <button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar detalles</button>
                      </form>
                      <form action={eliminarCancionAlabanza.bind(null, id, evento.id)} className="mt-2">
                        <input type="hidden" name="cancion_id" value={song.id} />
                        <button className="h-9 w-full rounded-xl bg-rose-50 text-[10px] font-bold text-rose-600">Eliminar canción</button>
                      </form>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-500" />
              <div>
                <h2 className="text-sm font-extrabold text-[#171923]">Paleta de colores</h2>
                <p className="text-xs text-slate-500">Vestuario y referencia visual vinculados a este servicio.</p>
              </div>
            </div>
            <div className="mt-4 flex overflow-hidden rounded-xl ring-1 ring-black/5">
              {(colores.length ? colores : defaults).map((item, index) => <span key={`${item}-${index}`} className="h-12 flex-1" style={{ backgroundColor: item }} />)}
            </div>
            {paleta?.observaciones && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{paleta.observaciones}</p>}
            {paleta?.referencia_url && <a href={paleta.referencia_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Referencia visual <ExternalLink className="h-3 w-3" /></a>}
            {puedePaleta && (
              <PaletaAlabanzaEditor
                action={guardarPaletaAlabanza.bind(null, id, evento.id)}
                initialColors={colores.length ? colores : defaults}
                initialObservaciones={paleta?.observaciones}
                initialReferenciaUrl={paleta?.referencia_url}
                puedeProgramar={puedeProgramar}
              />
            )}
          </section>
        </>
      )}
    </main>
  )
}
