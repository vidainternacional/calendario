'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Clock3, Loader2, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/comunidad/UserAvatar'

type Persona = {
  profile_id: string
  nombre_completo: string
  avatar_url: string | null
  estado: 'asistio' | 'justificado' | 'sin_confirmacion'
  confirmado_en: string | null
  metodo: 'gps' | 'pastoral' | null
  consecutivos_sin_confirmar: number
}

type Historial = {
  evento_id: string
  titulo: string
  fecha_inicio: string
  estado: 'asistio' | 'justificado' | 'sin_confirmacion'
  confirmado_en: string | null
  metodo: 'gps' | 'pastoral' | null
}

function estadoLabel(estado: Persona['estado']) {
  if (estado === 'asistio') return 'Asistió'
  if (estado === 'justificado') return 'Justificado'
  return 'Sin confirmación'
}

function estadoClass(estado: Persona['estado']) {
  if (estado === 'asistio') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (estado === 'justificado') return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function AsistenciaEventoClient({ eventId, titulo, fechaInicio }: { eventId: string; titulo: string; fechaInicio: string }) {
  const supabase = useMemo(() => createClient() as any, [])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [historial, setHistorial] = useState<Historial[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('asistencia_resumen_evento', { p_evento_id: eventId })
    if (rpcError) setError(rpcError.message)
    else setPersonas((data || []) as Persona[])
    setLoading(false)
  }, [eventId, supabase])

  useEffect(() => { void cargar() }, [cargar])

  async function toggleHistorial(profileId: string) {
    if (selectedId === profileId) {
      setSelectedId(null)
      setHistorial([])
      return
    }
    setSelectedId(profileId)
    setHistorial([])
    setHistorialLoading(true)
    const { data, error: rpcError } = await supabase.rpc('asistencia_historial_persona', { p_profile_id: profileId })
    if (rpcError) setError(rpcError.message)
    else setHistorial((data || []) as Historial[])
    setHistorialLoading(false)
  }

  async function justificar(profileId: string) {
    setBusyId(profileId)
    setError(null)
    const { error: rpcError } = await supabase.rpc('asistencia_justificar', {
      p_evento_id: eventId,
      p_profile_id: profileId,
    })
    if (rpcError) setError(rpcError.message)
    else await cargar()
    setBusyId(null)
  }

  const resumen = useMemo(() => ({
    asistio: personas.filter(item => item.estado === 'asistio').length,
    sinConfirmacion: personas.filter(item => item.estado === 'sin_confirmacion').length,
    justificado: personas.filter(item => item.estado === 'justificado').length,
  }), [personas])

  const fecha = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fechaInicio))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href={`/eventos/${eventId}`} className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-slate-500"><ArrowLeft className="h-4 w-4" /> Evento</Link>

      <header className="mt-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-violet-600">Ubicación VIDA</p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-slate-900">Asistencia</h1>
        <p className="mt-1 text-sm font-semibold text-slate-700">{titulo}</p>
        <p className="mt-1 text-xs text-slate-500">{fecha}</p>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-emerald-600">{resumen.asistio}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Asistió</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-slate-700">{resumen.sinConfirmacion}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Sin confirmar</p></div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200"><p className="text-xl font-extrabold text-amber-600">{resumen.justificado}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Justificado</p></div>
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p><strong className="text-slate-700">Sin confirmación no significa automáticamente que faltó.</strong> Puede deberse a teléfono ausente, permiso de ubicación, precisión o conexión.</p></div>

      {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid min-h-52 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>
      ) : personas.length === 0 ? (
        <section className="mt-5 rounded-[22px] bg-white p-8 text-center ring-1 ring-slate-200"><UserRoundCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No hay personas asociadas a este evento.</p></section>
      ) : (
        <section className="mt-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
          <div className="max-h-[42rem] divide-y divide-slate-100 overflow-y-auto">
            {personas.map(persona => {
              const expanded = selectedId === persona.profile_id
              return (
                <div key={persona.profile_id}>
                  <div className="px-3 py-3.5 sm:px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar nombre={persona.nombre_completo} avatarUrl={persona.avatar_url} size="sm" />
                      <button type="button" onClick={() => void toggleHistorial(persona.profile_id)} className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{persona.nombre_completo}</p><p className="mt-0.5 text-[10px] text-slate-400">Toca para ver historial</p></div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ${estadoClass(persona.estado)}`}>{estadoLabel(persona.estado)}</span>
                        </div>
                      </button>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition ${expanded ? 'rotate-180' : ''}`} />
                    </div>

                    {persona.estado === 'sin_confirmacion' && persona.consecutivos_sin_confirmar >= 3 && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{persona.consecutivos_sin_confirmar} actividades consecutivas sin confirmación.</strong> Conviene revisar pastoralmente si la persona está bien.</span></div>
                    )}

                    {persona.estado === 'sin_confirmacion' && (
                      <button type="button" disabled={busyId === persona.profile_id} onClick={() => void justificar(persona.profile_id)} className="mt-3 min-h-9 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[11px] font-bold text-amber-700 disabled:opacity-50">{busyId === persona.profile_id ? 'Guardando…' : 'Marcar justificado'}</button>
                    )}
                  </div>

                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
                      {historialLoading ? <div className="grid min-h-20 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></div> : historial.length === 0 ? <p className="py-4 text-center text-xs text-slate-400">Aún no hay historial de actividades controladas.</p> : <div className="space-y-2">{historial.map(item => <div key={item.evento_id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.estado === 'asistio' ? 'bg-emerald-50 text-emerald-600' : item.estado === 'justificado' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{item.estado === 'asistio' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{item.titulo}</p><p className="mt-0.5 text-[10px] text-slate-400">{new Intl.DateTimeFormat('es-SV',{dateStyle:'medium'}).format(new Date(item.fecha_inicio))}</p></div><span className={`shrink-0 text-[9px] font-bold ${item.estado === 'asistio' ? 'text-emerald-600' : item.estado === 'justificado' ? 'text-amber-600' : 'text-slate-400'}`}>{estadoLabel(item.estado)}</span></div>)}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
