'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { ChevronDown, Clock3, History, UserRoundPlus, Users } from 'lucide-react'
import {
  obtenerCentroSolicitudesMinisterio,
  type CentroSolicitudesMinisterio,
} from '@/app/actions/centro-solicitudes-ministerio'
import { asignarReemplazoMinisterial } from '@/app/actions/reemplazos-ministeriales'
import {
  PENDING_INDICATORS_EVENT,
  requestPendingIndicatorsRefresh,
} from '@/components/notificaciones/usePendingIndicators'

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function estadoHistorial(value: string) {
  if (value === 'aceptado') return 'Reemplazado'
  if (value === 'cancelado') return 'Cancelado'
  if (value === 'rechazado') return 'Rechazado'
  return value
}

export default function MinisterioSolicitudesEnhancer({
  ministerioId,
  puedeGestionar,
}: {
  ministerioId: string
  puedeGestionar: boolean
}) {
  const pathname = usePathname()
  const [datos, setDatos] = useState<CentroSolicitudesMinisterio | null>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [seleccion, setSeleccion] = useState<Record<string, string>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const hubPath = `/ministerios/${ministerioId}`
  const solicitudesPath = `${hubPath}/solicitudes`
  const estaEnHub = pathname === hubPath
  const estaEnSolicitudes = pathname === solicitudesPath

  const cargar = useCallback(async () => {
    if (!puedeGestionar) return
    try {
      const next = await obtenerCentroSolicitudesMinisterio(ministerioId)
      setDatos(next)
    } catch (error) {
      console.error('No se pudieron cargar las solicitudes del ministerio', error)
    }
  }, [ministerioId, puedeGestionar])

  useEffect(() => {
    if (!puedeGestionar) return
    void cargar()

    const onFocus = () => void cargar()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void cargar()
    }
    const onRefresh = () => void cargar()

    const interval = window.setInterval(cargar, 30_000)
    window.addEventListener('focus', onFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, onRefresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, onRefresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [cargar, puedeGestionar])

  useEffect(() => {
    if (!puedeGestionar || !datos || !estaEnHub) return

    let cancelled = false
    let observer: MutationObserver | null = null

    const pintarBadge = () => {
      if (cancelled) return false
      const link = document.querySelector<HTMLAnchorElement>(`a[href="${solicitudesPath}"]`)
      if (!link) return false

      const icon = link.querySelector<HTMLElement>('span.relative') || link.querySelector<HTMLElement>('span')
      if (!icon) return false
      icon.style.position = 'relative'

      let badge = icon.querySelector<HTMLElement>('[data-solicitudes-pendientes-badge]')
      if (datos.totalPendientes > 0) {
        if (!badge) {
          badge = document.createElement('span')
          badge.dataset.solicitudesPendientesBadge = 'true'
          badge.className = 'absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white'
          icon.appendChild(badge)
        }
        badge.textContent = datos.totalPendientes > 99 ? '99+' : String(datos.totalPendientes)
      } else {
        badge?.remove()
      }

      const textos = link.querySelectorAll<HTMLElement>('span.block')
      const detail = textos.length > 1 ? textos[textos.length - 1] : null
      if (detail) {
        detail.textContent = datos.totalPendientes > 0
          ? `${datos.totalPendientes} ${datos.totalPendientes === 1 ? 'pendiente' : 'pendientes'}`
          : 'Sin pendientes'
        detail.classList.toggle('text-rose-500', datos.totalPendientes > 0)
        detail.classList.toggle('font-semibold', datos.totalPendientes > 0)
      }
      return true
    }

    if (!pintarBadge()) {
      observer = new MutationObserver(() => {
        if (pintarBadge()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      document.querySelector('[data-solicitudes-pendientes-badge]')?.remove()
    }
  }, [datos, estaEnHub, puedeGestionar, solicitudesPath])

  useEffect(() => {
    setTarget(null)
    if (!puedeGestionar || !estaEnSolicitudes) return

    let cancelled = false
    let observer: MutationObserver | null = null

    const montar = () => {
      if (cancelled) return false
      const newLink = document.querySelector<HTMLAnchorElement>(`a[href="${solicitudesPath}/nueva"]`)
      const header = newLink?.parentElement
      const root = header?.parentElement
      if (!header || !root) return false

      let mount = root.querySelector<HTMLElement>('[data-centro-reemplazos-root]')
      if (!mount) {
        mount = document.createElement('div')
        mount.dataset.centroReemplazosRoot = 'true'
        header.insertAdjacentElement('afterend', mount)
      }
      setTarget(mount)

      const title = root.querySelector<HTMLElement>('h2')
      if (title && datos?.totalPendientes) {
        title.innerHTML = `Solicitudes <span class="ml-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 align-middle text-[9px] font-black leading-none text-white">${datos.totalPendientes > 99 ? '99+' : datos.totalPendientes}</span>`
      }
      return true
    }

    if (!montar()) {
      observer = new MutationObserver(() => {
        if (montar()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      document.querySelector('[data-centro-reemplazos-root]')?.remove()
    }
  }, [datos?.totalPendientes, estaEnSolicitudes, puedeGestionar, solicitudesPath])

  function resolver(eventoId: string, intercambioId: string) {
    const candidatoId = seleccion[intercambioId]
    if (!candidatoId) return

    setErrores((prev) => ({ ...prev, [intercambioId]: '' }))
    startTransition(async () => {
      const result = await asignarReemplazoMinisterial(
        ministerioId,
        eventoId,
        intercambioId,
        candidatoId,
      )
      if (result.error) {
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

  const contenido = useMemo(() => {
    if (!datos?.puedeGestionar || !target) return null

    return (
      <section className="mt-4 space-y-3" aria-label="Solicitudes de reemplazo">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-600">Reemplazos del equipo</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Solicitudes de servidores que no pueden cubrir una fecha.</p>
          </div>
          {datos.reemplazosPendientes.length > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white">
              {datos.reemplazosPendientes.length}
            </span>
          )}
        </div>

        {datos.reemplazosPendientes.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <UserRoundPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-700">Sin solicitudes de reemplazo</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Cuando alguien pida cobertura aparecerá aquí.</p>
              </div>
            </div>
          </div>
        ) : (
          datos.reemplazosPendientes.map((grupo) => (
            <article key={grupo.key} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
              <div className="bg-amber-50/70 p-4 ring-1 ring-inset ring-amber-100">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-extrabold text-amber-700 ring-1 ring-amber-100">
                    {grupo.solicitanteAvatarUrl ? (
                      <img src={grupo.solicitanteAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      grupo.solicitanteNombre.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-extrabold text-slate-900">{grupo.solicitanteNombre}</p>
                      <span className="rounded-full bg-rose-500 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-white">No disponible</span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-700">{grupo.eventoTitulo}</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{fechaCorta(grupo.fechaInicio)} · pidió reemplazo {fechaCorta(grupo.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {grupo.funciones.map((solicitud) => {
                  const candidatoId = seleccion[solicitud.intercambioId] || ''
                  const candidato = solicitud.candidatos.find((item) => item.profileId === candidatoId) || null
                  const error = errores[solicitud.intercambioId]

                  return (
                    <div key={solicitud.intercambioId} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Función por cubrir</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-800">{solicitud.funcion}</p>
                        </div>
                        <Users className="h-4 w-4 text-slate-300" />
                      </div>

                      {solicitud.candidatos.length === 0 ? (
                        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[10px] leading-4 text-amber-800 ring-1 ring-amber-100">
                          No hay integrantes disponibles con esta capacidad. El líder puede reorganizar el equipo manualmente.
                        </p>
                      ) : (
                        <div className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {solicitud.candidatos.map((item) => {
                            const activo = candidatoId === item.profileId
                            return (
                              <button
                                key={item.profileId}
                                type="button"
                                onClick={() => setSeleccion((prev) => ({ ...prev, [solicitud.intercambioId]: item.profileId }))}
                                className="w-[80px] shrink-0 snap-start text-center"
                                aria-pressed={activo}
                              >
                                <span className={`mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full text-sm font-extrabold transition active:scale-95 ${activo ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-50 text-indigo-600 ring-1 ring-slate-200'}`}>
                                  {item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : item.nombre.charAt(0)}
                                </span>
                                <span className={`mt-1 block truncate text-[9px] font-extrabold ${activo ? 'text-indigo-700' : 'text-slate-600'}`}>{item.nombre.split(' ')[0]}</span>
                                <span className="mt-0.5 block truncate text-[8px] text-slate-400">{item.yaSirve ? 'Ya sirve' : 'Disponible'}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {error && <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>}

                      {candidato && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => resolver(grupo.eventoId, solicitud.intercambioId)}
                          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:opacity-60"
                        >
                          <UserRoundPlus className="h-4 w-4" />
                          {isPending ? 'Asignando…' : `Asignar a ${candidato.nombre.split(' ')[0]}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          ))
        )}

        {datos.historialReemplazos.length > 0 && (
          <details className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <History className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Historial de reemplazos</span>
                <span className="mt-0.5 block text-[9px] text-slate-400">Quién pidió ayuda, quién cubrió y cuándo se resolvió.</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-3">
              {datos.historialReemplazos.slice(0, 20).map((item) => (
                <div key={`${item.eventoId}:${item.intercambioId}`} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-extrabold text-slate-700">{item.eventoTitulo}</p>
                      <p className="mt-0.5 text-[9px] text-slate-500">{item.solicitanteNombre} · {item.funcion}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{item.reemplazoNombre ? `Cubrió: ${item.reemplazoNombre}` : 'Sin reemplazo asignado'}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[8px] font-extrabold text-slate-500">{estadoHistorial(item.estado)}</span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[8px] text-slate-300"><Clock3 className="h-3 w-3" />{fechaCorta(item.resueltoAt || item.createdAt)}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>
    )
  }, [datos, errores, isPending, seleccion, target])

  return contenido && target ? createPortal(contenido, target) : null
}
