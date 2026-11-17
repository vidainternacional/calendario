'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, ChevronDown } from 'lucide-react'

type Verso = { numero: number; texto: string }
type Props = {
  referencia: string
  versos: Verso[]
}

export default function PlanDiaLecturaAcordeon({ referencia, versos }: Props) {
  const router = useRouter()

  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-start gap-2.5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#C0392B]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">Lectura bíblica</span>
            <span className="mt-1 block text-xl font-bold leading-7 text-slate-950">{referencia}</span>
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="pb-2 pt-4">
        <p className="mb-3 text-xs font-semibold text-slate-500">Reina-Valera 1909</p>
        {versos.length > 0 ? (
          <div className="space-y-3 text-base leading-7 text-slate-800">
            {versos.map((verso) => (
              <p key={verso.numero}>
                <sup className="mr-1.5 align-baseline text-xs font-bold text-[#C0392B]">{verso.numero}</sup>
                {verso.texto}
              </p>
            ))}
          </div>
        ) : (
          <div className="text-sm leading-6 text-slate-600">
            No pudimos cargar el texto bíblico. Podés abrirlo en Biblia.
            <button type="button" onClick={() => router.refresh()} className="ml-2 min-h-11 font-bold text-[#C0392B]">Reintentar</button>
          </div>
        )}
      </div>
    </details>
  )
}
