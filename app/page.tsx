import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bienvenido',
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6">
      {/* Glow de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Logo / Ícono */}
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-tight">
          Vida Internacional
        </h1>
        <p className="mt-3 text-slate-400 text-lg">
          App de servidores y ministerios
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/inicio"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-600">
          Fase 1 — Infraestructura base ✅
        </p>
      </div>
    </main>
  )
}
