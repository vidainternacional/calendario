'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Flame } from 'lucide-react'

export type ReadingPlanChoice = {
  id: string
  title: string
  theme: string
  description: string
  total: number
  completed: number
  nextDay: number
  nextLabel: string
  done: boolean
}

type Props = {
  plans: ReadingPlanChoice[]
  initialPlanId: string
  streak: number
}

export default function PlanesLecturaSelector({ plans, initialPlanId, streak }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || plans[0]?.id || '')
  const selected = useMemo(
    () => plans.find(plan => plan.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId]
  )

  if (!selected) return null

  const progressPercent = Math.round((selected.completed / Math.max(selected.total, 1)) * 100)

  return (
    <>
      <div className="flex flex-wrap gap-2" aria-label="Temas de planes de lectura">
        {plans.map(plan => {
          const isSelected = plan.id === selected.id
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${
                isSelected
                  ? 'border-[#C0392B] bg-[#C0392B] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
              aria-pressed={isSelected}
            >
              {plan.theme}
            </button>
          )
        })}
      </div>

      <section className="mt-6 border-y border-slate-100 py-6" aria-live="polite">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#C0392B]">{selected.completed > 0 && !selected.done ? 'Tu plan actual' : 'Plan seleccionado'}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">{selected.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{selected.description}</p>
          </div>
          <span className="shrink-0 text-xs font-bold text-slate-400">{selected.total} días</span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-500">Avance · {selected.completed}/{selected.total}</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${streak > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <Flame className="h-4 w-4" />
              Racha · {streak} {streak === 1 ? 'día' : 'días'}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <Link
          href={`/hoy/planes/${selected.id}/${selected.nextDay}`}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#C0392B] px-5 text-sm font-bold text-white"
        >
          {selected.done ? 'Revisar plan' : selected.completed > 0 ? `Continuar · Día ${selected.nextDay}` : 'Comenzar plan'}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  )
}
