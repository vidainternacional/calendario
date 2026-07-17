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

  // Bind sin ministerioId fijo — el campo oculto del formulario lo enviará
  const boundAction = crearAviso.bind(null, '')
  const [state, action, pending] = useActionState<AvisoState, FormData>(
    boundAction,
    undefined
  )

  // Cerrar al éxito
  useEffect(() => {
    if (state?.success) {
      setOpen(false)
    }
  }, [state])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Trigger */}
      <button
        id="btn-nuevo-aviso"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all"
      >
        <Megaphone className="w-4 h-4" />
        Nuevo aviso
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel deslizante desde abajo */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo aviso"
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl transition-transform duration-300 ease-out max-w-lg mx-auto flex flex-col max-h-[85vh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[#171923]">Nuevo aviso</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form action={action} className="px-6 py-5 space-y-4 pb-10 overflow-y-auto flex-1">
          {/* Error */}
          {state?.error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {state.error}
            </div>
          )}

          {/* Ministerio selector */}
          <div className="space-y-1.5">
            <label htmlFor="aviso-ministerio" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Publicar en
            </label>
            <div className="relative">
              <select
                id="aviso-ministerio"
                name="ministerio_id"
                required={!esPastorAdmin}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 pr-10 text-sm text-[#171923] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              >
                {esPastorAdmin && (
                  <option value="">🌐 Todos los ministerios</option>
                )}
                {ministeriosLider.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="aviso-titulo" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Título
            </label>
            <input
              id="aviso-titulo"
              name="titulo"
              type="text"
              placeholder="Ej: Reunión de líderes este sábado"
              required
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Cuerpo */}
          <div className="space-y-1.5">
            <label htmlFor="aviso-cuerpo" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mensaje
            </label>
            <textarea
              id="aviso-cuerpo"
              name="cuerpo"
              rows={4}
              placeholder="Escribe aquí los detalles del aviso..."
              required
              className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            id="btn-publicar-aviso"
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar aviso'
            )}
          </button>
        </form>
      </div>
    </>
  )
}
