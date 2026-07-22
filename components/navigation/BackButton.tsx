'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      aria-label="Regresar a la pantalla anterior"
    >
      <ArrowLeft className="h-4 w-4" />
      Atrás
    </button>
  )
}
