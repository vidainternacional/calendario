'use client'

import { useActionState, useEffect, useState } from 'react'
import { crearSolicitudGlobal, type SolicitudState } from '@/app/actions/solicitudes'
import { X, Loader2, FileText, ChevronDown } from 'lucide-react'

interface Ministerio {
  id: string
  nombre: string
}

interface NuevaSolicitudModalProps {
  ministerios: Ministerio[]
}

const TIPOS = [
  { value: 'salon', label: '🏛️ Salón / Espacio' },
  { value: 'equipo_sonido', label: '🎙️ Equipo de sonido' },
  { value: 'presupuesto', label: '💰 Presupuesto' },
  { value: 'otro', label: '📋 Otro' },
] as const

export default function NuevaSolicitudModal({ ministerios }: NuevaSolicitudModalProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<SolicitudState, FormData>(
    crearSolicitudGlobal,
    undefined
  )

  // Cerrar al éxito
  useEffect(() => {
    if (state?.success) setOpen(false)
  }, [state])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Trigger */}
      <button
        id="btn-nueva-solicitud"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all"
      >
        <FileText className="w-4 h-4" />
        Nueva solicitud
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva solicitud"
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl transition-transform duration-300 ease-out max-w-lg mx-auto flex flex-col max-h-[85vh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-[#171923]">Nueva solicitud</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form con scroll */}
        <form action={action} className="px-6 py-5 space-y-4 pb-24 overflow-y-auto flex-1">
          {/* Error */}
          {state?.error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {state.error}
            </div>
          )}

          {/* Ministerio */}
          <div className="space-y-1.5">
            <label htmlFor="sol-ministerio" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Ministerio
            </label>
            <div className="relative">
              <select
                id="sol-ministerio"
                name="ministerio_id"
                required
                className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 pr-10 text-sm text-[#171923] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              >
                <option value="">Selecciona un ministerio...</option>
                {ministerios.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <label htmlFor="sol-tipo" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tipo de solicitud
            </label>
            <div className="relative">
              <select
                id="sol-tipo"
                name="tipo"
                required
                className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 pr-10 text-sm text-[#171923] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              >
                <option value="">Selecciona un tipo...</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="sol-titulo" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Título
            </label>
            <input
              id="sol-titulo"
              name="titulo"
              type="text"
              placeholder="Ej: Reserva del salón para el sábado"
              required
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Detalle */}
          <div className="space-y-1.5">
            <label htmlFor="sol-detalle" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Detalle
            </label>
            <textarea
              id="sol-detalle"
              name="detalle"
              rows={4}
              placeholder="Describe lo que necesitas o el motivo de tu solicitud..."
              required
              className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Fecha y hora solicitada (Opcional) */}
          <div className="space-y-1.5">
            <label htmlFor="sol-fecha" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha y hora solicitada (Opcional)
            </label>
            <input
              id="sol-fecha"
              name="fecha_solicitada"
              type="datetime-local"
              className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Submit */}
          <button
            id="btn-enviar-solicitud"
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar solicitud'
            )}
          </button>
        </form>
      </div>
    </>
  )
}
