'use client'

import { FormEvent, useState } from 'react'
import { Check, PencilLine, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'

type Funcion = { id: string; nombre: string; categoria?: string | null; activo: boolean }
type Props = {
  funciones: Funcion[]
  crearAction: (formData: FormData) => void | Promise<void>
  editarAction: (formData: FormData) => void | Promise<void>
  estadoAction: (formData: FormData) => void | Promise<void>
  eliminarAction: (formData: FormData) => void | Promise<void>
}
type Estado = 'idle' | 'saving' | 'saved' | 'error'

function textoError(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la acción.'
}

export default function FuncionesAlabanzaEditor({ funciones, crearAction, editarAction, estadoAction, eliminarAction }: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [estadoEdicion, setEstadoEdicion] = useState<Record<string, Estado>>({})
  const [estadoCreacion, setEstadoCreacion] = useState<Estado>('idle')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setEstadoCreacion('saving')
    try {
      await crearAction(new FormData(form))
      setEstadoCreacion('saved')
      form.reset()
      window.setTimeout(() => { setEstadoCreacion('idle'); setCreando(false) }, 1800)
    } catch (error) {
      setEstadoCreacion('error')
      setErrores((prev) => ({ ...prev, crear: textoError(error) }))
    }
  }

  async function guardar(event: FormEvent<HTMLFormElement>, funcionId: string) {
    event.preventDefault()
    setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'saving' }))
    setErrores((prev) => ({ ...prev, [funcionId]: '' }))
    try {
      await editarAction(new FormData(event.currentTarget))
      setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'saved' }))
      window.setTimeout(() => setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'idle' })), 2600)
    } catch (error) {
      setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'error' }))
      setErrores((prev) => ({ ...prev, [funcionId]: textoError(error) }))
    }
  }

  async function cambiarEstado(funcion: Funcion) {
    const data = new FormData()
    data.set('funcion_id', funcion.id)
    data.set('activo', funcion.activo ? 'false' : 'true')
    setEstadoEdicion((prev) => ({ ...prev, [funcion.id]: 'saving' }))
    try {
      await estadoAction(data)
      setEstadoEdicion((prev) => ({ ...prev, [funcion.id]: 'saved' }))
      window.setTimeout(() => setEstadoEdicion((prev) => ({ ...prev, [funcion.id]: 'idle' })), 2200)
    } catch (error) {
      setEstadoEdicion((prev) => ({ ...prev, [funcion.id]: 'error' }))
      setErrores((prev) => ({ ...prev, [funcion.id]: textoError(error) }))
    }
  }

  async function eliminar(funcionId: string) {
    const data = new FormData()
    data.set('funcion_id', funcionId)
    setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'saving' }))
    setErrores((prev) => ({ ...prev, [funcionId]: '' }))
    try {
      await eliminarAction(data)
      setConfirmandoEliminar(null)
      setEditando(null)
    } catch (error) {
      setEstadoEdicion((prev) => ({ ...prev, [funcionId]: 'error' }))
      setErrores((prev) => ({ ...prev, [funcionId]: textoError(error) }))
      setConfirmandoEliminar(null)
    }
  }

  return (
    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Settings2 className="h-5 w-5 shrink-0 text-indigo-500" />
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#171923]">Funciones del ministerio</h2>
            <p className="text-xs text-slate-500">Crea, edita o retira funciones. Eliminar solo está disponible si nunca se ha usado.</p>
          </div>
        </div>
        <button type="button" onClick={() => { setCreando((value) => !value); setEditando(null) }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600" aria-label="Agregar función">{creando ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
      </div>

      {creando && (
        <form onSubmit={crear} className="mt-4 grid gap-2 rounded-2xl bg-indigo-50/60 p-3 ring-1 ring-indigo-100">
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nombre de la función<input name="nombre" required placeholder="Ej.: Guitarra principal" className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 ring-1 ring-slate-100" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Categoría<input name="categoria" defaultValue="Instrumentos" placeholder="Instrumentos, voces, técnica..." className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-xs text-slate-900 ring-1 ring-slate-100" /></label>
          {errores.crear && <p className="rounded-xl bg-rose-50 p-2 text-[10px] font-semibold text-rose-700">{errores.crear}</p>}
          <button disabled={estadoCreacion === 'saving'} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold ${estadoCreacion === 'saved' ? 'bg-emerald-600 text-white' : estadoCreacion === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
            {estadoCreacion === 'saved' && <Check className="h-4 w-4" />}
            {estadoCreacion === 'saving' ? 'Guardando...' : estadoCreacion === 'saved' ? 'Guardado' : estadoCreacion === 'error' ? 'Reintentar' : 'Agregar función'}
          </button>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        {funciones.length === 0 ? <p className="p-4 text-center text-xs text-slate-400">Todavía no hay funciones configuradas.</p> : funciones.map((funcion, index) => {
          const estado = estadoEdicion[funcion.id] || 'idle'
          return (
            <div key={funcion.id} className={index ? 'border-t border-slate-100' : ''}>
              <div className="flex min-h-[58px] items-center gap-3 px-3 py-2.5">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${funcion.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${funcion.activo ? 'text-slate-800' : 'text-slate-400'}`}>{funcion.nombre}</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{funcion.categoria || 'Servicio'} · {funcion.activo ? 'Activa' : 'Retirada'}</p>
                </div>
                <button type="button" onClick={() => { setEditando(editando === funcion.id ? null : funcion.id); setCreando(false); setConfirmandoEliminar(null) }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"><PencilLine className="h-3.5 w-3.5" />Editar</button>
              </div>

              {editando === funcion.id && (
                <div className="border-t border-slate-100 bg-white p-3">
                  <form onSubmit={(event) => guardar(event, funcion.id)} className="grid gap-2">
                    <input type="hidden" name="funcion_id" value={funcion.id} />
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nombre<input name="nombre" defaultValue={funcion.nombre} required className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-900 ring-1 ring-slate-100" /></label>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Categoría<input name="categoria" defaultValue={funcion.categoria || 'Servicio'} className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs text-slate-900 ring-1 ring-slate-100" /></label>
                    {errores[funcion.id] && <p className="rounded-xl bg-rose-50 p-2 text-[10px] font-semibold leading-4 text-rose-700">{errores[funcion.id]}</p>}
                    <button disabled={estado === 'saving'} className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold ${estado === 'saved' ? 'bg-emerald-600 text-white' : estado === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
                      {estado === 'saved' && <Check className="h-4 w-4" />}
                      {estado === 'saving' ? 'Guardando...' : estado === 'saved' ? 'Guardado' : estado === 'error' ? 'Reintentar' : 'Guardar cambios'}
                    </button>
                  </form>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => cambiarEstado(funcion)} className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[11px] font-bold ${funcion.activo ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {funcion.activo ? <Trash2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}{funcion.activo ? 'Retirar' : 'Reactivar'}
                    </button>
                    <button type="button" onClick={() => setConfirmandoEliminar(confirmandoEliminar === funcion.id ? null : funcion.id)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 text-[11px] font-bold text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />Eliminar
                    </button>
                  </div>

                  {confirmandoEliminar === funcion.id && (
                    <div className="mt-2 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100">
                      <p className="text-[10px] leading-4 text-rose-700">Eliminar es permanente y solo funciona si esta función nunca se ha usado ni está asignada a integrantes. Si tiene historial, usa Retirar.</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setConfirmandoEliminar(null)} className="h-9 rounded-xl bg-white text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">Cancelar</button>
                        <button type="button" onClick={() => eliminar(funcion.id)} className="h-9 rounded-xl bg-rose-600 text-[10px] font-bold text-white">Confirmar eliminación</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
