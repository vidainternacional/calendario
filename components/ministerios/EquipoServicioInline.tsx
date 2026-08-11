'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Settings2, Users } from 'lucide-react'
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
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [ministerioId, setMinisterioId] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [mes, setMes] = useState('')
  const [datos, setDatos] = useState<DatosEquipoServicio | null>(null)
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({})
  const [abierto, setAbierto] = useState<string | null>(null)
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    const match = window.location.pathname.match(/\/ministerios\/([^/]+)\/programacion/)
    const params = new URLSearchParams(window.location.search)
    const evento = params.get('evento') || ''
    const mesActual = params.get('mes') || ''
    if (!match?.[1] || !evento) return

    setMinisterioId(match[1])
    setEventoId(evento)
    setMes(mesActual)

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
    obtenerDatosEquipoServicio(match[1], evento)
      .then((respuesta) => {
        if (!vigente) return
        setDatos(respuesta)
        const inicial: Record<string, string[]> = {}
        for (const miembro of respuesta.miembros) inicial[miembro.id] = []
        for (const asignacion of respuesta.asignaciones) {
          inicial[asignacion.profile_id] = [...(inicial[asignacion.profile_id] || []), asignacion.capacidad_id]
        }
        setSeleccion(inicial)
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
  }, [])

  const funcionesPorId = useMemo(() => new Map((datos?.funciones || []).map((funcion) => [funcion.id, funcion])), [datos])
  const integrantesSeleccionados = useMemo(() => Object.values(seleccion).filter((roles) => roles.length > 0).length, [seleccion])

  useEffect(() => {
    if (!datos) return
    const summary = document.querySelector('#servicio-activo > details:nth-of-type(1) > summary')
    const textWrapper = summary?.children?.[1]
    const subtitle = textWrapper?.children?.[1]
    if (subtitle) subtitle.textContent = `${integrantesSeleccionados} ${integrantesSeleccionados === 1 ? 'integrante seleccionado' : 'integrantes seleccionados'}`
  }, [datos, integrantesSeleccionados])

  function alternar(profileId: string, capacidadId: string) {
    setSeleccion((prev) => {
      const actuales = prev[profileId] || []
      return {
        ...prev,
        [profileId]: actuales.includes(capacidadId) ? actuales.filter((id) => id !== capacidadId) : [...actuales, capacidadId],
      }
    })
    setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
  }

  async function guardar(profileId: string) {
    if (!ministerioId || !eventoId) return
    const formData = new FormData()
    for (const capacidadId of seleccion[profileId] || []) formData.append('capacidad_id', capacidadId)
    setEstados((prev) => ({ ...prev, [profileId]: 'saving' }))
    setErrores((prev) => ({ ...prev, [profileId]: '' }))
    try {
      const result = await guardarEquipoPersonaServicio(ministerioId, eventoId, profileId, formData)
      setSeleccion((prev) => ({ ...prev, [profileId]: result.capacidades }))
      setEstados((prev) => ({ ...prev, [profileId]: 'saved' }))
      window.setTimeout(() => setEstados((prev) => ({ ...prev, [profileId]: 'idle' })), 2600)
    } catch (error) {
      setEstados((prev) => ({ ...prev, [profileId]: 'error' }))
      setErrores((prev) => ({ ...prev, [profileId]: mensajeError(error) }))
    }
  }

  if (!target) return null

  const contenido = (
    <div className="space-y-3">
      <div className="rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-indigo-600 ring-1 ring-indigo-100"><Users className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-800">Selecciona quién servirá en esta fecha</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">Cada persona aparece una sola vez. Puedes elegir una o varias funciones para el mismo servicio.</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-100">{integrantesSeleccionados}</span>
        </div>
      </div>

      {errores.general && <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">{errores.general}</p>}

      {!datos ? (
        <p className="rounded-xl bg-white p-4 text-xs text-slate-400 ring-1 ring-slate-100">Cargando equipo...</p>
      ) : datos.miembros.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-xs text-slate-500 ring-1 ring-slate-100">Todavía no hay integrantes activos en este ministerio.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {datos.miembros.map((miembro, index) => {
            const elegidas = seleccion[miembro.id] || []
            const opciones = Array.from(new Set([...miembro.capacidades, ...elegidas])).filter((id) => funcionesPorId.has(id))
            const abiertoAhora = abierto === miembro.id
            const estado = estados[miembro.id] || 'idle'
            return (
              <div key={miembro.id} className={index ? 'border-t border-slate-100' : ''}>
                <button type="button" onClick={() => setAbierto(abiertoAhora ? null : miembro.id)} className="flex min-h-[62px] w-full items-center gap-3 px-3 py-2.5 text-left">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700">
                    {miembro.avatar_url ? <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" /> : miembro.nombre_completo.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-800">{miembro.nombre_completo}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                      {elegidas.length ? elegidas.map((id) => funcionesPorId.get(id)?.nombre).filter(Boolean).join(' · ') : opciones.length ? 'Disponible · toca para seleccionar' : 'Sin roles disponibles'}
                    </span>
                  </span>
                  {elegidas.length > 0 && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700">{elegidas.length}</span>}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abiertoAhora ? 'rotate-180' : ''}`} />
                </button>

                {abiertoAhora && (
                  <div className="border-t border-slate-100 bg-slate-50/80 p-3">
                    {opciones.length === 0 ? (
                      <p className="rounded-xl bg-white p-3 text-[11px] leading-5 text-slate-500 ring-1 ring-slate-100">Primero asigna roles disponibles a esta persona desde Ajustes.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {opciones.map((capacidadId) => {
                          const funcion = funcionesPorId.get(capacidadId)
                          if (!funcion) return null
                          const activa = elegidas.includes(capacidadId)
                          return (
                            <button key={capacidadId} type="button" onClick={() => alternar(miembro.id, capacidadId)} className={`min-h-9 rounded-full px-3 text-[10px] font-extrabold ring-1 transition ${activa ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200'}`}>
                              {activa ? '✓ ' : ''}{funcion.nombre}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {errores[miembro.id] && <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700">{errores[miembro.id]}</p>}
                    <button type="button" onClick={() => guardar(miembro.id)} disabled={estado === 'saving' || opciones.length === 0} className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold transition ${estado === 'saved' ? 'bg-emerald-600 text-white' : estado === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white disabled:bg-slate-300'}`}>
                      {estado === 'saved' && <Check className="h-4 w-4" />}
                      {estado === 'saving' ? 'Guardando...' : estado === 'saved' ? 'Guardado' : estado === 'error' ? 'Reintentar' : elegidas.length ? 'Guardar selección' : 'Guardar sin asignar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Link href={`/ministerios/${ministerioId}/programacion/equipo?mes=${mes}&evento=${eventoId}`} className="flex min-h-11 items-center justify-between rounded-xl bg-white px-3 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
        <span className="inline-flex items-center gap-2"><Settings2 className="h-4 w-4 text-indigo-600" /> Ajustes de roles y disponibilidad</span>
        <span className="text-slate-400">›</span>
      </Link>
    </div>
  )

  return createPortal(contenido, target)
}
