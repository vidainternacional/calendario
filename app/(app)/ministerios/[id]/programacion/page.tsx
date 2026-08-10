import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
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
  agregarCancionBibliotecaAlabanza,
  actualizarCancionAlabanza,
  eliminarCancionAlabanza,
  guardarPaletaAlabanza,
} from '@/app/actions/programacion-alabanza'
import { crearServicioAlabanza } from '@/app/actions/servicios-alabanza'
import PaletaAlabanzaEditor from '@/components/ministerios/PaletaAlabanzaEditor'
import RepertorioBibliotecaPicker, { type CancionBiblioteca } from '@/components/ministerios/RepertorioBibliotecaPicker'

export const dynamic = 'force-dynamic'

function mesActualSV() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  return `${parts.find((part) => part.type === 'year')?.value || '2026'}-${parts.find((part) => part.type === 'month')?.value || '01'}`
}

function rangoMes(mes: string) {
  const [year, month] = mes.split('-').map(Number)
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01T00:00:00-06:00`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00-06:00`,
  }
}

function moverMes(mes: string, delta: number) {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function nombreMes(mes: string) {
  const [year, month] = mes.split('-').map(Number)
  const text = new Intl.DateTimeFormat('es-SV', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function fechaKeySV(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
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

function fechaLargaDia(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const text = new Intl.DateTimeFormat('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function celdasMes(mes: string) {
  const [year, month] = mes.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const leading = first.getUTCDay()
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ]
}

function dateKeyFromDay(mes: string, day: number) {
  return `${mes}-${String(day).padStart(2, '0')}`
}

function tonoHistorial(rows: any[]) {
  const tonos: string[] = []
  for (const row of rows) {
    const tone = String(row.tonalidad || '').trim()
    if (tone && !tonos.some((item) => item.toLowerCase() === tone.toLowerCase())) tonos.push(tone)
  }
  return tonos.slice(0, 6)
}

export default async function ProgramacionMinisterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mes?: string; dia?: string; evento?: string }>
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
  const [{ data: eventos = [] }, { data: cancionesBiblioteca = [] }] = await Promise.all([
    admin
      .from('eventos')
      .select('id,titulo,fecha_inicio,fecha_fin,ubicacion')
      .eq('ministerio_id', id)
      .gte('fecha_inicio', start)
      .lt('fecha_inicio', end)
      .order('fecha_inicio'),
    admin
      .from('ministerio_canciones')
      .select('id,titulo,artista,spotify_url,youtube_url,activo,created_at')
      .eq('ministerio_id', id)
      .eq('activo', true)
      .order('titulo')
      .limit(300),
  ])

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

  const evento: any = (eventos as any[]).find((item: any) => String(item.id) === String(query.evento || '')) || null
  const diaQuery = /^\d{4}-\d{2}-\d{2}$/.test(query.dia || '') && String(query.dia).startsWith(`${mes}-`)
    ? String(query.dia)
    : null
  const diaSeleccionado = evento ? fechaKeySV(evento.fecha_inicio) : diaQuery
  const eventosDia = diaSeleccionado
    ? (eventos as any[]).filter((item: any) => fechaKeySV(item.fecha_inicio) === diaSeleccionado)
    : []
  const asignadosEvento = evento ? assignmentsByEvent.get(String(evento.id)) || [] : []

  let repertorio: any[] = []
  let paleta: any = null
  if (evento) {
    const [repertorioReq, paletaReq] = await Promise.all([
      admin
        .from('evento_repertorio')
        .select('*, ministerio_canciones(id,titulo,artista,spotify_url,youtube_url)')
        .eq('evento_id', evento.id)
        .order('orden')
        .order('created_at'),
      admin.from('evento_paletas').select('*').eq('evento_id', evento.id).maybeSingle(),
    ])
    repertorio = repertorioReq.data || []
    paleta = paletaReq.data || null
  }

  const libraryIds = (cancionesBiblioteca as any[]).map((item: any) => String(item.id))
  const historyBySong = new Map<string, any[]>()
  if (libraryIds.length > 0) {
    const { data: historyRows = [] } = await admin
      .from('evento_repertorio')
      .select('cancion_id,tonalidad,created_at')
      .in('cancion_id', libraryIds)
      .order('created_at', { ascending: false })
      .limit(2000)
    for (const row of historyRows as any[]) {
      const songId = String(row.cancion_id)
      historyBySong.set(songId, [...(historyBySong.get(songId) || []), row])
    }
  }

  const biblioteca: CancionBiblioteca[] = (cancionesBiblioteca as any[]).map((song: any) => {
    const history = historyBySong.get(String(song.id)) || []
    const tonalidades = tonoHistorial(history)
    return {
      id: String(song.id),
      titulo: String(song.titulo),
      artista: song.artista || null,
      spotify_url: song.spotify_url || null,
      youtube_url: song.youtube_url || null,
      tonalidades,
      ultimaTonalidad: tonalidades[0] || null,
    }
  })

  const eventsByDay = new Map<string, any[]>()
  for (const item of eventos as any[]) {
    const key = fechaKeySV(item.fecha_inicio)
    eventsByDay.set(key, [...(eventsByDay.get(key) || []), item])
  }

  const color = ministerio.color_primario || '#5b3df5'
  const colores: string[] = Array.isArray(paleta?.colores) ? paleta.colores : []
  const defaults = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']
  const mesAnterior = moverMes(mes, -1)
  const mesSiguiente = moverMes(mes, 1)
  const grid = celdasMes(mes)

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
      <header className="mb-5">
        <Link
          href={`/ministerios/${id}`}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-black/[0.04]"
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>
          {puedeProgramar ? 'Panel del líder' : 'Programación ministerial'}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Programación de {ministerio.nombre}</h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">El Calendario define la fecha. Aquí preparas el equipo, repertorio y paleta de cada servicio.</p>
      </header>

      <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <details open={Boolean(diaSeleccionado || evento)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Calendario de servicios</span>
              <span className="mt-1 block text-lg font-extrabold tracking-[-0.02em] text-slate-800">{nombreMes(mes)}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{eventos.length} {eventos.length === 1 ? 'servicio programado' : 'servicios programados'} · toca para {diaSeleccionado ? 'ocultar' : 'ver el mes'}</span>
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
              <ChevronDown className="h-5 w-5" />
            </span>
          </summary>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/ministerios/${id}/programacion?mes=${mesAnterior}`}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <p className="text-sm font-extrabold text-slate-800">{nombreMes(mes)}</p>
              <Link
                href={`/ministerios/${id}/programacion?mes=${mesSiguiente}`}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} className="aspect-square" />
                const key = dateKeyFromDay(mes, day)
                const dayEvents = eventsByDay.get(key) || []
                const selected = diaSeleccionado === key
                return (
                  <Link
                    key={key}
                    href={`/ministerios/${id}/programacion?mes=${mes}&dia=${key}#dia-seleccionado`}
                    className={`relative grid aspect-square place-items-center rounded-xl text-xs font-bold transition active:scale-95 ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}
                    aria-label={`Seleccionar ${key}`}
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <span className={`absolute bottom-1 h-1.5 min-w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-indigo-500'}`}>
                        {dayEvents.length > 1 && <span className="sr-only">{dayEvents.length} servicios</span>}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {diaSeleccionado && (
              <div id="dia-seleccionado" className="mt-4 scroll-mt-24 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">Día seleccionado</p>
                <p className="mt-1 text-sm font-extrabold text-slate-800">{fechaLargaDia(diaSeleccionado)}</p>

                <div className="mt-3 space-y-2">
                  {eventosDia.length ? eventosDia.map((item: any) => {
                    const team = assignmentsByEvent.get(String(item.id)) || []
                    const selected = evento?.id === item.id
                    return (
                      <Link
                        key={item.id}
                        href={`/ministerios/${id}/programacion?mes=${mes}&dia=${diaSeleccionado}&evento=${item.id}#servicio-activo`}
                        className={`block rounded-2xl p-3 ring-1 ${selected ? 'bg-indigo-50 ring-indigo-200' : 'bg-white ring-slate-100'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-slate-800">{item.titulo}</span>
                            <span className="mt-1 block text-xs text-slate-500">{fechaSV(item.fecha_inicio)}{item.ubicacion ? ` · ${item.ubicacion}` : ''}</span>
                            <span className="mt-1.5 block text-[10px] font-semibold text-slate-400">{team.length ? `${team.length} integrantes asignados` : 'Equipo sin asignar'}</span>
                          </span>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                        </div>
                      </Link>
                    )
                  }) : (
                    <p className="rounded-xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-100">No hay servicios de Alabanza en este día.</p>
                  )}
                </div>

                {puedeProgramar && (
                  <details className="mt-3 overflow-hidden rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-extrabold text-indigo-700">
                      <Plus className="h-4 w-4" /> Agregar servicio
                    </summary>
                    <form action={crearServicioAlabanza.bind(null, id)} className="grid gap-3 border-t border-indigo-100 bg-white p-3">
                      <input type="hidden" name="fecha" value={diaSeleccionado} />
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Hora
                        <input name="hora" type="time" required defaultValue="10:00" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-extrabold" />
                      </label>
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Nombre del servicio
                        <input name="titulo" defaultValue="Servicio de Alabanza" required className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold" />
                      </label>
                      <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
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
                      <button className="h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white">Crear y continuar</button>
                      <p className="text-[10px] leading-4 text-slate-400">Se crea un solo evento real: aparece en Alabanza y también en el calendario general Vida Internacional.</p>
                    </form>
                  </details>
                )}
              </div>
            )}
          </div>
        </details>
      </section>

      {evento && (
        <section id="servicio-activo" className="mt-5 scroll-mt-24 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-500">Servicio seleccionado</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em] text-[#171923]">{evento.titulo}</h2>
            <p className="mt-1 text-xs text-slate-500">{fechaSV(evento.fecha_inicio)}{evento.ubicacion ? ` · ${evento.ubicacion}` : ''}</p>
          </div>

          <details className="border-t border-slate-100">
            <summary className="flex min-h-[62px] cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Users className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-800">Equipo</span>
                <span className="block text-[11px] text-slate-400">{asignadosEvento.length} {asignadosEvento.length === 1 ? 'integrante asignado' : 'integrantes asignados'}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 bg-slate-50/70 p-4">
              {asignadosEvento.length === 0 ? (
                <p className="text-xs text-slate-500">Todavía no hay integrantes asignados.</p>
              ) : (
                <div className="space-y-2">
                  {asignadosEvento.map((assignment: any, index: number) => (
                    <div key={`${assignment.profile_id}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                      <p className="min-w-0 truncate text-xs font-bold text-slate-700">{assignment.persona?.nombre_completo || 'Servidor'}</p>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-600">{assignment.capacidad?.nombre || 'Sin función'}</span>
                    </div>
                  ))}
                </div>
              )}
              {puedeProgramar && (
                <Link
                  href={`/ministerios/${id}/programacion/equipo?mes=${mes}&evento=${evento.id}`}
                  className="mt-3 flex min-h-11 items-center justify-between rounded-xl bg-indigo-600 px-4 text-xs font-extrabold text-white"
                >
                  Programar equipo <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </details>

          <details className="border-t border-slate-100">
            <summary className="flex min-h-[62px] cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Music2 className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-800">Repertorio</span>
                <span className="block text-[11px] text-slate-400">{repertorio.length} {repertorio.length === 1 ? 'canción' : 'canciones'} · biblioteca reutilizable</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 bg-slate-50/70 p-4">
              <div className="space-y-2">
                {repertorio.length === 0 ? (
                  <p className="rounded-xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-100">Todavía no hay canciones en este servicio.</p>
                ) : repertorio.map((row: any, index: number) => {
                  const librarySong = row.ministerio_canciones
                  const title = librarySong?.titulo || row.titulo
                  const spotify = librarySong?.spotify_url || row.spotify_url || null
                  const youtube = librarySong?.youtube_url || row.youtube_url || null
                  return (
                    <div key={row.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                      <div className="flex items-start gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-600">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-extrabold text-slate-800">{title}</p>
                            {row.tonalidad && <span className="shrink-0 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-extrabold text-slate-500">{row.tonalidad}</span>}
                          </div>
                          {librarySong?.artista && <p className="mt-0.5 truncate text-[10px] text-slate-400">{librarySong.artista}</p>}
                          {(spotify || youtube || row.enlace) && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {spotify && <a href={spotify} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-50 px-2.5 text-[10px] font-bold text-slate-600">Spotify <ExternalLink className="h-3 w-3" /></a>}
                              {youtube && <a href={youtube} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-50 px-2.5 text-[10px] font-bold text-slate-600">YouTube <ExternalLink className="h-3 w-3" /></a>}
                              {!spotify && !youtube && row.enlace && <a href={row.enlace} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-50 px-2.5 text-[10px] font-bold text-slate-600">Enlace <ExternalLink className="h-3 w-3" /></a>}
                            </div>
                          )}
                          {row.notas && <p className="mt-2 text-[11px] leading-5 text-slate-500">{row.notas}</p>}
                        </div>
                      </div>

                      {puedeProgramar && (
                        <details className="mt-2 border-t border-slate-100 pt-2">
                          <summary className="cursor-pointer list-none text-[10px] font-bold text-violet-600">Editar detalles</summary>
                          <form action={actualizarCancionAlabanza.bind(null, id, evento.id)} className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3">
                            <input type="hidden" name="repertorio_id" value={row.id} />
                            <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
                              <input name="titulo" defaultValue={title} required aria-label="Canción" className="h-10 w-full rounded-xl bg-white px-3 text-xs" />
                              <input name="tonalidad" defaultValue={row.tonalidad || ''} placeholder="Tono" aria-label="Tonalidad" className="h-10 w-full rounded-xl bg-white px-2 text-center text-xs" />
                            </div>
                            <input name="spotify_url" type="url" defaultValue={spotify || ''} placeholder="Link de Spotify" className="h-10 w-full rounded-xl bg-white px-3 text-xs" />
                            <input name="youtube_url" type="url" defaultValue={youtube || ''} placeholder="Link de YouTube" className="h-10 w-full rounded-xl bg-white px-3 text-xs" />
                            <textarea name="notas" defaultValue={row.notas || ''} placeholder="Notas solo para este servicio" className="min-h-16 w-full rounded-xl bg-white p-3 text-xs" />
                            <button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar detalles</button>
                          </form>
                          <form action={eliminarCancionAlabanza.bind(null, id, evento.id)} className="mt-2">
                            <input type="hidden" name="repertorio_id" value={row.id} />
                            <button className="h-9 w-full rounded-xl bg-rose-50 text-[10px] font-bold text-rose-600">Quitar de este servicio</button>
                          </form>
                        </details>
                      )}
                    </div>
                  )
                })}
              </div>

              {puedeProgramar && (
                <RepertorioBibliotecaPicker
                  canciones={biblioteca}
                  agregarAction={agregarCancionBibliotecaAlabanza.bind(null, id, evento.id)}
                  crearAction={agregarCancionAlabanza.bind(null, id, evento.id)}
                />
              )}
            </div>
          </details>

          <details className="border-t border-slate-100">
            <summary className="flex min-h-[62px] cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600"><Palette className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-800">Paleta de colores</span>
                <span className="mt-1 flex h-4 max-w-32 overflow-hidden rounded-full ring-1 ring-black/5">
                  {(colores.length ? colores : defaults).map((item, index) => <span key={`${item}-${index}`} className="flex-1" style={{ backgroundColor: item }} />)}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 bg-slate-50/70 p-4">
              {paleta?.observaciones && <p className="rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-100">{paleta.observaciones}</p>}
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
            </div>
          </details>
        </section>
      )}

      {!evento && diaSeleccionado && eventosDia.length > 0 && (
        <p className="mt-4 rounded-2xl bg-white p-4 text-center text-xs text-slate-500 ring-1 ring-black/[0.04]">Toca uno de los servicios del día para abrir su programación.</p>
      )}

      <div className="mt-5 rounded-2xl bg-indigo-50 p-3 text-[10px] leading-4 text-indigo-700 ring-1 ring-indigo-100">
        <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Una fecha creada aquí es el mismo evento que verá la congregación en Calendario; Alabanza solamente añade la información de servicio.
      </div>
    </main>
  )
}
