'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { completarDiaPlan } from '@/app/actions/planes-lectura'
import { mostrarToast } from '@/lib/ui/toast'

type Props = {
  planId: string
  numeroDia: number
  initialCompleted: boolean
}

export default function PlanDiaCompletarButton({ planId, numeroDia, initialCompleted }: Props) {
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [message, setMessage] = useState(initialCompleted ? 'Este día ya forma parte de tu recorrido. Puedes volver a esta reflexión cuando quieras.' : '')
  const [isPending, startTransition] = useTransition()

  const complete = () => {
    if (completed || isPending) return
    startTransition(async () => {
      const result = await completarDiaPlan(planId, numeroDia)
      if (result?.error) {
        mostrarToast(result.error)
        return
      }

      const encouragement = result?.planCompletado
        ? 'Terminaste este plan. Que lo aprendido siga acompañándote en lo que viene.'
        : 'Bien hecho. Quédate con una idea de esta lectura y llévala contigo hoy.'

      setCompleted(true)
      setMessage(encouragement)
      mostrarToast(encouragement)
      router.refresh()
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={complete}
        disabled={completed || isPending}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#C0392B] text-white active:scale-[0.99]'}`}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {completed ? 'Día completado' : isPending ? 'Guardando…' : 'Marcar día como completado'}
      </button>
      {message ? <p className="mt-3 text-center text-sm leading-6 text-slate-600">{message}</p> : null}
    </div>
  )
}
