'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus, Settings2, UserMinus, Users, X } from 'lucide-react'
import {
  guardarEquipoPersonaServicio,
  obtenerDatosEquipoServicio,
  type DatosEquipoServicio,
} from '@/app/actions/equipo-ministerial'

type Estado = 'idle' | 'saving' | 'saved' | 'error'

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
}

export default function EquipoServicioInline() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const eventoId = searchParams.get('evento') || ''
  const mes = searchParams.get('mes') || ''

  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [datos, setDatos] = useState<DatosEquipoServicio | null>(null)
  const [guardado, setGuardado] = useState<Record<string, string[]>>({})
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({})
  const [editando, setEditando] = useState<string | null>(null)
  const [candidato, setCandidato] = useState<string | null>(null)
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    setTarget(null)
    setDatos(null)
    setGuardado({})
    setSeleccion({})
    setEditando(null)
    setCandidato(null)
    setEstados({})
    setErrores({})

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

    let vigente = true
    obtenerDatosEquipoServicio(ministerioId, eventoId)
      .then((respuesta) => {
        if (!vigente) return
        setDatos(respuesta)
        const inicial: Record<string, string[]> = {}
        for (const miembro of respuesta.miembros) inicial[miembro.id] = []
        for (const asignacion of respuesta.asignaciones) {
          inicial[asignacion.profile_id] = Array.from(
            new Set([...(inicial[asignacion.profile_id] || []), asignacion.capacidad_id]),
          )
        }
        setGuardado(inicial)
        setSeleccion(
          Object.fromEntries(
            Object.entries(inicial).map(([profileId, capacidades]) => [profileId, [...capacidades]]),
          ),
        )
      })
      .catch((error) => {
        if (vigente) setErrores({ general: mensajeError(error) })
      })

    return () => {
      vigente = false
      Array.from(body.children).forEach((child) => {
        const element = child as HTMLElement
        delete element.dataset.equipoLegacy
      })
      mount?.remove()
    }
  }, [ministerioId, eventoId])

  const funcionesPorId = useMemo(
    () => new Map((datos?.funciones || []).map((funcion) => [funcion.id, funcion])),
    [datos],
  )

  const integrantesActivos = useMemo(() => {
    if (!datos) return []
    return datos.miembros.filter((miembro) => (guardado[miembro.id] || []).length > 0)
  }, [datos, guardado])

  // El banco siempre muestra a TODOS los integrantes del ministerio.
  // Los ya asignados permanecen visibles con un check para poder editarlos desde arriba.
  const bancoIntegrantes = useMemo(() => datos?.miembros || [], [datos])

  const totalFuncionesServicio = useMemo(
    () => Object.values(guardado).reduce((total, capacidades) => total + capacidades.length, 0),
    [guardado],
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

  function abrirEdicion(profileId: string) {
    setCandidato(null)
    setEditando((actual) => (actual === profileId ? null : profileId))
    setSeleccion((prev) => ({ ...prev, [profileId]: [...(guardado[profileId] || [])] }))
    setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
    setErrores((prev) => ({ ...prev, [profileId]: '' }))
  }

  function abrirCandidato(profileId: string) {
    setEditando(null)
    const seCierra = candidato === profileId
    setCandidato(seCierra ? null : profileId)
    if (!seCierra) {
      setSeleccion((prev) => ({ ...prev, [profileId]: [...(guardado[profileId] || [])] }))
      setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
      setErrores((prev) => ({ ...prev, [profileId]: '' }))
    }
  }

  function alternar(profileId: string, capacidadId: string) {
    setSeleccion((prev) => {
      const actuales = prev[profileId] || []
      return {
        ...prev,
        [profileId]: actuales.includes(capacidadId)
          ? actuales.filter((id) => id !== capacidadId)
          : [...actuales, capacidadId],
      }
    })
    setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
    setErrores((prev) => ({ ...prev, [profileId]: '' }))
  }

  async function persistir(profileId: string, capacidades: string[], modo: 'agregar' | 'editar' | 'quitar') {
    if (!ministerioId || !eventoId) return
    const formData = new FormData()
    for (const capacidadId of capacidades) formData.append('capacidad_id', capacidadId)

    setEstados((prev) => ({ ...prev, [profileId]: 'saving' }))
    setErrores((prev) => ({ ...prev, [profileId]: '' }))

    try {
      const result = await guardarEquipoPersonaServicio(ministerioId, eventoId, profileId, formData)
      setGuardado((prev) => ({ ...prev, [profileId]: [...result.capacidades] }))
      setSeleccion((prev) => ({ ...prev, [profileId]: [...result.capacidades] }))
      setEstados((prev) => ({ ...prev, [profileId]: 'saved' }))

      if (candidato === profileId) setCandidato(null)
      if (modo === 'quitar') setEditando(null)

      window.setTimeout(() => {
        setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
      }, 2600)
    } catch (error) {
      setEstados((prev) => ({ ...prev, [profileId]: 'error' }))
      setErrores((prev) => ({ ...prev, [profileId]: mensajeError(error) }))
    }
  }

  if (!target) return null

  const candidatoActual = datos?.miembros.find((miembro) => miembro.id === candidato) || null
  const candidatoYaAsignado = candidatoActual ? (guardado[candidatoActual.id] || []).length > 0 : false

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
              Elige arriba entre todos los integrantes. Abajo quedan únicamente quienes servirán en esta fecha.
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-100">
            {integrantesActivos.length}
          </span>
        </div>
      </div>

      {errores.general && (
        <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
          {errores.general}
        </p>
      )}

      {!datos ? (
        <p className="rounded-xl bg-white p-4 text-xs text-slate-400 ring-1 ring-slate-100">Cargando equipo...</p>
      ) : (
        <>
          <section className="rounded-[22px] bg-slate-100/80 p-3 ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Integrantes</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Toca una persona para agregarla o editar lo que hará.</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-slate-500 ring-1 ring-slate-200">
                {bancoIntegrantes.length} integrantes
              </span>
            </div>

            {bancoIntegrantes.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white p-3 text-center text-[10px] font-semibold text-slate-500 ring-1 ring-slate-100">
                Todavía no hay integrantes activos en este ministerio.
              </p>
            ) : (
              <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {bancoIntegrantes.map((miembro) => {
                  const abierto = candidato === miembro.id
                  const yaAsignado = (guardado[miembro.id] || []).length > 0
                  const nombresCapacidades = miembro.capacidades
                    .map((id) => funcionesPorId.get(id)?.nombre)
                    .filter(Boolean)

                  return (
                    <button
                      key={miembro.id}
                      type="button"
                      onClick={() => abrirCandidato(miembro.id)}
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
                            yaAsignado ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                          }`}
                          aria-hidden="true"
                        >
                          {yaAsignado ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                        </span>
                      </span>

                      <span className={`mt-1 block truncate text-[9px] font-extrabold ${abierto ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {miembro.nombre_completo.split(' ')[0]}
                      </span>
                      <span className="mt-0.5 block truncate text-[8px] text-slate-400">
                        {yaAsignado
                          ? 'Seleccionado'
                          : nombresCapacidades.length
                            ? `${nombresCapacidades.length} ${nombresCapacidades.length === 1 ? 'función' : 'funciones'}`
                            : 'Sin función'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {bancoIntegrantes.length > 3 && (
              <p className="mt-0 text-right text-[8px] font-bold uppercase tracking-[0.12em] text-slate-300">
                Desliza para ver todos →
              </p>
            )}

            {candidatoActual && (
              <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-indigo-100">
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
                      {candidatoYaAsignado ? 'Edita lo que hará en este servicio.' : 'Elige qué hará en este servicio.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCandidato(null)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400"
                    aria-label="Cerrar selección"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {candidatoActual.capacidades.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                    <p className="text-[10px] leading-4 text-amber-800">
                      Esta persona aún no tiene funciones/capacidades registradas. Configúralas primero en Ajustes.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidatoActual.capacidades
                      .filter((id) => funcionesPorId.has(id))
                      .map((capacidadId) => {
                        const funcion = funcionesPorId.get(capacidadId)
                        if (!funcion) return null
                        const activa = (seleccion[candidatoActual.id] || []).includes(capacidadId)
                        return (
                          <button
                            key={capacidadId}
                            type="button"
                            onClick={() => alternar(candidatoActual.id, capacidadId)}
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

                {errores[candidatoActual.id] && (
                  <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700">
                    {errores[candidatoActual.id]}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    persistir(
                      candidatoActual.id,
                      seleccion[candidatoActual.id] || [],
                      candidatoYaAsignado ? 'editar' : 'agregar',
                    )
                  }
                  disabled={
                    (estados[candidatoActual.id] || 'idle') === 'saving' ||
                    (seleccion[candidatoActual.id] || []).length === 0
                  }
                  className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold transition ${
                    (estados[candidatoActual.id] || 'idle') === 'saved'
                      ? 'bg-emerald-600 text-white'
                      : (estados[candidatoActual.id] || 'idle') === 'error'
                        ? 'bg-rose-600 text-white'
                        : 'bg-indigo-600 text-white disabled:bg-slate-300'
                  }`}
                >
                  {(estados[candidatoActual.id] || 'idle') === 'saved' && <Check className="h-4 w-4" />}
                  {(estados[candidatoActual.id] || 'idle') === 'saving'
                    ? 'Guardando...'
                    : (estados[candidatoActual.id] || 'idle') === 'saved'
                      ? 'Guardado'
                      : (estados[candidatoActual.id] || 'idle') === 'error'
                        ? 'Reintentar'
                        : candidatoYaAsignado
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
                  {integrantesActivos.length ? 'Toca una persona para editar sus funciones.' : 'Todavía no has agregado integrantes.'}
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
                  const elegidasGuardadas = guardado[miembro.id] || []
                  const editandoAhora = editando === miembro.id
                  const elegidasEdicion = seleccion[miembro.id] || []
                  const opciones = Array.from(new Set([...miembro.capacidades, ...elegidasGuardadas])).filter((id) => funcionesPorId.has(id))
                  const estado = estados[miembro.id] || 'idle'
                  const nombres = elegidasGuardadas.map((id) => funcionesPorId.get(id)?.nombre).filter(Boolean)

                  return (
                    <div key={miembro.id} className={index ? 'border-t border-slate-100' : ''}>
                      <button
                        type="button"
                        onClick={() => abrirEdicion(miembro.id)}
                        className="flex min-h-[64px] w-full items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700 ring-2 ring-emerald-100">
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
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700">Asignado</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${editandoAhora ? 'rotate-180' : ''}`} />
                      </button>

                      {editandoAhora && (
                        <div className="border-t border-slate-100 bg-slate-50/80 p-3">
                          <p className="text-[10px] font-bold text-slate-500">Funciones para este servicio</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {opciones.map((capacidadId) => {
                              const funcion = funcionesPorId.get(capacidadId)
                              if (!funcion) return null
                              const activa = elegidasEdicion.includes(capacidadId)
                              return (
                                <button
                                  key={capacidadId}
                                  type="button"
                                  onClick={() => alternar(miembro.id, capacidadId)}
                                  className={`min-h-9 rounded-full px-3 text-[10px] font-extrabold ring-1 transition ${
                                    activa
                                      ? 'bg-indigo-600 text-white ring-indigo-600'
                                      : 'bg-white text-slate-600 ring-slate-200'
                                  }`}
                                >
                                  {activa ? '✓ ' : ''}{funcion.nombre}
                                </button>
                              )
                            })}
                          </div>

                          {errores[miembro.id] && (
                            <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700">
                              {errores[miembro.id]}
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                            <button
                              type="button"
                              onClick={() => persistir(miembro.id, elegidasEdicion, 'editar')}
                              disabled={estado === 'saving' || elegidasEdicion.length === 0}
                              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-extrabold transition ${
                                estado === 'saved'
                                  ? 'bg-emerald-600 text-white'
                                  : estado === 'error'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-900 text-white disabled:bg-slate-300'
                              }`}
                            >
                              {estado === 'saved' && <Check className="h-4 w-4" />}
                              {estado === 'saving'
                                ? 'Guardando...'
                                : estado === 'saved'
                                  ? 'Guardado'
                                  : estado === 'error'
                                    ? 'Reintentar'
                                    : 'Guardar cambios'}
                            </button>
                            <button
                              type="button"
                              onClick={() => persistir(miembro.id, [], 'quitar')}
                              disabled={estado === 'saving'}
                              className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 disabled:opacity-50"
                              aria-label={`Quitar a ${miembro.nombre_completo} de este servicio`}
                              title="Quitar del servicio"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-2 text-right text-[9px] font-semibold text-rose-400">El botón rojo quita a la persona solo de este servicio.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <Link
            href={`/ministerios/${ministerioId}/programacion/equipo?mes=${mes}&evento=${eventoId}`}
            className="flex min-h-11 items-center justify-between rounded-xl bg-white px-3 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200"
          >
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-600" /> Ajustes de funciones y capacidades
            </span>
            <span className="text-slate-400">›</span>
          </Link>
        </>
      )}
    </div>
  )

  return createPortal(contenido, target)
}
