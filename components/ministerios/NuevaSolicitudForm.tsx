'use client'

import { useActionState } from 'react'
import { crearSolicitud } from '@/app/actions/solicitudes'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevaSolicitudForm({ ministerioId }: { ministerioId: string }) {
  const actionWithId = crearSolicitud.bind(null, ministerioId)
  const [state, action, pending] = useActionState(actionWithId, undefined)

  return (
    <form action={action} className="space-y-5 sm:space-y-6">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="tipo" className="block text-sm font-medium text-slate-700">
          Tipo de solicitud
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="salon">Reserva de Salón</option>
          <option value="equipo_sonido">Equipo de Sonido</option>
          <option value="presupuesto">Presupuesto</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-700">
          Título de la solicitud
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Ej: Uso de salón anexo para reunión"
          required
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="detalle" className="block text-sm font-medium text-slate-700">
          Detalles de la petición
        </label>
        <textarea
          id="detalle"
          name="detalle"
          rows={5}
          placeholder="Explica qué necesitas, fechas, horarios, etc."
          required
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:pt-4">
        <Link
          href={`/ministerios/${ministerioId}/solicitudes`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-[#171923] transition-colors hover:bg-slate-300 sm:flex-1"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[2]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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
