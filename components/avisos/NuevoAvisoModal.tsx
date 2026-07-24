'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { crearAviso, type AvisoState } from '@/app/actions/avisos'
import { X, Loader2, Megaphone, ChevronDown } from 'lucide-react'

interface Ministerio {
  id: string
  nombre: string
}

interface NuevoAvisoModalProps {
  /** Ministerios donde el usuario es líder */
  ministeriosLider: Ministerio[]
  /** true si el usuario es pastor o administrador (puede publicar globalmente) */
  esPastorAdmin: boolean
}

export default function NuevoAvisoModal({
  ministeriosLider,
  esPastorAdmin,
}: NuevoAvisoModalProps) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const boundAction = crearAviso.bind(null, '')
  const [state, action, pending] = useActionState<AvisoState, FormData>(
    boundAction,
    undefined
  )

  const [pendiente, setPendiente] = useState(false)
  useEffect(() => {
    if (state?.success) {
      if (state.pendiente) {
        setPendiente(true)
      } else {
        setOpen(false)
      }
    }
  }, [state])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return (
    <>
      <button
        id="btn-nuevo-aviso"
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-500 active:scale-95 min-[430px]:flex-none"
      >
        <Megaphone className="h-4 w-4 shrink-0" />
        Nuevo aviso
      </button>

      {open && (
        <div
          className="modal-overlay-safe bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo aviso"
            className="modal-panel-safe flex max-w-lg flex-col rounded-[24px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:pb-4 sm:pt-5">
              <h2 className="min-w-0 break-words text-base font-bold text-[#171923]">Nuevo aviso</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {pendiente ? (
              <div className="modal-body-safe flex flex-col items-center px-5 py-10 text-center sm:px-6 sm:py-12">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <span className="text-2xl">⏳</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#171923]">Aviso en revisión</h3>
                <p className="mb-6 text-sm text-gray-500">
                  Tu aviso global ha sido enviado y será publicado una vez que sea aprobado por un administrador o pastor general.
                </p>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setPendiente(false) }}
                  className="min-h-11 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form action={action} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="modal-body-safe flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                  {state?.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {state.error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="aviso-ministerio" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Publicar en
                    </label>
                    <div className="relative">
                      <select
                        id="aviso-ministerio"
                        name="ministerio_id"
                        required={!esPastorAdmin}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 pr-10 text-base text-[#171923] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm"
                      >
                        {esPastorAdmin && (
                          <option value="">🌐 Todos los ministerios</option>
                        )}
                        {ministeriosLider.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="aviso-titulo" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Título
                    </label>
                    <input
                      id="aviso-titulo"
                      name="titulo"
                      type="text"
                      placeholder="Ej: Reunión de líderes este sábado"
                      required
                      maxLength={120}
                      className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-base text-[#171923] placeholder:text-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="aviso-cuerpo" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mensaje
                    </label>
                    <textarea
                      id="aviso-cuerpo"
                      name="cuerpo"
                      rows={4}
                      placeholder="Escribe aquí los detalles del aviso..."
                      required
                      className="w-full resize-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-base text-[#171923] placeholder:text-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  <button
                    id="btn-publicar-aviso"
                    type="submit"
                    disabled={pending}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      'Publicar aviso'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
