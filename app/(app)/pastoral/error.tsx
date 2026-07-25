'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PastoralError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en Centro Pastoral', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 lg:px-8">
      <section className="w-full rounded-[26px] border border-rose-100 bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Centro Pastoral</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">No pudimos cargar esta sección</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Su información permanece guardada. Puede intentar nuevamente o regresar al Centro Pastoral.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </button>
          <Link
            href="/pastoral"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al Centro Pastoral
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-[11px] text-slate-400">Referencia: {error.digest}</p>}
      </section>
    </main>
  )
}
