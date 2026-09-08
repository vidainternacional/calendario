'use client'

import Link from 'next/link'
import { CheckCircle2, Loader2, MapPin, ShieldCheck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EventoCalendario } from '@/components/calendario/calendario-ios-types'

type EstadoAsistencia = {
  configurado: boolean
  activo: boolean
  radio_metros: number | null
  minutos_antes: number | null
  minutos_despues: number | null
  ubicacion_tipo: 'principal' | 'especifica' | null
  ubicacion_principal_disponible: boolean
  radio_principal_metros: number | null
  puede_gestionar: boolean
  estado: 'asistio' | 'justificado' | null
  confirmado_en: string | null
  metodo: 'gps' | 'pastoral' | null
  ventana_abierta: boolean
}

type GeoResult = {
  latitude: number
  longitude: number
  accuracy: number
}

function obtenerUbicacion(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este dispositivo no permite usar ubicación desde VIDA.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) reject(new Error('Activa el permiso de ubicación para confirmar tu llegada.'))
        else if (error.code === error.TIMEOUT) reject(new Error('No fue posible obtener tu ubicación a tiempo. Intenta nuevamente.'))
        else reject(new Error('No fue posible obtener tu ubicación actual.'))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  })
}

export default function EventoAsistenciaPortal({ event }: { event: EventoCalendario | null }) {
  const supabase = useMemo(() => createClient() as any, [])
  const [estado, setEstado] = useState<EstadoAsistencia | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [radio, setRadio] = useState(150)
  const [antes, setAntes] = useState(30)
  const [despues, setDespues] = useState(90)

  const cargar = useCallback(async () => {
    if (!event || event.kind !== 'event') {
      setEstado(null)
      return
    }

    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('asistencia_evento_estado', { p_evento_id: event.id })
    if (rpcError) {
      console.error('[EventoAsistenciaPortal] estado', rpcError)
      setEstado(null)
    } else {
      const next = data as EstadoAsistencia
      setEstado(next)
      setRadio(Number(next.radio_metros || next.radio_principal_metros || 150))
      setAntes(Number(next.minutos_antes ?? 30))
      setDespues(Number(next.minutos_despues ?? 90))
    }
    setLoading(false)
  }, [event, supabase])

  useEffect(() => {
    setOpen(false)
    setError(null)
    setNotice(null)
    void cargar()
  }, [cargar, event?.id])

  async function configurarEspecifica() {
    if (!event) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const location = await obtenerUbicacion()
      const { error: rpcError } = await supabase.rpc('asistencia_configurar_evento', {
        p_evento_id: event.id,
        p_latitud: location.latitude,
        p_longitud: location.longitude,
        p_radio_metros: radio,
        p_minutos_antes: antes,
        p_minutos_despues: despues,
      })
      if (rpcError) throw rpcError
      setNotice('Ubicación específica activada para este evento.')
      await cargar()
    } catch (err: any) {
      setError(err?.message || 'No fue posible activar la ubicación del evento.')
    } finally {
      setBusy(false)
    }
  }

  async function configurarPrincipal() {
    if (!event) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { error: rpcError } = await supabase.rpc('asistencia_configurar_evento_principal', {
        p_evento_id: event.id,
        p_radio_metros: radio,
        p_minutos_antes: antes,
        p_minutos_despues: despues,
      })
      if (rpcError) throw rpcError
      setNotice('Se usará la ubicación principal de la iglesia para este evento.')
      await cargar()
    } catch (err: any) {
      setError(err?.message || 'No fue posible usar la ubicación principal de la iglesia.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmarLlegada() {
    if (!event) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const location = await obtenerUbicacion()
      const { data, error: rpcError } = await supabase.rpc('asistencia_confirmar_gps', {
        p_evento_id: event.id,
        p_latitud: location.latitude,
        p_longitud: location.longitude,
        p_precision_m: location.accuracy,
      })
      if (rpcError) throw rpcError
      setNotice(data?.distancia_metros != null ? 'Llegada confirmada dentro del área del evento.' : 'Llegada confirmada.')
      await cargar()
    } catch (err: any) {
      setError(err?.message || 'No fue posible confirmar tu llegada.')
    } finally {
      setBusy(false)
    }
  }

  async function desactivar() {
    if (!event) return
    setBusy(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('asistencia_desactivar_evento', { p_evento_id: event.id })
    if (rpcError) setError(rpcError.message)
    else {
      setNotice('Control de asistencia desactivado para este evento.')
      await cargar()
    }
    setBusy(false)
  }

  if (!event || event.kind !== 'event' || loading || !estado) return null
  if (!estado.puede_gestionar && (!estado.configurado || !estado.activo)) return null

  const confirmado = estado.estado === 'asistio'
  const justificado = estado.estado === 'justificado'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-[181] flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 text-xs font-extrabold text-slate-800 shadow-[0_12px_34px_rgba(15,23,42,.18)] backdrop-blur-xl active:scale-[.98]"
      >
        {confirmado ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <MapPin className="h-4 w-4 text-violet-600" />}
        {confirmado ? 'Llegada confirmada' : justificado ? 'Asistencia justificada' : estado.activo ? 'Ubicación VIDA' : 'Activar asistencia'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Ubicación VIDA">
          <section className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[#f6f7fb] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl sm:rounded-[28px] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><MapPin className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-violet-600">Ubicación VIDA</p><h2 className="mt-1 text-lg font-bold text-slate-900">{event.titulo}</h2></div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200"><X className="h-4 w-4" /></button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">VIDA usa tu ubicación únicamente cuando tú la solicitas para actividades programadas. Sirve para confirmar tu llegada y facilitar tu participación. No guarda tus recorridos ni tu ubicación personal.</p>

            {(notice || error) && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || notice}</div>}

            {estado.configurado && estado.activo ? (
              <div className="mt-5 space-y-3">
                {confirmado ? (
                  <div className="flex items-start gap-3 rounded-[20px] bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Asistencia confirmada</p><p className="mt-1 text-xs leading-5 text-emerald-700">Tu llegada quedó registrada para este evento.</p></div></div>
                ) : justificado ? (
                  <div className="rounded-[20px] bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">Tu asistencia está marcada como justificada por el equipo pastoral.</div>
                ) : estado.ventana_abierta ? (
                  <button type="button" onClick={() => void confirmarLlegada()} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-violet-50 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Confirmar mi llegada</button>
                ) : (
                  <div className="rounded-[20px] bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">La confirmación estará disponible desde {estado.minutos_antes} minutos antes hasta {estado.minutos_despues} minutos después del inicio.</div>
                )}

                <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Área de confirmación</p><p className="mt-1 text-sm font-bold text-slate-800">{estado.ubicacion_tipo === 'principal' ? 'Ubicación principal de la iglesia' : 'Ubicación específica del evento'} · radio aproximado de {estado.radio_metros} m</p><p className="mt-1 text-xs leading-5 text-slate-500">“Sin confirmación” no significa automáticamente que una persona faltó; puede no tener el teléfono, permiso de ubicación o conexión disponible.</p></div>

                {estado.puede_gestionar && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link href={`/asistencia/eventos/${event.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"><ShieldCheck className="h-4 w-4" /> Ver asistencia</Link>
                    <button type="button" disabled={busy} onClick={() => void desactivar()} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-50">Desactivar</button>
                  </div>
                )}
              </div>
            ) : estado.puede_gestionar ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-900">Activar control para este evento</p><p className="mt-1 text-xs leading-5 text-slate-500">Para servicios en la iglesia usa el punto institucional guardado. Para actividades externas puedes guardar una ubicación específica del evento.</p></div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Radio<input type="number" min={25} max={1000} value={radio} onChange={e => setRadio(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /></label>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Antes<input type="number" min={0} max={360} value={antes} onChange={e => setAntes(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /></label>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Después<input type="number" min={0} max={720} value={despues} onChange={e => setDespues(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /></label>
                </div>
                <p className="text-[11px] text-slate-400">Radio en metros; ventana antes/después en minutos.</p>
                {estado.ubicacion_principal_disponible && <button type="button" onClick={() => void configurarPrincipal()} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-violet-50 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Usar ubicación principal de la iglesia</button>}
                <button type="button" onClick={() => void configurarEspecifica()} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Usar mi ubicación para este evento</button>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </>
  )
}
