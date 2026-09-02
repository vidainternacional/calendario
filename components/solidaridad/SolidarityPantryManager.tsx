'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { eliminarNecesidadDespensa, guardarNecesidadDespensa } from '@/app/actions/solidaridad'
import type { PantryNeed, PantryNeedStatus } from '@/lib/solidarity/types'

const EMPTY_FORM = {
  id: '',
  product: '',
  unit: 'unidad',
  currentStock: 0,
  minimumStock: 0,
  status: 'activa' as PantryNeedStatus,
}

export default function SolidarityPantryManager({ needs }: { needs: PantryNeed[] }) {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY_FORM)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const edit = (need: PantryNeed) => {
    setMessage(null)
    setForm({
      id: need.id,
      product: need.producto,
      unit: need.unidad,
      currentStock: Number(need.existencia_actual),
      minimumStock: Number(need.minimo_necesario),
      status: need.estado,
    })
  }

  const reset = () => {
    setMessage(null)
    setForm(EMPTY_FORM)
  }

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await guardarNecesidadDespensa({
        id: form.id || undefined,
        product: form.product,
        unit: form.unit,
        currentStock: Number(form.currentStock),
        minimumStock: Number(form.minimumStock),
        status: form.status,
      })
      if (!result.success) {
        setMessage(result.error || 'No fue posible guardar la necesidad.')
        return
      }
      setForm(EMPTY_FORM)
      setMessage('Necesidad de despensa guardada.')
      router.refresh()
    })
  }

  const remove = (need: PantryNeed) => {
    if (!window.confirm(`¿Eliminar “${need.producto}” de la despensa?`)) return
    setMessage(null)
    startTransition(async () => {
      const result = await eliminarNecesidadDespensa(need.id)
      if (!result.success) {
        setMessage(result.error || 'No fue posible eliminar la necesidad.')
        return
      }
      if (form.id === need.id) setForm(EMPTY_FORM)
      setMessage('Necesidad eliminada.')
      router.refresh()
    })
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
      <header className="border-b border-slate-100 p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-600">Despensa</p>
        <h2 className="mt-1 text-xl font-extrabold text-[#171923]">Necesidades reales</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Actualiza existencia y mínimo. Las necesidades activas aparecen para quienes desean sembrar.</p>
      </header>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-bold text-slate-600">Producto o necesidad</span>
            <input value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))} placeholder="Ej. Arroz" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-600">Unidad</span>
            <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Ej. bolsas, libras, unidades" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-600">Estado</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PantryNeedStatus }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white">
              <option value="activa">Activa</option>
              <option value="cubierta">Cubierta</option>
              <option value="pausada">Pausada</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-600">Existencia actual</span>
            <input type="number" min={0} step="0.01" value={form.currentStock} onChange={(event) => setForm((current) => ({ ...current, currentStock: Number(event.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-600">Mínimo necesario</span>
            <input type="number" min={0} step="0.01" value={form.minimumStock} onChange={(event) => setForm((current) => ({ ...current, minimumStock: Number(event.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={pending} onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {form.id ? 'Guardar cambios' : 'Agregar necesidad'}
          </button>
          {form.id ? <button type="button" onClick={reset} className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600">Cancelar edición</button> : null}
        </div>
        {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}
      </div>

      <div className="border-t border-slate-100">
        {needs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Todavía no hay necesidades de despensa registradas.</p>
        ) : needs.map((need, index) => {
          const missing = Math.max(0, Number(need.minimo_necesario) - Number(need.existencia_actual))
          return (
            <article key={need.id} className={`flex items-center gap-3 px-5 py-4 ${index < needs.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-[#171923]">{need.producto}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${need.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : need.estado === 'cubierta' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>{need.estado}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{Number(need.existencia_actual)} / {Number(need.minimo_necesario)} {need.unidad}{missing > 0 ? ` · faltan ${missing}` : ''}</p>
              </div>
              <button type="button" onClick={() => edit(need)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label={`Editar ${need.producto}`}><Pencil className="h-4 w-4" /></button>
              <button type="button" disabled={pending} onClick={() => remove(need)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50" aria-label={`Eliminar ${need.producto}`}><Trash2 className="h-4 w-4" /></button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
