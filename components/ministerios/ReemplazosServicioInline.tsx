'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useSearchParams } from 'next/navigation'
import { CheckCircle2, ChevronDown, Clock3, History, UserRoundPlus, Users } from 'lucide-react'
import {
  asignarReemplazoMinisterial,
  obtenerReemplazosServicioMinisterial,
  type ReemplazosServicioMinisterial,
} from '@/app/actions/reemplazos-ministeriales'
import { PENDING_INDICATORS_EVENT, requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function estadoHistorial(estado: string) {
  if (estado === 'aceptado') return 'Reemplazado'
  if (estado === 'rechazado') return 'Rechazado'
  if (estado === 'cancelado') return 'Cancelado'
  return estado
}

export default function ReemplazosServicioInline() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const eventoId = searchParams.get('evento') || ''

  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [datos, setDatos] = useState<ReemplazosServicioMinisterial | null>(null)
  const [seleccion, setSeleccion] = useState<Record<string, string>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const cargar = useCallback(async () => {
    if (!ministerioId || !eventoId) return
    try {
      const respuesta = await obtenerReemplazosServicioMinisterial(ministerioId, eventoId)
      setDatos(respuesta)
    } catch (error) {
      console.error('No se pudieron cargar los reemplazos del servicio', error)
    }
  }, [eventoId, ministerioId])

  useEffect(() => {
    setTarget(null)
    setDatos(null)
    setSeleccion({})
    setErrores({})
    if (!ministerioId || !eventoId) return

    const servicio = document.querySelector<HTMLElement>('#servicio-activo')
    if (!servicio) return

    let mount = servicio.querySelector<HTMLElement>('[data-reemplazos-inline-root]')
    if (!mount) {
      mount = document.createElement('div')
      mount.dataset.reemplazosInlineRoot = 'true'
      mount.className = 'mt-4'
      servicio.appendChild(mount)
    }
    setTarget(mount)

    void cargar()

    const onFocus = () => void cargar()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void cargar()
    }
    const onRefresh = () => void cargar()

    window.addEventListener('focus', onFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, onRefresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, onRefresh)
      document.removeEventListener('visibilitychange', onVisibility)
      mount?.remove()
    }
  }, [cargar, eventoId, ministerioId])

  function resolver(intercambioId: string) {
    const candidatoId = seleccion[intercambioId]
    if (!candidatoId || !ministerioId || !eventoId) return

    setErrores((prev) => ({ ...prev, [intercambioId]: '' }))
    startTransition(async () => {
      const result = await asignarReemplazoMinisterial(ministerioId, eventoId, intercambioId, candidatoId)
      if (result?.error) {
        setErrores((prev) => ({ ...prev, [intercambioId]: result.error || 'No se pudo asignar el reemplazo.' }))
        return
      }

      setSeleccion((prev) => {
        const next = { ...prev }
        delete next[intercambioId]
        return next
      })
      requestPendingIndicatorsRefresh()
      await cargar()
    })
  }

  if (!target || !datos?.puedeGestionar) return null

  const contenido = (
    <section className="overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200" aria-label="Gestión de reemplazos">
      <div className="flex items-start gap-3 bg-amber-50/80 p-4 ring-1 ring-inset ring-amber-100">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-amber-700 ring-1 ring-amber-100">
          <UserRoundPlus className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-slate-900">Reemplazos</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">El líder decide quién cubre cada función cuando alguien no puede servir.</p>
            </div>
            {datos.solicitudes.length > 0 && (
              <span className="shrink-0 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-black text-white">
                {datos.solicitudes.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {datos.solicitudes.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-700">Sin reemplazos pendientes</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Si alguien solicita cobertura, aparecerá aquí.</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {datos.solicitudes.map((solicitud) => {
            const candidatoId = seleccion[solicitud.intercambioId] || ''
            const candidato = solicitud.candidatos.find((item) => item.profileId === candidatoId) || null
            const error = errores[solicitud.intercambioId]

            return (
              <article key={solicitud.intercambioId} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-50 text-sm font-extrabold text-rose-600 ring-1 ring-rose-100">
                    {solicitud.solicitanteAvatarUrl ? (
                      <img src={solicitud.solicitanteAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      solicitud.solicitanteNombre.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-extrabold text-slate-800">{solicitud.solicitanteNombre}</p>
                      <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-extrabold text-rose-600">No disponible</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Solicitó cobertura · {fechaCorta(solicitud.createdAt)}</p>
                    <span className="mt-2 inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-extrabold text-white">{solicitud.funcion}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Candidatos compatibles</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">Solo integrantes activos con capacidad para {solicitud.funcion}.</p>
                    </div>
                    <Users className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  </div>

                  {solicitud.candidatos.length === 0 ? (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-[10px] leading-4 text-amber-800 ring-1 ring-amber-100">
                      No hay candidatos compatibles disponibles en este momento. El líder puede reorganizar el equipo manualmente.
                    </div>
                  ) : (
                    <div className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {solicitud.candidatos.map((item) => {
                        const activo = candidatoId === item.profileId
                        return (
                          <button
                            key={item.profileId}
                            type="button"
                            onClick={() => setSeleccion((prev) => ({ ...prev, [solicitud.intercambioId]: item.profileId }))}
                            className="w-[78px] shrink-0 snap-start text-center"
                            aria-pressed={activo}
                          >
                            <span className={`mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full text-sm font-extrabold transition active:scale-95 ${activo ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-white text-indigo-600 ring-1 ring-slate-200'}`}>
                              {item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : item.nombre.charAt(0)}
                            </span>
                            <span className={`mt-1 block truncate text-[9px] font-extrabold ${activo ? 'text-indigo-700' : 'text-slate-600'}`}>{item.nombre.split(' ')[0]}</span>
                            <span className="mt-0.5 block truncate text-[8px] text-slate-400">{item.yaSirve ? `Ya sirve${item.funcionesActuales.length ? ` · ${item.funcionesActuales.join(', ')}` : ''}` : 'Disponible'}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {error && <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>}

                {candidato && (
                  <button
                    type="button"
                    onClick={() => resolver(solicitud.intercambioId)}
                    disabled={isPending}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:opacity-60"
                  >
                    <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                    {isPending ? 'Asignando…' : `Asignar a ${candidato.nombre.split(' ')[0]}`}
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {datos.historial.length > 0 && (
        <details className="border-t border-slate-100 bg-slate-50/70">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
              <History className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Historial de reemplazos</span>
              <span className="mt-0.5 block text-[9px] text-slate-400">{datos.historial.length} movimiento{datos.historial.length === 1 ? '' : 's'} registrado{datos.historial.length === 1 ? '' : 's'}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-3">
            {datos.historial.map((item) => (
              <div key={item.intercambioId} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold text-slate-700">{item.solicitanteNombre} · {item.funcion}</p>
                    <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
                      {item.reemplazoNombre ? `Cubrió: ${item.reemplazoNombre}` : 'Sin reemplazo asignado'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[8px] font-extrabold text-slate-500">{estadoHistorial(item.estado)}</span>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[8px] text-slate-300"><Clock3 className="h-3 w-3" aria-hidden="true" />{fechaCorta(item.resueltoAt || item.createdAt)}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )

  return createPortal(contenido, target)
}
