'use client'

import { useActionState } from 'react'
import { crearSolicitud } from '@/app/actions/solicitudes'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevaSolicitudForm({ ministerioId }: { ministerioId: string }) {
  const actionWithId = crearSolicitud.bind(null, ministerioId)
  const [state, action, pending] = useActionState(actionWithId, undefined)

  return (
    <form action={action} className="space-y-6">
      {/* Error */}
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Tipo */}
      <div className="space-y-1.5">
        <label htmlFor="tipo" className="block text-sm font-medium text-slate-300">
          Tipo de solicitud
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          <option value="salon">Reserva de Salón</option>
          <option value="equipo_sonido">Equipo de Sonido</option>
          <option value="presupuesto">Presupuesto</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Título */}
      <div className="space-y-1.5">
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-300">
          Título de la solicitud
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Ej: Uso de salón anexo para reunión"
          required
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Detalle */}
      <div className="space-y-1.5">
        <label htmlFor="detalle" className="block text-sm font-medium text-slate-300">
          Detalles de la petición
        </label>
        <textarea
          id="detalle"
          name="detalle"
          rows={4}
          placeholder="Explica qué necesitas, fechas, horarios, etc..."
          required
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Link 
          href={`/ministerios/${ministerioId}/solicitudes`}
          className="flex-1 text-center rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white transition-colors"
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
      </div>
    </form>
  )
}
