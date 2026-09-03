'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Loader2, Plus, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  disponibilidadAction?: (formData: FormData) => Promise<unknown>
  asignarAction: (formData: FormData) => Promise<unknown>
  quitarAction: (formData: FormData) => Promise<unknown>
}

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo guardar el cambio.'
}

export default function EquipoServicioEditor({
  funciones,
  miembros,
  asignaciones,
  asignarAction,
  quitarAction,
}: Props) {
  const router = useRouter()
  const [agregando, setAgregando] = useState(false)
  const [personaSeleccionada, setPersonaSeleccionada] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const funcionesPorId = useMemo(() => new Map(funciones.map((item) => [item.id, item])), [funciones])
  const miembrosPorId = useMemo(() => new Map(miembros.map((item) => [item.id, item])), [miembros])
  const persona = personaSeleccionada ? miembrosPorId.get(personaSeleccionada) || null : null
  const capacidadesPersona = persona
    ? persona.capacidades.map((id) => funcionesPorId.get(id)).filter(Boolean) as Funcion[]
    : []
  const yaAsignadasPersona = new Set(asignaciones.filter((item) => item.profile_id === personaSeleccionada).map((item) => item.capacidad_id))
  const disponiblesParaAgregar = capacidadesPersona.filter((item) => !yaAsignadasPersona.has(item.id))

  const asignar = (profileId: string, capacidadId: string) => {
    setMensaje(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('profile_id', profileId)
        formData.set('capacidad_id', capacidadId)
        await asignarAction(formData)
        setPersonaSeleccionada(null)
        setAgregando(false)
        router.refresh()
      } catch (error) {
        setMensaje(mensajeError(error))
      }
    })
  }

  const quitar = (asignacionId: string) => {
    setMensaje(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('asignacion_id', asignacionId)
        await quitarAction(formData)
        router.refresh()
      } catch (error) {
        setMensaje(mensajeError(error))
      }
    })
  }

  return (
    <div className="text-slate-900">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-500">Equipo del servicio</p>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">{asignaciones.length} {asignaciones.length === 1 ? 'asignación' : 'asignaciones'}</h3>
        </div>
        <button
          type="button"
          onClick={() => { setAgregando((value) => !value); setPersonaSeleccionada(null); setMensaje(null) }}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white"
        >
          {agregando ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {agregando ? 'Cerrar' : 'Agregar'}
        </button>
      </div>

      {mensaje ? <p className="mt-3 border-l-2 border-rose-400 pl-3 text-[11px] font-semibold text-rose-700">{mensaje}</p> : null}

      {agregando ? (
        <div className="mt-4 border-y border-slate-200 py-4">
          <p className="mb-3 text-[11px] font-bold text-slate-500">Desliza y elige una persona.</p>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {miembros.map((miembro) => {
              const seleccionada = personaSeleccionada === miembro.id
              const asignadas = asignaciones.filter((item) => item.profile_id === miembro.id).length
              return (
                <button
                  key={miembro.id}
                  type="button"
                  onClick={() => setPersonaSeleccionada(seleccionada ? null : miembro.id)}
                  className="flex w-[74px] shrink-0 snap-start flex-col items-center text-center"
                  aria-pressed={seleccionada}
                >
                  <span className={`relative grid h-12 w-12 place-items-center overflow-hidden rounded-full text-sm font-extrabold ${seleccionada ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-2' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'}`}>
                    {miembro.avatar_url ? <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" /> : miembro.nombre_completo.charAt(0)}
                    {asignadas > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white ring-2 ring-white">{asignadas}</span> : null}
                  </span>
                  <span className={`mt-2 line-clamp-2 text-[10px] font-bold leading-4 ${seleccionada ? 'text-indigo-700' : 'text-slate-600'}`}>{miembro.nombre_completo}</span>
                </button>
              )
            })}
          </div>

          {persona ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-extrabold text-slate-800">{persona.nombre_completo}</p>
              <p className="mt-1 text-[10px] text-slate-400">Selecciona una de sus funciones habilitadas para este servicio.</p>
              {disponiblesParaAgregar.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {disponiblesParaAgregar.map((funcion) => (
                    <button
                      key={funcion.id}
                      type="button"
                      disabled={pending}
                      onClick={() => asignar(persona.id, funcion.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-indigo-50 px-3 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-100 disabled:opacity-50"
                    >
                      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      {funcion.nombre}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[10px] text-slate-400">{persona.capacidades.length ? 'Todas sus funciones ya están asignadas en este servicio.' : 'Esta persona todavía no tiene funciones configuradas.'}</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {asignaciones.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">Todavía no hay integrantes asignados.</p>
        ) : asignaciones.map((asignacion) => {
          const miembro = miembrosPorId.get(asignacion.profile_id)
          const funcion = funcionesPorId.get(asignacion.capacidad_id)
          return (
            <div key={asignacion.id} className="flex min-h-[60px] items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                {miembro?.avatar_url ? <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" /> : (miembro?.nombre_completo || 'S').charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-800">{miembro?.nombre_completo || 'Servidor'}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-indigo-600">{funcion?.nombre || 'Sin función'}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => quitar(asignacion.id)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition active:bg-rose-50 active:text-rose-600 disabled:opacity-40"
                aria-label="Quitar del servicio"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400"><Check className="h-3.5 w-3.5" /> Aquí solo programas este servicio; las funciones permanentes se administran aparte.</p>
    </div>
  )
}
