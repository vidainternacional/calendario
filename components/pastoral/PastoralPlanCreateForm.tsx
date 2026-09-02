'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { crearPlanPastoral } from '@/app/actions/planes-lectura-pastoral'
import { mostrarToast } from '@/lib/ui/toast'

export default function PastoralPlanCreateForm() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [duracion, setDuracion] = useState(7)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await crearPlanPastoral({ titulo, descripcion, duracionDias: duracion })
      if (result.error) {
        mostrarToast(result.error)
        return
      }
      if (result.id) router.push(`/pastoral/planes/${result.id}`)
    })
  }

  return (
    <form onSubmit={submit} className="border-y border-slate-100 py-5">
      <label className="block text-sm font-bold text-slate-800">
        Tema / título del plan
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ej. Encontrar paz en medio de la ansiedad"
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none focus:border-[#C0392B]"
          required
        />
      </label>

      <label className="mt-5 block text-sm font-bold text-slate-800">
        Objetivo del plan
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Explica brevemente qué aprenderá o trabajará la persona durante este plan."
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base leading-6 text-slate-900 outline-none focus:border-[#C0392B]"
          required
        />
      </label>

      <label className="mt-5 block text-sm font-bold text-slate-800">
        Duración necesaria
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={90}
            value={duracion}
            onChange={e => setDuracion(Number(e.target.value))}
            className="h-12 w-24 rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 outline-none focus:border-[#C0392B]"
            required
          />
          <span className="text-sm text-slate-500">días</span>
        </div>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Crear plan
      </button>
    </form>
  )
}
