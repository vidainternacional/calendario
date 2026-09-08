'use client'

import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, Clock3, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import UserAvatar from '@/components/comunidad/UserAvatar'

type Estado = 'asistio' | 'justificado' | 'sin_confirmacion'

type HistorialItem = {
  id: string
  titulo: string
  fecha: string
  estado: Estado
  detalle?: string
}

type PersonaDemo = {
  id: string
  nombre: string
  rol: string
  avatarUrl: string | null
  porcentaje: number
  consecutivos: number
  ultimo: string
  historial: HistorialItem[]
}

type EventoDemo = {
  id: string
  titulo: string
  fecha: string
  asistio: number
  sinConfirmacion: number
  justificado: number
}

const PERSONAS: PersonaDemo[] = [
  {
    id: 'p1',
    nombre: 'Carlos Méndez',
    rol: 'Servidor',
    avatarUrl: null,
    porcentaje: 88,
    consecutivos: 0,
    ultimo: 'Asistió · domingo 6 sep',
    historial: [
      { id: 'h11', titulo: 'Servicio dominical', fecha: 'Domingo 6 sep · 9:54 a. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
      { id: 'h12', titulo: 'Estudio bíblico', fecha: 'Miércoles 2 sep', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
      { id: 'h13', titulo: 'Servicio dominical', fecha: 'Domingo 30 ago', estado: 'justificado', detalle: 'Justificado pastoralmente' },
    ],
  },
  {
    id: 'p2',
    nombre: 'Ana López',
    rol: 'Líder',
    avatarUrl: null,
    porcentaje: 100,
    consecutivos: 0,
    ultimo: 'Asistió · domingo 6 sep',
    historial: [
      { id: 'h21', titulo: 'Servicio dominical', fecha: 'Domingo 6 sep · 9:47 a. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
      { id: 'h22', titulo: 'Estudio bíblico', fecha: 'Miércoles 2 sep · 6:52 p. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
      { id: 'h23', titulo: 'Servicio dominical', fecha: 'Domingo 30 ago · 9:51 a. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
    ],
  },
  {
    id: 'p3',
    nombre: 'José Ramírez',
    rol: 'Servidor',
    avatarUrl: null,
    porcentaje: 63,
    consecutivos: 3,
    ultimo: 'Sin confirmación · 3 actividades',
    historial: [
      { id: 'h31', titulo: 'Servicio dominical', fecha: 'Domingo 6 sep', estado: 'sin_confirmacion' },
      { id: 'h32', titulo: 'Estudio bíblico', fecha: 'Miércoles 2 sep', estado: 'sin_confirmacion' },
      { id: 'h33', titulo: 'Servicio dominical', fecha: 'Domingo 30 ago', estado: 'sin_confirmacion' },
    ],
  },
  {
    id: 'p4',
    nombre: 'María Torres',
    rol: 'Servidor',
    avatarUrl: null,
    porcentaje: 75,
    consecutivos: 1,
    ultimo: 'Sin confirmación · domingo 6 sep',
    historial: [
      { id: 'h41', titulo: 'Servicio dominical', fecha: 'Domingo 6 sep', estado: 'sin_confirmacion' },
      { id: 'h42', titulo: 'Estudio bíblico', fecha: 'Miércoles 2 sep · 6:49 p. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
      { id: 'h43', titulo: 'Servicio dominical', fecha: 'Domingo 30 ago · 9:58 a. m.', estado: 'asistio', detalle: 'Confirmado por Ubicación VIDA' },
    ],
  },
]

const EVENTOS: EventoDemo[] = [
  { id: 'e1', titulo: 'Servicio dominical', fecha: 'Domingo 6 sep · 10:00 a. m.', asistio: 42, sinConfirmacion: 8, justificado: 3 },
  { id: 'e2', titulo: 'Estudio bíblico', fecha: 'Miércoles 2 sep · 7:00 p. m.', asistio: 31, sinConfirmacion: 6, justificado: 2 },
  { id: 'e3', titulo: 'Servicio dominical', fecha: 'Domingo 30 ago · 10:00 a. m.', asistio: 45, sinConfirmacion: 5, justificado: 4 },
]

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

export default function AsistenciaPastoralVistaClient() {
  const [tab, setTab] = useState<'personas' | 'eventos'>('personas')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>('p3')

  const personas = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    if (!needle) return PERSONAS
    return PERSONAS.filter((persona) => `${persona.nombre} ${persona.rol}`.toLocaleLowerCase('es').includes(needle))
  }, [query])

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-violet-600">Perfil pastoral</p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900">Asistencia pastoral</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Vista global para pastor y administrador. Aquí se revisa la constancia por persona y por actividad.</p>
      </header>

      <div className="mt-4 rounded-2xl bg-violet-50 px-3.5 py-3 text-[11px] font-semibold leading-5 text-violet-700 ring-1 ring-violet-100">
        Vista de ejemplo · Los nombres y números de esta pantalla son datos simulados para validar el diseño antes de producción.
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-emerald-600">42</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Asistieron</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-slate-700">8</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Sin confirmar</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-amber-600">3</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Justificados</p></div>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1">
        <button type="button" onClick={() => setTab('personas')} className={`min-h-10 rounded-xl text-xs font-extrabold transition ${tab === 'personas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1.5"><UsersRound className="h-4 w-4" /> Personas</span></button>
        <button type="button" onClick={() => setTab('eventos')} className={`min-h-10 rounded-xl text-xs font-extrabold transition ${tab === 'eventos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Eventos</span></button>
      </div>

      {tab === 'personas' ? (
        <>
          <label className="mt-4 flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3.5 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar persona" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </label>

          <section className="mt-3 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
            <div className="divide-y divide-slate-100">
              {personas.map((persona) => {
                const expanded = openId === persona.id
                return (
                  <div key={persona.id}>
                    <button type="button" onClick={() => setOpenId(expanded ? null : persona.id)} className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left">
                      <UserAvatar nombre={persona.nombre} avatarUrl={persona.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">{persona.nombre}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">{persona.rol} · {persona.ultimo}</p>
                          </div>
                          <span className="shrink-0 text-xs font-extrabold text-slate-700">{persona.porcentaje}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${persona.porcentaje}%` }} /></div>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {persona.consecutivos >= 3 && (
                      <div className="mx-3.5 mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{persona.consecutivos} actividades consecutivas sin confirmación.</strong> Señal para seguimiento pastoral, no una conclusión automática de ausencia.</span></div>
                    )}

                    {expanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-3">
                        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Historial reciente</p>
                        <div className="space-y-2">
                          {persona.historial.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.estado === 'asistio' ? 'bg-emerald-50 text-emerald-600' : item.estado === 'justificado' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                {item.estado === 'asistio' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                              </span>
                              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{item.titulo}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.fecha}</p>{item.detalle && <p className="mt-1 text-[9px] text-slate-400">{item.detalle}</p>}</div>
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
      ) : (
        <section className="mt-4 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {EVENTOS.map((evento) => (
              <div key={evento.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-slate-900">{evento.titulo}</p><p className="mt-1 text-[10px] text-slate-400">{evento.fecha}</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-extrabold text-violet-700">Ver detalle</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-50 px-2 py-2"><p className="text-sm font-extrabold text-emerald-700">{evento.asistio}</p><p className="text-[8px] font-bold uppercase text-emerald-600/70">Asistió</p></div>
                  <div className="rounded-xl bg-slate-100 px-2 py-2"><p className="text-sm font-extrabold text-slate-700">{evento.sinConfirmacion}</p><p className="text-[8px] font-bold uppercase text-slate-500">Sin confirmar</p></div>
                  <div className="rounded-xl bg-amber-50 px-2 py-2"><p className="text-sm font-extrabold text-amber-700">{evento.justificado}</p><p className="text-[8px] font-bold uppercase text-amber-600/70">Justificado</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-100 px-3.5 py-3 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p><strong className="text-slate-700">Sin confirmación no equivale automáticamente a “faltó”.</strong> El pastor puede revisar el historial y justificar cuando corresponda.</p></div>
    </main>
  )
}
