'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'

export type DisponibilidadFuncion = { id: string; nombre: string; categoria: string }
export type DisponibilidadMiembro = { id: string; nombre_completo: string; avatar_url: string | null; capacidades: string[] }

type Props = {
  funciones: DisponibilidadFuncion[]
  miembros: DisponibilidadMiembro[]
  guardarAction: (profileId: string, formData: FormData) => Promise<{ profileId: string; capacidades: string[] } | void>
}

type Estado = 'idle' | 'saving' | 'saved' | 'error'

export default function DisponibilidadEquipoEditor({ funciones, miembros, guardarAction }: Props) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>(() => Object.fromEntries(miembros.map((item) => [item.id, [...item.capacidades]])))
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})
  const funcionesPorId = useMemo(() => new Map(funciones.map((item) => [item.id, item])), [funciones])

  function alternar(profileId: string, capacidadId: string) {
    setSeleccion((prev) => {
      const actuales = prev[profileId] || []
      return { ...prev, [profileId]: actuales.includes(capacidadId) ? actuales.filter((id) => id !== capacidadId) : [...actuales, capacidadId] }
    })
    setEstados((prev) => ({ ...prev, [profileId]: 'idle' }))
  }

  async function guardar(profileId: string) {
    const formData = new FormData()
    for (const capacidadId of seleccion[profileId] || []) formData.append('capacidad_id', capacidadId)
    setEstados((prev) => ({ ...prev, [profileId]: 'saving' }))
    setErrores((prev) => ({ ...prev, [profileId]: '' }))
    try {
      const result = await guardarAction(profileId, formData)
      if (result?.capacidades) setSeleccion((prev) => ({ ...prev, [profileId]: result.capacidades }))
      setEstados((prev) => ({ ...prev, [profileId]: 'saved' }))
      window.setTimeout(() => setEstados((prev) => ({ ...prev, [profileId]: 'idle' })), 2600)
    } catch (error) {
      setEstados((prev) => ({ ...prev, [profileId]: 'error' }))
      setErrores((prev) => ({ ...prev, [profileId]: error instanceof Error ? error.message : 'No se guardaron los cambios.' }))
    }
  }

  return (
    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Users className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-slate-900">Disponibilidad de funciones</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Define qué funciones puede realizar cada integrante. La selección para cada servicio se hace después, dentro de Programación.</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        {miembros.length === 0 ? (
          <p className="p-4 text-xs text-slate-500">No hay integrantes activos en este ministerio.</p>
        ) : miembros.map((miembro, index) => {
          const elegidas = seleccion[miembro.id] || []
          const abiertoAhora = abierto === miembro.id
          const estado = estados[miembro.id] || 'idle'
          return (
            <div key={miembro.id} className={index ? 'border-t border-slate-100' : ''}>
              <button type="button" onClick={() => setAbierto(abiertoAhora ? null : miembro.id)} className="flex min-h-[62px] w-full items-center gap-3 px-3 py-2.5 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white font-extrabold text-indigo-600 ring-1 ring-slate-100">
                  {miembro.avatar_url ? <img src={miembro.avatar_url} alt="" className="h-full w-full object-cover" /> : miembro.nombre_completo.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-800">{miembro.nombre_completo}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">{elegidas.length ? elegidas.map((id) => funcionesPorId.get(id)?.nombre).filter(Boolean).join(' · ') : 'Sin funciones disponibles'}</span>
                </span>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-extrabold text-slate-500 ring-1 ring-slate-100">{elegidas.length}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${abiertoAhora ? 'rotate-180' : ''}`} />
              </button>

              {abiertoAhora && (
                <div className="border-t border-slate-100 bg-white p-3">
                  <div className="flex flex-wrap gap-2">
                    {funciones.map((funcion) => {
                      const activa = elegidas.includes(funcion.id)
                      return (
                        <button key={funcion.id} type="button" onClick={() => alternar(miembro.id, funcion.id)} className={`min-h-9 rounded-full px-3 text-[10px] font-extrabold ring-1 ${activa ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                          {activa ? '✓ ' : ''}{funcion.nombre}
                        </button>
                      )
                    })}
                  </div>
                  {errores[miembro.id] && <p className="mt-2 rounded-xl bg-rose-50 p-2 text-[10px] font-semibold text-rose-700">{errores[miembro.id]}</p>}
                  <button type="button" onClick={() => guardar(miembro.id)} disabled={estado === 'saving'} className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold ${estado === 'saved' ? 'bg-emerald-600 text-white' : estado === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {estado === 'saved' && <Check className="h-4 w-4" />}
                    {estado === 'saving' ? 'Guardando...' : estado === 'saved' ? 'Guardado' : estado === 'error' ? 'Reintentar' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
