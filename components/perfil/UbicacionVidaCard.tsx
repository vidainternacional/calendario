'use client'

import { CheckCircle2, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type EstadoUbicacion = 'comprobando' | 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown'

type EstadoAsistencia = {
  configurado: boolean
  activo: boolean
  estado: 'asistio' | 'justificado' | null
  ventana_abierta: boolean
}

type ActividadCheckin = {
  id: string
  titulo: string
  fecha_inicio: string
  estado: EstadoAsistencia['estado']
}

type GeoResult = {
  latitude: number
  longitude: number
  accuracy: number
}

const LOOKBACK_MS = 12 * 60 * 60 * 1000
const LOOKAHEAD_MS = 6 * 60 * 60 * 1000

function obtenerUbicacionActual(): Promise<GeoResult> {
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

export default function UbicacionVidaCard() {
  const supabase = useMemo(() => createClient() as any, [])
  const [estado, setEstado] = useState<EstadoUbicacion>('comprobando')
  const [loading, setLoading] = useState(false)
  const [actividad, setActividad] = useState<ActividadCheckin | null>(null)
  const [actividadLoading, setActividadLoading] = useState(false)
  const [checkinError, setCheckinError] = useState<string | null>(null)

  const comprobar = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setEstado('unsupported')
      return
    }

    try {
      if ('permissions' in navigator && navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        setEstado(status.state as EstadoUbicacion)
        status.onchange = () => setEstado(status.state as EstadoUbicacion)
        return
      }
    } catch {
      // Safari/iOS puede no exponer el estado de geolocalización vía Permissions API.
    }

    setEstado('unknown')
  }, [])

  const cargarActividad = useCallback(async () => {
    setActividadLoading(true)
    try {
      const now = Date.now()
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id,titulo,fecha_inicio')
        .gte('fecha_inicio', new Date(now - LOOKBACK_MS).toISOString())
        .lte('fecha_inicio', new Date(now + LOOKAHEAD_MS).toISOString())
        .order('fecha_inicio', { ascending: true })
        .limit(30)

      if (eventosError) {
        console.error('[UbicacionVidaCard] eventos', eventosError)
        setActividad(null)
        return
      }

      const candidatos = await Promise.all(
        (eventos || []).map(async (evento: any) => {
          const { data, error } = await supabase.rpc('asistencia_evento_estado', { p_evento_id: evento.id })
          if (error) return null
          const next = data as EstadoAsistencia
          if (!next.configurado || !next.activo || !next.ventana_abierta) return null
          return {
            id: String(evento.id),
            titulo: String(evento.titulo || 'Actividad VIDA'),
            fecha_inicio: String(evento.fecha_inicio),
            estado: next.estado,
          } satisfies ActividadCheckin
        }),
      )

      const abiertos = candidatos.filter((item): item is ActividadCheckin => item !== null)
      abiertos.sort((a, b) =>
        Math.abs(new Date(a.fecha_inicio).getTime() - now) - Math.abs(new Date(b.fecha_inicio).getTime() - now),
      )
      setActividad(abiertos[0] || null)
    } finally {
      setActividadLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void comprobar()
  }, [comprobar])

  useEffect(() => {
    if (estado !== 'granted') {
      setActividad(null)
      return
    }

    void cargarActividad()
    const interval = window.setInterval(() => void cargarActividad(), 60_000)
    const handleFocus = () => void cargarActividad()
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [estado, cargarActividad])

  const activar = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstado('unsupported')
      return
    }

    setLoading(true)
    setCheckinError(null)
    navigator.geolocation.getCurrentPosition(
      () => {
        window.localStorage.setItem('vida-location-onboarding-requested-v1', '1')
        setEstado('granted')
        setLoading(false)
      },
      (error) => {
        window.localStorage.setItem('vida-location-onboarding-requested-v1', '1')
        if (error.code === error.PERMISSION_DENIED) setEstado('denied')
        else setEstado('unknown')
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const confirmarLlegada = useCallback(async () => {
    if (!actividad) return
    setLoading(true)
    setCheckinError(null)
    try {
      const location = await obtenerUbicacionActual()
      const { error } = await supabase.rpc('asistencia_confirmar_gps', {
        p_evento_id: actividad.id,
        p_latitud: location.latitude,
        p_longitud: location.longitude,
        p_precision_m: location.accuracy,
      })
      if (error) throw error
      await cargarActividad()
    } catch (error: any) {
      setCheckinError(error?.message || 'No fue posible confirmar tu llegada.')
    } finally {
      setLoading(false)
    }
  }, [actividad, cargarActividad, supabase])

  const activo = estado === 'granted'
  const llegadaConfirmada = actividad?.estado === 'asistio'
  const asistenciaJustificada = actividad?.estado === 'justificado'
  const puedeConfirmar = activo && actividad && !llegadaConfirmada && !asistenciaJustificada

  return (
    <section className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="ubicacion-vida-title">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="ubicacion-vida-title" className="text-lg font-semibold text-[#171923]">Check-in de asistencia</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">Activa la ubicación una vez. Cuando haya un servicio o actividad con asistencia abierta, podrás confirmar tu llegada desde aquí sin buscar el evento.</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50/80 px-4 py-4 text-xs leading-5 text-slate-700">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <p className="font-medium">Tu ubicación solo se usa en el momento de confirmar llegada. No guardamos recorridos ni te rastreamos fuera de eso.</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {estado === 'comprobando' && <p className="text-xs font-semibold text-slate-400">Comprobando permiso…</p>}
          {estado === 'denied' && <p className="text-xs font-semibold text-rose-600">Ubicación bloqueada en este dispositivo</p>}
          {(estado === 'prompt' || estado === 'unknown') && <p className="text-xs font-semibold text-slate-500">Activa la ubicación para usar el check-in</p>}
          {estado === 'unsupported' && <p className="text-xs font-semibold text-slate-400">Ubicación no disponible en este dispositivo</p>}

          {activo && actividadLoading && !actividad && <p className="text-xs font-semibold text-slate-400">Buscando actividad disponible…</p>}
          {activo && !actividadLoading && !actividad && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Listo para tu próximo check-in</p>
          )}
          {llegadaConfirmada && (
            <><p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Llegada confirmada</p><p className="mt-1 truncate text-[10px] text-slate-400">{actividad?.titulo}</p></>
          )}
          {asistenciaJustificada && (
            <><p className="text-xs font-bold text-amber-700">Asistencia justificada</p><p className="mt-1 truncate text-[10px] text-slate-400">{actividad?.titulo}</p></>
          )}
          {puedeConfirmar && (
            <><p className="text-xs font-bold text-emerald-700">Check-in disponible</p><p className="mt-1 truncate text-[10px] text-slate-400">{actividad.titulo}</p></>
          )}

          {estado === 'denied' && <p className="mt-1 text-[10px] leading-4 text-slate-400">Puedes habilitarla desde la configuración de permisos del dispositivo.</p>}
          {checkinError && <p className="mt-1 text-[10px] leading-4 text-rose-600">{checkinError}</p>}
        </div>

        {(estado === 'prompt' || estado === 'unknown') && (
          <button
            type="button"
            onClick={activar}
            disabled={loading}
            className="inline-flex min-h-11 max-w-[48%] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-center text-xs font-bold leading-4 text-white transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            Activar ubicación
          </button>
        )}

        {puedeConfirmar && (
          <button
            type="button"
            onClick={() => void confirmarLlegada()}
            disabled={loading}
            className="inline-flex min-h-11 max-w-[48%] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-center text-xs font-bold leading-4 text-white transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            Hacer check-in ahora
          </button>
        )}
      </div>
    </section>
  )
}
