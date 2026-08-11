'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, HeartHandshake, Sparkles, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function MinisterioBienvenida({ ministerioId, ministerioNombre }: { ministerioId: string; ministerioNombre: string }) {
  const searchParams = useSearchParams()
  const [cerrada, setCerrada] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const visible = searchParams.get('bienvenida') === '1' && !cerrada

  useEffect(() => setPortalReady(true), [])

  useEffect(() => {
    if (!visible) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCerrada(true)
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [visible])

  if (!visible || !portalReady) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-[12px]"
      role="presentation"
      onClick={() => setCerrada(true)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-ministerio-titulo"
        className="relative my-auto w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/65 bg-white/78 shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-white/55 backdrop-blur-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-6 text-center sm:px-7 sm:pt-7">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-12 h-52 w-52 rounded-full bg-indigo-300/25 blur-3xl" />

          <button
            type="button"
            onClick={() => setCerrada(true)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/70 text-slate-500 shadow-sm backdrop-blur-xl active:scale-95"
            aria-label="Cerrar bienvenida"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.32)] ring-8 ring-emerald-100/70">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <p className="relative mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Ingreso aprobado</p>
          <h2 id="bienvenida-ministerio-titulo" className="relative mt-1.5 break-words text-[25px] font-extrabold leading-tight tracking-[-0.03em] text-[#171923]">
            ¡Qué alegría tenerte en {ministerioNombre}!
          </h2>
          <p className="relative mx-auto mt-3 max-w-sm text-[15px] leading-6 text-slate-600">
            Nos alegra que ahora seas parte de este equipo. Deseamos servir juntos al Señor, crecer como comunidad y apoyarnos unos a otros. Te bendecimos y estaremos pendientes para acompañarte en este nuevo paso.
          </p>

          <div className="relative mt-5 rounded-[22px] border border-white/70 bg-white/55 p-4 text-left shadow-sm backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100/80 text-indigo-600">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#171923]">Tu espacio dentro del ministerio</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">
                  Aquí podrás consultar avisos, miembros, solicitudes, próximos eventos y las herramientas que el liderazgo habilite. También recibirás notificaciones cuando haya información que requiera tu atención.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 border-t border-white/70 bg-white/55 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-7">
          <Link
            href={`/ministerios/${ministerioId}/avisos`}
            className="flex min-h-12 items-center justify-between rounded-2xl border border-white/80 bg-white/80 px-4 text-sm font-bold text-slate-700 shadow-sm active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> Ver avisos</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={() => setCerrada(true)}
            className="min-h-12 rounded-2xl bg-[#171923] px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 active:scale-[0.99]"
          >
            Explorar mi dashboard
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
