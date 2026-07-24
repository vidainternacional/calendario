'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl items-center px-4 py-10">
      <section
        role="alert"
        aria-live="assertive"
        className="w-full rounded-[26px] border border-rose-100 bg-white p-6 text-center shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-500">
          Algo no cargó bien
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-[#171923]">
          No pudimos mostrar esta pantalla
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
          Tus datos siguen seguros. Puedes intentar cargar de nuevo o regresar a Inicio.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] motion-reduce:transition-none"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </button>

          <Link
            href="/inicio"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition active:scale-[0.98] motion-reduce:transition-none"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Ir a Inicio
          </Link>
        </div>

        {error.digest && (
          <p className="mt-5 text-[10px] text-slate-300" aria-label="Código de referencia del error">
            Referencia: {error.digest}
          </p>
        )}
      </section>
    </main>
  )
}
