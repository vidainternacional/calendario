'use client'

import { useState } from 'react'
import { PencilLine, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'

type Funcion = { id: string; nombre: string; categoria?: string | null; activo: boolean }
type Props = {
  funciones: Funcion[]
  crearAction: (formData: FormData) => void | Promise<void>
  editarAction: (formData: FormData) => void | Promise<void>
  estadoAction: (formData: FormData) => void | Promise<void>
}

export default function FuncionesAlabanzaEditor({ funciones, crearAction, editarAction, estadoAction }: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  return (
    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2"><Settings2 className="h-5 w-5 shrink-0 text-indigo-500" /><div className="min-w-0"><h2 className="text-sm font-extrabold text-[#171923]">Funciones de Alabanza</h2><p className="text-xs text-slate-500">Define las funciones que usas al programar.</p></div></div>
        <button type="button" onClick={() => { setCreando((value) => !value); setEditando(null) }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600" aria-label="Agregar función">{creando ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
      </div>

      {creando && <form action={crearAction} className="mt-4 grid gap-2 rounded-2xl bg-indigo-50/60 p-3 ring-1 ring-indigo-100">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nombre de la función<input name="nombre" required placeholder="Ej.: Guitarra principal" className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-xs font-semibold ring-1 ring-slate-100" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Categoría<input name="categoria" defaultValue="Instrumentos" placeholder="Instrumentos, voces, técnica..." className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-xs ring-1 ring-slate-100" /></label>
        <button className="h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white">Agregar función</button>
      </form>}

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        {funciones.length === 0 ? <p className="p-4 text-center text-xs text-slate-400">Todavía no hay funciones configuradas.</p> : funciones.map((funcion, index) => <div key={funcion.id} className={index ? 'border-t border-slate-100' : ''}>
          <div className="flex min-h-[58px] items-center gap-3 px-3 py-2.5">
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${funcion.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${funcion.activo ? 'text-slate-800' : 'text-slate-400'}`}>{funcion.nombre}</p><p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{funcion.categoria || 'Servicio'} · {funcion.activo ? 'Activa' : 'Retirada'}</p></div>
            <button type="button" onClick={() => { setEditando(editando === funcion.id ? null : funcion.id); setCreando(false) }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"><PencilLine className="h-3.5 w-3.5" />Editar</button>
          </div>
          {editando === funcion.id && <div className="border-t border-slate-100 bg-white p-3">
            <form action={editarAction} className="grid gap-2"><input type="hidden" name="funcion_id" value={funcion.id} /><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nombre<input name="nombre" defaultValue={funcion.nombre} required className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold ring-1 ring-slate-100" /></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Categoría<input name="categoria" defaultValue={funcion.categoria || 'Servicio'} className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs ring-1 ring-slate-100" /></label><button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar cambios</button></form>
            <form action={estadoAction} className="mt-2"><input type="hidden" name="funcion_id" value={funcion.id} /><input type="hidden" name="activo" value={funcion.activo ? 'false' : 'true'} /><button className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold ${funcion.activo ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{funcion.activo ? <Trash2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}{funcion.activo ? 'Retirar función' : 'Reactivar función'}</button></form>
          </div>}
        </div>)}
      </div>
    </section>
  )
}
