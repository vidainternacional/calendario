'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur-md transition-colors hover:bg-white hover:text-slate-900 active:scale-[0.98]"
      aria-label="Regresar a la pantalla anterior"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="pr-0.5">Atrás</span>
    </button>
  )
}
