'use client'

import Link from 'next/link'
import { AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ChevronDown, Clock3, Loader2, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/comunidad/UserAvatar'

type Estado = 'asistio' | 'justificado' | 'sin_confirmacion'

type ResumenPersona = {
  profile_id: string
  nombre_completo: string
  avatar_url: string | null
  estado: Estado
  confirmado_en: string | null
  metodo: 'gps' | 'pastoral' | null
  consecutivos_sin_confirmar: number
}

type EventoResumen = {
  id: string
  titulo: string
  fechaInicio: string
  asistio: number
  sinConfirmacion: number
  justificado: number
  personas: ResumenPersona[]
}

type PersonaAgregada = {
  id: string
  nombre: string
  avatarUrl: string | null
  asistio: number
  justificado: number
  sinConfirmacion: number
  total: number
  porcentaje: number
  consecutivos: number
  historial: Array<{ eventoId: string; titulo: string; fechaInicio: string; estado: Estado }>
}

function estadoLabel(estado: Estado) {
  if (estado === 'asistio') return 'Asistió'
  if (estado === 'justificado') return 'Justificado'
  return 'Sin confirmación'
}

function estadoClasses(estado: Estado) {
  if (estado === 'asistio') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (estado === 'justificado') return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function AsistenciaPastoralClient() {
  const [tab, setTab] = useState<'personas' | 'eventos' | 'graficas'>('personas')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [eventos, setEventos] = useState<EventoResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      setLoading(true)
      setError(null)
      const supabase = createClient() as any

      const { data: configs, error: configError } = await supabase
        .from('evento_asistencia_config')
        .select('evento_id, activo, updated_at, eventos ( id, titulo, fecha_inicio )')
        .eq('activo', true)
        .order('updated_at', { ascending: false })
        .limit(12)

      if (configError) {
        if (!cancelled) {
          setError(configError.message)
          setLoading(false)
        }
        return
      }

      const detalles = await Promise.all((configs || []).map(async (config: any) => {
        const evento = Array.isArray(config.eventos) ? config.eventos[0] : config.eventos
        if (!evento?.id) return null
        const { data: personas, error: resumenError } = await supabase.rpc('asistencia_resumen_evento', { p_evento_id: evento.id })
        if (resumenError) return null
        const rows = (personas || []) as ResumenPersona[]
        return {
          id: String(evento.id),
          titulo: String(evento.titulo || 'Actividad'),
          fechaInicio: String(evento.fecha_inicio),
          asistio: rows.filter(item => item.estado === 'asistio').length,
          sinConfirmacion: rows.filter(item => item.estado === 'sin_confirmacion').length,
          justificado: rows.filter(item => item.estado === 'justificado').length,
          personas: rows,
        } satisfies EventoResumen
      }))

      if (!cancelled) {
        setEventos((detalles.filter(Boolean) as EventoResumen[]).sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()))
        setLoading(false)
      }
    }

    void cargar()
    return () => { cancelled = true }
  }, [])

  const personas = useMemo(() => {
    const mapa = new Map<string, PersonaAgregada>()

    eventos.forEach(evento => {
      evento.personas.forEach(persona => {
        const actual = mapa.get(persona.profile_id) || {
          id: persona.profile_id,
          nombre: persona.nombre_completo,
          avatarUrl: persona.avatar_url,
          asistio: 0,
          justificado: 0,
          sinConfirmacion: 0,
          total: 0,
          porcentaje: 0,
          consecutivos: 0,
          historial: [],
        }

        actual.total += 1
        if (persona.estado === 'asistio') actual.asistio += 1
        if (persona.estado === 'justificado') actual.justificado += 1
        if (persona.estado === 'sin_confirmacion') actual.sinConfirmacion += 1
        actual.consecutivos = Math.max(actual.consecutivos, Number(persona.consecutivos_sin_confirmar || 0))
        actual.historial.push({ eventoId: evento.id, titulo: evento.titulo, fechaInicio: evento.fechaInicio, estado: persona.estado })
        actual.porcentaje = actual.total > 0 ? Math.round((actual.asistio / actual.total) * 100) : 0
        mapa.set(persona.profile_id, actual)
      })
    })

    return [...mapa.values()]
      .sort((a, b) => b.consecutivos - a.consecutivos || a.nombre.localeCompare(b.nombre, 'es'))
  }, [eventos])

  const personasFiltradas = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    if (!needle) return personas
    return personas.filter(persona => persona.nombre.toLocaleLowerCase('es').includes(needle))
  }, [personas, query])

  const totales = useMemo(() => eventos.reduce((acc, evento) => ({
    asistio: acc.asistio + evento.asistio,
    sinConfirmacion: acc.sinConfirmacion + evento.sinConfirmacion,
    justificado: acc.justificado + evento.justificado,
  }), { asistio: 0, sinConfirmacion: 0, justificado: 0 }), [eventos])

  const maxAsistencia = Math.max(1, ...eventos.map(evento => evento.asistio))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-emerald-700">Control congregacional</p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900">Asistencia de la congregación</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Disponible únicamente para Pastor y Administrador. Resume las actividades que tienen Ubicación VIDA activa.</p>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-emerald-600">{totales.asistio}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Asistencias</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-slate-700">{totales.sinConfirmacion}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Sin confirmar</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-amber-600">{totales.justificado}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Justificados</p></div>
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-100 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong className="text-slate-700">Sin confirmación no equivale automáticamente a ausencia.</strong> Puede ocurrir si la persona no llevaba el teléfono, tenía ubicación desactivada o hubo un problema de precisión o conexión.</p>
      </div>

      <div className="mt-5 grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1">
        <button type="button" onClick={() => setTab('personas')} className={`min-h-10 rounded-xl text-[11px] font-extrabold transition ${tab === 'personas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1"><UsersRound className="h-4 w-4" /> Personas</span></button>
        <button type="button" onClick={() => setTab('eventos')} className={`min-h-10 rounded-xl text-[11px] font-extrabold transition ${tab === 'eventos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Eventos</span></button>
        <button type="button" onClick={() => setTab('graficas')} className={`min-h-10 rounded-xl text-[11px] font-extrabold transition ${tab === 'graficas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1"><BarChart3 className="h-4 w-4" /> Gráficas</span></button>
      </div>

      {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
      ) : eventos.length === 0 ? (
        <section className="mt-5 rounded-[22px] bg-white p-8 text-center ring-1 ring-slate-200">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">Aún no hay actividades con asistencia registrada.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Cuando actives Ubicación VIDA en un evento, sus resultados aparecerán aquí.</p>
        </section>
      ) : tab === 'personas' ? (
        <>
          <label className="mt-4 flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3.5 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar persona" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </label>

          <section className="mt-3 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
            <div className="divide-y divide-slate-100">
              {personasFiltradas.map(persona => {
                const expanded = openId === persona.id
                return (
                  <div key={persona.id}>
                    <button type="button" onClick={() => setOpenId(expanded ? null : persona.id)} className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left">
                      <UserAvatar nombre={persona.nombre} avatarUrl={persona.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-900">{persona.nombre}</p><p className="mt-0.5 text-[10px] text-slate-400">{persona.asistio} asistió · {persona.sinConfirmacion} sin confirmar · {persona.justificado} justificado</p></div>
                          <span className="shrink-0 text-xs font-extrabold text-slate-700">{persona.porcentaje}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${persona.porcentaje}%` }} /></div>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {persona.consecutivos >= 3 && (
                      <div className="mx-3.5 mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{persona.consecutivos} actividades consecutivas sin confirmación.</strong> Señal para seguimiento pastoral.</span></div>
                    )}

                    {expanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-3">
                        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Historial</p>
                        <div className="space-y-2">
                          {persona.historial.map(item => (
                            <div key={item.eventoId} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.estado === 'asistio' ? 'bg-emerald-50 text-emerald-600' : item.estado === 'justificado' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{item.estado === 'asistio' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span>
                              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{item.titulo}</p><p className="mt-0.5 text-[10px] text-slate-400">{new Intl.DateTimeFormat('es-SV',{dateStyle:'medium'}).format(new Date(item.fechaInicio))}</p></div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ${estadoClasses(item.estado)}`}>{estadoLabel(item.estado)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      ) : tab === 'eventos' ? (
        <section className="mt-4 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {eventos.map(evento => (
              <Link key={evento.id} href={`/asistencia/eventos/${evento.id}`} className="block px-4 py-4 active:bg-emerald-50/30">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-slate-900">{evento.titulo}</p><p className="mt-1 text-[10px] text-slate-400">{new Intl.DateTimeFormat('es-SV',{dateStyle:'medium',timeStyle:'short'}).format(new Date(evento.fechaInicio))}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">Ver detalle</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-50 px-2 py-2"><p className="text-sm font-extrabold text-emerald-700">{evento.asistio}</p><p className="text-[8px] font-bold uppercase text-emerald-600/70">Asistió</p></div>
                  <div className="rounded-xl bg-slate-100 px-2 py-2"><p className="text-sm font-extrabold text-slate-700">{evento.sinConfirmacion}</p><p className="text-[8px] font-bold uppercase text-slate-500">Sin confirmar</p></div>
                  <div className="rounded-xl bg-amber-50 px-2 py-2"><p className="text-sm font-extrabold text-amber-700">{evento.justificado}</p><p className="text-[8px] font-bold uppercase text-amber-600/70">Justificado</p></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-[22px] bg-white p-4 ring-1 ring-slate-200">
          <div className="mb-4"><h2 className="text-sm font-extrabold text-slate-900">Asistencia por actividad</h2><p className="mt-1 text-[10px] leading-4 text-slate-400">Personas con llegada confirmada por Ubicación VIDA.</p></div>
          <div className="space-y-4">
            {eventos.map(evento => (
              <div key={evento.id}>
                <div className="flex items-end justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-700">{evento.titulo}</p><p className="mt-0.5 text-[9px] text-slate-400">{new Intl.DateTimeFormat('es-SV',{dateStyle:'short'}).format(new Date(evento.fechaInicio))}</p></div><span className="shrink-0 text-sm font-extrabold text-emerald-700">{evento.asistio}</span></div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(evento.asistio / maxAsistencia) * 100}%` }} /></div>
                <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>{evento.sinConfirmacion} sin confirmar</span><span>{evento.justificado} justificados</span></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
