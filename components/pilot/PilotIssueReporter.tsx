'use client'

import { useState } from 'react'
import { Bug, CheckCircle2, Loader2, X } from 'lucide-react'
import { crearReportePiloto } from '@/app/actions/piloto'
import type { PilotContext } from '@/lib/pilot/types'

export default function PilotIssueReporter({ context }: { context: PilotContext | null }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!context?.active) return null

  const submit = async (formData: FormData) => {
    setSending(true)
    setError('')

    const result = await crearReportePiloto({
      role: context.role,
      route: window.location.pathname,
      description: String(formData.get('description') || ''),
      expectedResult: String(formData.get('expected') || ''),
      deviceInfo: {
        platform: navigator.platform || null,
        language: navigator.language || null,
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        screen: `${window.screen.width}x${window.screen.height}`,
      },
    })

    setSending(false)
    if (!result.success) {
      setError(result.error || 'No fue posible enviar el reporte.')
      return
    }
    setSent(true)
  }

  const close = () => {
    setOpen(false)
    window.setTimeout(() => setSent(false), 180)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-slate-100 bg-white p-5 text-left shadow-sm active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Bug className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[#171923]">Reportar un problema</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">Cuéntanos qué intentabas hacer y qué ocurrió.</span>
          </span>
        </span>
        <span className="text-2xl text-slate-300" aria-hidden="true">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/35 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="pilot-report-title">
          <section className="w-full rounded-t-[28px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[28px]">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-500">Piloto VIDA</p>
                <h2 id="pilot-report-title" className="mt-1 text-lg font-extrabold text-[#171923]">Reportar un problema</h2>
              </div>
              <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </header>

            {sent ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-lg font-bold text-[#171923]">Reporte recibido</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Gracias. La pantalla y los datos básicos del dispositivo se agregaron automáticamente.</p>
                <button type="button" onClick={close} className="mt-6 min-h-12 w-full rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white">Listo</button>
              </div>
            ) : (
              <form action={submit} className="space-y-4 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">¿Qué ocurrió?</span>
                  <textarea
                    name="description"
                    required
                    minLength={5}
                    maxLength={4000}
                    rows={5}
                    placeholder="Ej. Toqué el evento del domingo, pero la pantalla quedó cargando y no mostró los detalles."
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">¿Qué esperabas que sucediera?</span>
                  <textarea
                    name="expected"
                    maxLength={4000}
                    rows={3}
                    placeholder="Ej. Esperaba ver la fecha, la ubicación y las personas asignadas."
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
                <button type="submit" disabled={sending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white disabled:opacity-60">
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}
