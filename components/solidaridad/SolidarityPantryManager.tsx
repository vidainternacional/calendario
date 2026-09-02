'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const edit = (need: PantryNeed) => {
    setMessage(null)
    setShowForm(true)
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
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const save = (override?: typeof EMPTY_FORM) => {
    const source = override || form
    setMessage(null)
    startTransition(async () => {
      const result = await guardarNecesidadDespensa({
        id: source.id || undefined,
        product: source.product,
        unit: source.unit,
        currentStock: Number(source.currentStock),
        minimumStock: Number(source.minimumStock),
        status: source.status,
      })
      if (!result.success) {
        setMessage(result.error || 'No fue posible guardar la necesidad.')
        return
      }
      if (!override) {
        setForm(EMPTY_FORM)
        setShowForm(false)
      }
      setMessage('Despensa actualizada.')
      router.refresh()
    })
  }

  const quickStock = (need: PantryNeed, delta: number) => {
    const next = Math.max(0, Number(need.existencia_actual) + delta)
    save({
      id: need.id,
      product: need.producto,
      unit: need.unidad,
      currentStock: next,
      minimumStock: Number(need.minimo_necesario),
      status: need.estado,
    })
  }

  const quickStatus = (need: PantryNeed, status: PantryNeedStatus) => {
    save({
      id: need.id,
      product: need.producto,
      unit: need.unidad,
      currentStock: Number(need.existencia_actual),
      minimumStock: Number(need.minimo_necesario),
      status,
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
      if (form.id === need.id) reset()
      setMessage('Necesidad eliminada.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[#171923]">Despensa</p>
          <p className="mt-1 text-xs text-slate-500">Actualiza solo lo necesario para saber qué hace falta hoy.</p>
        </div>
        <button type="button" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setMessage(null) }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white">
          <Plus className="h-4 w-4" /> Agregar necesidad
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-600">Producto o necesidad</span>
              <input value={form.product} onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))} placeholder="Ej. Arroz" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Unidad</span>
              <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Ej. libras" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Estado</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PantryNeedStatus }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-400">
                <option value="activa">Activa</option>
                <option value="cubierta">Cubierta</option>
                <option value="pausada">Pausada</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Existencia actual</span>
              <input type="number" min={0} step="0.01" value={form.currentStock} onChange={(event) => setForm((current) => ({ ...current, currentStock: Number(event.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-400" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Mínimo deseado</span>
              <input type="number" min={0} step="0.01" value={form.minimumStock} onChange={(event) => setForm((current) => ({ ...current, minimumStock: Number(event.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-400" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={pending} onClick={() => save()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {form.id ? 'Guardar cambios' : 'Agregar'}
            </button>
            <button type="button" onClick={reset} className="min-h-10 rounded-xl px-3 text-xs font-bold text-slate-500">Cancelar</button>
          </div>
        </div>
      )}

      {message ? <p className="text-xs font-semibold text-slate-500">{message}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {needs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">Todavía no hay necesidades registradas.</p>
        ) : needs.map((need, index) => {
          const current = Number(need.existencia_actual)
          const minimum = Number(need.minimo_necesario)
          const missing = Math.max(0, minimum - current)
          return (
            <article key={need.id} className={`flex items-center gap-3 px-4 py-3 ${index < needs.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-extrabold text-[#171923]">{need.producto}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${need.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : need.estado === 'cubierta' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>{need.estado}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{current} / {minimum} {need.unidad}{missing > 0 ? ` · faltan ${missing}` : ' · cubierto por ahora'}</p>
              </div>

              <div className="flex items-center rounded-xl bg-slate-100">
                <button type="button" disabled={pending} onClick={() => quickStock(need, -1)} className="grid h-9 w-9 place-items-center text-base font-bold text-slate-600 disabled:opacity-50" aria-label={`Restar existencia de ${need.producto}`}>−</button>
                <span className="min-w-8 text-center text-xs font-extrabold text-slate-700">{current}</span>
                <button type="button" disabled={pending} onClick={() => quickStock(need, 1)} className="grid h-9 w-9 place-items-center text-base font-bold text-slate-600 disabled:opacity-50" aria-label={`Sumar existencia de ${need.producto}`}>+</button>
              </div>

              <details className="relative">
                <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full bg-slate-100 text-slate-600 [&::-webkit-details-marker]:hidden" aria-label={`Acciones para ${need.producto}`}><MoreHorizontal className="h-4 w-4" /></summary>
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-black/10">
                  <button type="button" onClick={() => edit(need)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-600"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                  <button type="button" onClick={() => quickStatus(need, need.estado === 'pausada' ? 'activa' : 'pausada')} className="w-full px-3 py-2 text-left text-xs font-bold text-slate-600">{need.estado === 'pausada' ? 'Activar' : 'Pausar'}</button>
                  <button type="button" onClick={() => quickStatus(need, 'cubierta')} className="w-full px-3 py-2 text-left text-xs font-bold text-emerald-700">Marcar cubierta</button>
                  <button type="button" disabled={pending} onClick={() => remove(need)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-rose-600 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                </div>
              </details>
            </article>
          )
        })}
      </div>
    </div>
  )
}
