'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function MinisterioBienvenida({ ministerioId, ministerioNombre }: { ministerioId: string; ministerioNombre: string }) {
  const searchParams = useSearchParams()
  const [cerrada, setCerrada] = useState(false)
  const visible = searchParams.get('bienvenida') === '1' && !cerrada

  if (!visible) return null

  return (
    <div className="relative z-40 mx-auto max-w-2xl px-4 pt-[calc(env(safe-area-inset-top)+5.4rem)]">
      <section className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
        <div className="flex items-start gap-3 bg-gradient-to-br from-emerald-50 to-indigo-50 px-4 py-4 sm:px-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-600">Ingreso aprobado</p>
                <h2 className="mt-1 break-words text-lg font-extrabold leading-tight text-[#171923]">¡Bienvenido a {ministerioNombre}!</h2>
              </div>
              <button type="button" onClick={() => setCerrada(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80 text-slate-500" aria-label="Cerrar bienvenida">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ya eres parte del equipo. Desde este dashboard puedes consultar avisos, miembros, solicitudes y las herramientas habilitadas para tu ministerio.
            </p>
          </div>
        </div>
        <div className="grid gap-2 border-t border-slate-100 px-4 py-3 sm:grid-cols-2 sm:px-5">
          <Link href={`/ministerios/${ministerioId}/avisos`} className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> Ver avisos</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <button type="button" onClick={() => setCerrada(true)} className="min-h-11 rounded-xl bg-[#171923] px-4 text-sm font-semibold text-white">
            Explorar dashboard
          </button>
        </div>
      </section>
    </div>
  )
}
