'use client'

import { CheckCircle2, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type EstadoUbicacion = 'comprobando' | 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown'

export default function UbicacionVidaCard() {
  const [estado, setEstado] = useState<EstadoUbicacion>('comprobando')
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    void comprobar()
  }, [comprobar])

  const activar = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstado('unsupported')
      return
    }

    setLoading(true)
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

  const activo = estado === 'granted'

  return (
    <section className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="ubicacion-vida-title">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="ubicacion-vida-title" className="text-lg font-semibold text-[#171923]">Ubicación VIDA</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">Permite que VIDA solicite tu ubicación cuando confirmes llegada a un servicio o actividad con control de asistencia.</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <p>No guardamos recorridos ni tu ubicación fuera de la confirmación de una actividad. Por ahora se usa únicamente para asistencia.</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {estado === 'comprobando' && <p className="text-xs font-semibold text-slate-400">Comprobando permiso…</p>}
          {activo && <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Ubicación activa</p>}
          {estado === 'denied' && <p className="text-xs font-semibold text-rose-600">Ubicación bloqueada en este dispositivo</p>}
          {(estado === 'prompt' || estado === 'unknown') && <p className="text-xs font-semibold text-slate-500">Ubicación aún no activada</p>}
          {estado === 'unsupported' && <p className="text-xs font-semibold text-slate-400">Ubicación no disponible en este dispositivo</p>}
          {estado === 'denied' && <p className="mt-1 text-[10px] leading-4 text-slate-400">Puedes habilitarla desde la configuración de permisos del dispositivo.</p>}
        </div>

        {(estado === 'prompt' || estado === 'unknown') && (
          <button
            type="button"
            onClick={activar}
            disabled={loading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            Activar
          </button>
        )}
      </div>
    </section>
  )
}
