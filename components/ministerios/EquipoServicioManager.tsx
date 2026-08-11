'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  obtenerDatosEquipoServicio,
  type DatosEquipoServicio,
} from '@/app/actions/equipo-ministerial'
import { actualizarEquipoPersonaServicio } from '@/app/actions/equipo-servicio-operativo'
import {
  PENDING_INDICATORS_EVENT,
  requestPendingIndicatorsRefresh,
} from '@/components/notificaciones/usePendingIndicators'

type TouchInicio = {
  profileId: string
  x: number
  y: number
}

type EstadoResumen = 'pendiente' | 'confirmado'

const INACTIVOS = new Set(['no_disponible', 'declinado'])

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
}

function resumenEstado(estados: string[]): EstadoResumen {
  return estados.length > 0 && estados.every((estado) => estado === 'confirmado')
    ? 'confirmado'
    : 'pendiente'
}

export default function EquipoServicioManager() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = useMemo(
    () => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '',
    [pathname],
  )
  const eventoId = searchParams.get('evento') || ''
  const mes = searchParams.get('mes') || ''

  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [datos, setDatos] = useState<DatosEquipoServicio | null>(null)
  const [candidato, setCandidato] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [accionesAbiertas, setAccionesAbiertas] = useState<string | null>(null)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const touchInicio = useRef<TouchInicio | null>(null)
  const ignorarClick = useRef(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const cargar = useCallback(async () => {
    if (!ministerioId || !eventoId) return
    try {
      const respuesta = await obtenerDatosEquipoServicio(ministerioId, eventoId)
      setDatos(respuesta)
    } catch (err) {
      setError(mensajeError(err))
    }
  }, [eventoId, ministerioId])

  useEffect(() => {
    setTarget(null)
    setDatos(null)
    setCandidato(null)
    setSeleccion([])
    setAccionesAbiertas(null)
    setGuardando(null)
    setError('')

    if (!ministerioId || !eventoId) return

    const body = document.querySelector<HTMLElement>('#servicio-activo > details:nth-of-type(1) > div')
    if (!body) return

    Array.from(body.children).forEach((child) => {
      const element = child as HTMLElement
      if (!element.dataset.equipoInlineRoot) element.dataset.equipoLegacy = 'true'
    })

    let mount = body.querySelector<HTMLElement>('[data-equipo-inline-root]')
    if (!mount) {
      mount = document.createElement('div')
      mount.dataset.equipoInlineRoot = 'true'
      body.prepend(mount)
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
      Array.from(body.children).forEach((child) => {
        const element = child as HTMLElement
        delete element.dataset.equipoLegacy
      })
      mount?.remove()
    }
  }, [cargar, eventoId, ministerioId])

  const funcionesPorId = useMemo(
    () => new Map((datos?.funciones || []).map((funcion) => [funcion.id, funcion])),
    [datos],
  )

  const asignacionesActivas = useMemo(
    () => (datos?.asignaciones || []).filter((asignacion) => !INACTIVOS.has(String(asignacion.estado || ''))),
    [datos],
  )

  const capacidadesActivasPorPersona = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const asignacion of asignacionesActivas) {
      const profileId = String(asignacion.profile_id)
      const actuales = map.get(profileId) || []
      const capacidadId = String(asignacion.capacidad_id || '')
      if (capacidadId && !actuales.includes(capacidadId)) actuales.push(capacidadId)
      map.set(profileId, actuales)
    }
    return map
  }, [asignacionesActivas])

  const estadosActivosPorPersona = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const asignacion of asignacionesActivas) {
      const profileId = String(asignacion.profile_id)
      map.set(profileId, [...(map.get(profileId) || []), String(asignacion.estado || 'pendiente')])
    }
    return map
  }, [asignacionesActivas])

  const perfilesNoDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const asignacion of datos?.asignaciones || []) {
      if (INACTIVOS.has(String(asignacion.estado || ''))) set.add(String(asignacion.profile_id))
    }
    return set
  }, [datos])

  const integrantesActivos = useMemo(() => {
    if (!datos) return []
    return datos.miembros.filter((miembro) => (capacidadesActivasPorPersona.get(miembro.id) || []).length > 0)
  }, [capacidadesActivasPorPersona, datos])

  const totalFuncionesServicio = useMemo(
    () => Array.from(capacidadesActivasPorPersona.values()).reduce((total, capacidades) => total + capacidades.length, 0),
    [capacidadesActivasPorPersona],
  )

  useEffect(() => {
    if (!datos) return
    const summary = document.querySelector('#servicio-activo > details:nth-of-type(1) > summary')
    const textWrapper = summary?.children?.[1]
    const subtitle = textWrapper?.children?.[1]
    if (subtitle) {
      const personas = integrantesActivos.length
      subtitle.textContent = `${personas} ${personas === 1 ? 'persona' : 'personas'} · ${totalFuncionesServicio} ${totalFuncionesServicio === 1 ? 'función' : 'funciones'}`
    }
  }, [datos, integrantesActivos.length, totalFuncionesServicio])

  function abrirPersona(profileId: string) {
    const capacidades = capacidadesActivasPorPersona.get(profileId) || []
    setCandidato(profileId)
    setSeleccion([...capacidades])
    setAccionesAbiertas(null)
    setError('')
    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  function alternar(capacidadId: string) {
    setSeleccion((actuales) =>
      actuales.includes(capacidadId)
        ? actuales.filter((id) => id !== capacidadId)
        : [...actuales, capacidadId],
    )
    setError('')
  }

  async function guardar(profileId: string, capacidades: string[]) {
    if (!ministerioId || !eventoId || guardando) return
    setGuardando(profileId)
    setError('')

    try {
      await actualizarEquipoPersonaServicio(ministerioId, eventoId, profileId, capacidades)
      setCandidato(null)
      setSeleccion([])
      setAccionesAbiertas(null)
      requestPendingIndicatorsRefresh()
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(null)
    }
  }

  function iniciarSwipe(profileId: string, x: number, y: number) {
    touchInicio.current = { profileId, x, y }
  }

  function terminarSwipe(profileId: string, x: number, y: number) {
    const inicio = touchInicio.current
    touchInicio.current = null
    if (!inicio || inicio.profileId !== profileId) return

    const deltaX = x - inicio.x
    const deltaY = y - inicio.y
    if (Math.abs(deltaX) < 24 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return

    ignorarClick.current = true
    window.setTimeout(() => {
      ignorarClick.current = false
    }, 240)

    if (deltaX < -28) setAccionesAbiertas(profileId)
    if (deltaX > 24) setAccionesAbiertas(null)
  }

  if (!target) return null

  const candidatoActual = datos?.miembros.find((miembro) => miembro.id === candidato) || null
  const candidatoAsignado = candidatoActual
    ? (capacidadesActivasPorPersona.get(candidatoActual.id) || []).length > 0
    : false

  const contenido = (
    <div className="space-y-4">
      <div className="rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-indigo-600 ring-1 ring-indigo-100">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-800">Equipo de este servicio</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Toca una persona para incluirla, editar sus funciones o quitarla del servicio.
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-100">
            {integrantesActivos.length}
          </span>
        </div>
      </div>

      {error && !candidatoActual && (
        <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>
      )}

      {!datos ? (
        <p className="rounded-xl bg-white p-4 text-xs text-slate-400 ring-1 ring-slate-100">Cargando equipo...</p>
      ) : (
        <>
          <section className="rounded-[22px] bg-slate-100/80 p-3 ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Integrantes</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Los checks verdes ya están dentro del servicio.</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-slate-500 ring-1 ring-slate-200">
                {datos.miembros.length} integrantes
              </span>
            </div>

            {datos.miembros.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white p-3 text-center text-[10px] font-semibold text-slate-500 ring-1 ring-slate-100">
                Todavía no hay integrantes activos en este ministerio.
              </p>
            ) : (
              <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {datos.miembros.map((miembro) => {
                  const abierto = candidato === miembro.id
                  const yaAsignado = (capacidadesActivasPorPersona.get(miembro.id) || []).length > 0
                  const noDisponible = !yaAsignado && perfilesNoDisponibles.has(miembro.id)
                  const nombresCapacidades = miembro.capacidades
                    .map((id) => funcionesPorId.get(id)?.nombre)
                    .filter(Boolean)

                  return (
                    <button
                      key={miembro.id}
                      type="button"
                      onClick={() => abrirPersona(miembro.id)}
                      className="w-[78px] shrink-0 snap-start text-center"
                      aria-pressed={abierto}
                    >
                      <span className="relative mx-auto block h-[62px] w-[66px] overflow-visible">
                        <span
                          className={`absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 place-items-center overflow-hidden rounded-full text-base font-extrabold transition active:scale-95 ${
                            abierto
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                              : yaAsignado
                                ? 'bg-white text-indigo-600 ring-2 ring-emerald-300'
                                : noDisponible
                                  ? 'bg-white text-rose-500 ring-2 ring-rose-200'
                                  : 'bg-white text-indigo-600 ring-1 ring-slate-200'
                          }`}
                        >
                          {miembro.avatar_url ? (
                            <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            miembro.nombre_completo.charAt(0)
                          )}
                        </span>

                        <span
                          className={`absolute -right-0.5 bottom-0 grid h-5 w-5 place-items-center rounded-full border-2 border-slate-100 shadow-sm ${
                            yaAsignado
                              ? 'bg-emerald-500 text-white'
                              : noDisponible
                                ? 'bg-rose-500 text-white'
                                : 'bg-indigo-600 text-white'
                          }`}
                          aria-hidden="true"
                        >
                          {yaAsignado ? <Check className="h-2.5 w-2.5" /> : noDisponible ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                        </span>
                      </span>

                      <span className={`mt-1 block truncate text-[9px] font-extrabold ${abierto ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {miembro.nombre_completo.split(' ')[0]}
                      </span>
                      <span className={`mt-0.5 block truncate text-[8px] ${noDisponible ? 'font-semibold text-rose-400' : 'text-slate-400'}`}>
                        {yaAsignado
                          ? 'Seleccionado'
                          : noDisponible
                            ? 'No disponible'
                            : nombresCapacidades.length
                              ? `${nombresCapacidades.length} ${nombresCapacidades.length === 1 ? 'función' : 'funciones'}`
                              : 'Sin función'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {datos.miembros.length > 3 && (
              <p className="mt-0 text-right text-[8px] font-bold uppercase tracking-[0.12em] text-slate-300">Desliza para ver todos →</p>
            )}

            {candidatoActual && (
              <div ref={panelRef} className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-indigo-100">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-extrabold text-indigo-700">
                    {candidatoActual.avatar_url ? (
                      <img src={candidatoActual.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      candidatoActual.nombre_completo.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-800">{candidatoActual.nombre_completo}</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {candidatoAsignado ? 'Elige qué funciones conservará en este servicio.' : 'Elige qué hará en este servicio.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCandidato(null)
                      setSeleccion([])
                      setError('')
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400"
                    aria-label="Cerrar selección"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {candidatoActual.capacidades.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                    <p className="text-[10px] leading-4 text-amber-800">
                      Esta persona aún no tiene funciones registradas. Configúralas primero en Ajustes.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidatoActual.capacidades
                      .filter((id) => funcionesPorId.has(id))
                      .map((capacidadId) => {
                        const funcion = funcionesPorId.get(capacidadId)
                        if (!funcion) return null
                        const activa = seleccion.includes(capacidadId)
                        return (
                          <button
                            key={capacidadId}
                            type="button"
                            onClick={() => alternar(capacidadId)}
                            className={`min-h-9 rounded-full px-3 text-[10px] font-extrabold ring-1 transition ${
                              activa
                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                : 'bg-slate-50 text-slate-600 ring-slate-200'
                            }`}
                          >
                            {activa ? '✓ ' : ''}{funcion.nombre}
                          </button>
                        )
                      })}
                  </div>
                )}

                {error && (
                  <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>
                )}

                <button
                  type="button"
                  onClick={() => void guardar(candidatoActual.id, seleccion)}
                  disabled={guardando === candidatoActual.id || (!candidatoAsignado && seleccion.length === 0)}
                  className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold transition disabled:bg-slate-300 ${
                    candidatoAsignado && seleccion.length === 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {guardando === candidatoActual.id
                    ? 'Guardando...'
                    : candidatoAsignado && seleccion.length === 0
                      ? 'Quitar del servicio'
                      : candidatoAsignado
                        ? 'Guardar selección'
                        : 'Agregar al servicio'}
                </button>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-500">Sirven en este servicio</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {integrantesActivos.length ? 'Toca una persona o deslízala a la izquierda para ver acciones.' : 'Todavía no has agregado integrantes.'}
                </p>
              </div>
              {integrantesActivos.length > 0 && (
                <span className="text-[9px] font-bold text-slate-400">{totalFuncionesServicio} funciones</span>
              )}
            </div>

            {integrantesActivos.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 text-center">
                <Users className="mx-auto h-5 w-5 text-indigo-300" />
                <p className="mt-2 text-xs font-bold text-slate-600">Equipo todavía vacío</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">Selecciona personas desde la fila de integrantes de arriba.</p>
              </div>
            ) : (
              <div className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                {integrantesActivos.map((miembro, index) => {
                  const capacidades = capacidadesActivasPorPersona.get(miembro.id) || []
                  const nombres = capacidades.map((id) => funcionesPorId.get(id)?.nombre).filter(Boolean)
                  const estados = estadosActivosPorPersona.get(miembro.id) || []
                  const estado = resumenEstado(estados)
                  const accionesVisibles = accionesAbiertas === miembro.id

                  return (
                    <div key={miembro.id} className={index ? 'border-t border-slate-100' : ''}>
                      <div className="relative overflow-hidden bg-white">
                        <div className="absolute inset-y-0 right-0 flex w-[132px]">
                          <button
                            type="button"
                            onClick={() => abrirPersona(miembro.id)}
                            className="flex w-[66px] flex-col items-center justify-center gap-1 bg-indigo-500 text-white"
                            aria-label={`Editar funciones de ${miembro.nombre_completo}`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="text-[9px] font-extrabold">Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void guardar(miembro.id, [])}
                            disabled={guardando === miembro.id}
                            className="flex w-[66px] flex-col items-center justify-center gap-1 bg-rose-500 text-white disabled:opacity-60"
                            aria-label={`Quitar a ${miembro.nombre_completo} de este servicio`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-[9px] font-extrabold">Quitar</span>
                          </button>
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onTouchStart={(event) => iniciarSwipe(miembro.id, event.touches[0]?.clientX || 0, event.touches[0]?.clientY || 0)}
                          onTouchEnd={(event) => terminarSwipe(miembro.id, event.changedTouches[0]?.clientX || 0, event.changedTouches[0]?.clientY || 0)}
                          onTouchCancel={() => { touchInicio.current = null }}
                          onClick={() => {
                            if (ignorarClick.current) return
                            if (accionesVisibles) {
                              setAccionesAbiertas(null)
                              return
                            }
                            abrirPersona(miembro.id)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') abrirPersona(miembro.id)
                          }}
                          className="relative flex min-h-[68px] w-full cursor-pointer items-center gap-3 bg-white px-3 py-2.5 text-left transition-transform duration-200 ease-out"
                          style={{
                            transform: accionesVisibles ? 'translateX(-132px)' : 'translateX(0)',
                            touchAction: 'pan-y',
                          }}
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700 ring-2 ring-emerald-100">
                            {miembro.avatar_url ? (
                              <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              miembro.nombre_completo.charAt(0)
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-slate-800">{miembro.nombre_completo}</span>
                            <span className="mt-0.5 block truncate text-[10px] font-semibold text-indigo-500">{nombres.join(' · ')}</span>
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${
                            estado === 'confirmado'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              : 'bg-amber-50 text-amber-700 ring-amber-100'
                          }`}>
                            {estado === 'confirmado' ? 'Confirmado' : 'Por confirmar'}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setAccionesAbiertas((actual) => actual === miembro.id ? null : miembro.id)
                            }}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition active:scale-95"
                            aria-label={`Mostrar acciones de ${miembro.nombre_completo}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <Link
            href={`/ministerios/${ministerioId}/programacion/equipo?mes=${mes}&evento=${eventoId}`}
            className="group flex min-h-[64px] items-center gap-3 rounded-[20px] bg-violet-50 px-3 py-2.5 ring-1 ring-violet-100 transition active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm shadow-violet-200">
              <Settings2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-violet-900">Ajustes</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-violet-500">Funciones y capacidades permanentes del equipo</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-active:translate-x-0.5" />
          </Link>
        </>
      )}
    </div>
  )

  return createPortal(contenido, target)
}
