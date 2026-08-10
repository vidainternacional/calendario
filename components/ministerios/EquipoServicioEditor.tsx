'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Loader2, Plus, Users, X } from 'lucide-react'

type Funcion = {
  id: string
  nombre: string
  categoria: string
}

type Miembro = {
  id: string
  nombre_completo: string
  avatar_url: string | null
  capacidades: string[]
}

type Asignacion = {
  id: string
  profile_id: string
  capacidad_id: string
  estado: string
}

type Props = {
  funciones: Funcion[]
  miembros: Miembro[]
  asignaciones: Asignacion[]
  disponibilidadAction: (formData: FormData) => Promise<unknown>
  asignarAction: (formData: FormData) => Promise<any>
  quitarAction: (formData: FormData) => Promise<unknown>
}

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo guardar el cambio.'
}

export default function EquipoServicioEditor({
  funciones,
  miembros,
  asignaciones: iniciales,
  disponibilidadAction,
  asignarAction,
  quitarAction,
}: Props) {
  const [abierto, setAbierto] = useState<string | null>(() => iniciales[0]?.profile_id || null)
  const [capacidadesPorMiembro, setCapacidadesPorMiembro] = useState<Record<string, string[]>>(() => (
    Object.fromEntries(miembros.map((miembro) => [miembro.id, [...miembro.capacidades]]))
  ))
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(iniciales)
  const [pendiente, setPendiente] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const funcionesPorId = useMemo(() => new Map(funciones.map((funcion) => [funcion.id, funcion])), [funciones])

  const personasAsignadas = useMemo(() => new Set(asignaciones.map((item) => item.profile_id)).size, [asignaciones])

  function estaDisponible(profileId: string, capacidadId: string) {
    return (capacidadesPorMiembro[profileId] || []).includes(capacidadId)
  }

  function asignacionActual(profileId: string, capacidadId: string) {
    return asignaciones.find((item) => item.profile_id === profileId && item.capacidad_id === capacidadId) || null
  }

  async function cambiarDisponibilidad(profileId: string, capacidadId: string) {
    const activo = estaDisponible(profileId, capacidadId)
    const key = `disp:${profileId}:${capacidadId}`
    setPendiente(key)
    setMensaje(null)

    const formData = new FormData()
    formData.set('profile_id', profileId)
    formData.set('capacidad_id', capacidadId)
    formData.set('activo', String(!activo))

    try {
      await disponibilidadAction(formData)
      setCapacidadesPorMiembro((prev) => {
        const actuales = prev[profileId] || []
        return {
          ...prev,
          [profileId]: activo
            ? actuales.filter((id) => id !== capacidadId)
            : Array.from(new Set([...actuales, capacidadId])),
        }
      })
    } catch (error) {
      setMensaje(mensajeError(error))
    } finally {
      setPendiente(null)
    }
  }

  async function cambiarAsignacion(profileId: string, capacidadId: string) {
    const actual = asignacionActual(profileId, capacidadId)
    const key = `servicio:${profileId}:${capacidadId}`
    setPendiente(key)
    setMensaje(null)

    try {
      if (actual) {
        const formData = new FormData()
        formData.set('asignacion_id', actual.id)
        await quitarAction(formData)
        setAsignaciones((prev) => prev.filter((item) => item.id !== actual.id))
        return
      }

      if (!estaDisponible(profileId, capacidadId)) {
        const disponibilidad = new FormData()
        disponibilidad.set('profile_id', profileId)
        disponibilidad.set('capacidad_id', capacidadId)
        disponibilidad.set('activo', 'true')
        await disponibilidadAction(disponibilidad)
        setCapacidadesPorMiembro((prev) => ({
          ...prev,
          [profileId]: Array.from(new Set([...(prev[profileId] || []), capacidadId])),
        }))
      }

      const formData = new FormData()
      formData.set('profile_id', profileId)
      formData.set('capacidad_id', capacidadId)
      const creada = await asignarAction(formData)
      if (!creada?.id) throw new Error('La asignación no devolvió una confirmación válida.')

      setAsignaciones((prev) => [
        ...prev.filter((item) => !(item.profile_id === profileId && item.capacidad_id === capacidadId)),
        {
          id: String(creada.id),
          profile_id: String(creada.profile_id || profileId),
          capacidad_id: String(creada.capacidad_id || capacidadId),
          estado: String(creada.estado || 'asignado'),
        },
      ])
    } catch (error) {
      setMensaje(mensajeError(error))
    } finally {
      setPendiente(null)
    }
  }

  return (
    <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-[#171923]">Equipo de este servicio</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {personasAsignadas} {personasAsignadas === 1 ? 'persona asignada' : 'personas asignadas'} · {asignaciones.length} {asignaciones.length === 1 ? 'función' : 'funciones'}.
          </p>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">Una persona puede servir en varias funciones el mismo día.</p>
        </div>
      </div>

      {mensaje && (
        <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100">
          {mensaje}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        {miembros.length === 0 ? (
          <p className="p-4 text-xs text-slate-500">Todavía no hay integrantes activos en este ministerio.</p>
        ) : miembros.map((miembro, index) => {
          const estaAbierto = abierto === miembro.id
          const disponibles = capacidadesPorMiembro[miembro.id] || []
          const asignadas = asignaciones.filter((item) => item.profile_id === miembro.id)
          const nombresAsignados = asignadas
            .map((item) => funcionesPorId.get(item.capacidad_id)?.nombre)
            .filter(Boolean) as string[]

          return (
            <div key={miembro.id} className={index ? 'border-t border-slate-100' : ''}>
              <button
                type="button"
                onClick={() => setAbierto(estaAbierto ? null : miembro.id)}
                className="flex min-h-[66px] w-full items-center gap-3 px-3 py-2.5 text-left"
                aria-expanded={estaAbierto}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-extrabold text-indigo-600">
                  {miembro.avatar_url
                    ? <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" />
                    : miembro.nombre_completo.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-800">{miembro.nombre_completo}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                    {nombresAsignados.length
                      ? `Este servicio: ${nombresAsignados.join(' · ')}`
                      : `${disponibles.length} ${disponibles.length === 1 ? 'función disponible' : 'funciones disponibles'}`}
                  </span>
                </span>
                {asignadas.length > 0 && (
                  <span className="grid h-7 min-w-7 place-items-center rounded-full bg-emerald-50 px-2 text-[10px] font-extrabold text-emerald-700">
                    {asignadas.length}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${estaAbierto ? 'rotate-180' : ''}`} />
              </button>

              {estaAbierto && (
                <div className="border-t border-slate-100 bg-white p-3">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-700">En este servicio</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">Toca para agregar o quitar. Puedes seleccionar varias.</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">{asignadas.length} activas</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {funciones.map((funcion) => {
                        const actual = asignacionActual(miembro.id, funcion.id)
                        const disponible = estaDisponible(miembro.id, funcion.id)
                        const key = `servicio:${miembro.id}:${funcion.id}`
                        const cargando = pendiente === key
                        return (
                          <button
                            key={funcion.id}
                            type="button"
                            onClick={() => cambiarAsignacion(miembro.id, funcion.id)}
                            disabled={Boolean(pendiente)}
                            aria-pressed={Boolean(actual)}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 transition ${
                              actual
                                ? 'bg-emerald-600 text-white ring-emerald-600'
                                : disponible
                                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                                  : 'bg-white text-slate-400 ring-slate-200'
                            }`}
                          >
                            {cargando
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : actual
                                ? <Check className="h-3 w-3" />
                                : <Plus className="h-3 w-3" />}
                            {funcion.nombre}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-[9px] leading-4 text-slate-400">Si eliges una función que aún no estaba disponible para la persona, VIDA la habilita y la asigna en el mismo toque.</p>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-extrabold text-slate-700">Funciones disponibles</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-400">Define en qué funciones aparecerá esta persona para próximos servicios. Esto no borra asignaciones históricas.</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {funciones.map((funcion) => {
                        const disponible = estaDisponible(miembro.id, funcion.id)
                        const key = `disp:${miembro.id}:${funcion.id}`
                        const cargando = pendiente === key
                        return (
                          <button
                            key={funcion.id}
                            type="button"
                            onClick={() => cambiarDisponibilidad(miembro.id, funcion.id)}
                            disabled={Boolean(pendiente)}
                            aria-pressed={disponible}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 transition ${
                              disponible
                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                : 'bg-slate-50 text-slate-500 ring-slate-100'
                            }`}
                          >
                            {cargando
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : disponible
                                ? <Check className="h-3 w-3" />
                                : <Plus className="h-3 w-3" />}
                            {funcion.nombre}
                            {disponible && !cargando && <X className="ml-0.5 h-3 w-3 opacity-70" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
