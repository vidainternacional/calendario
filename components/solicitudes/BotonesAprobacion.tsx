'use client'

import { useActionState } from 'react'
import { aprobarSolicitud, rechazarSolicitud, type SolicitudState } from '@/app/actions/solicitudes'
import { Check, X, Loader2 } from 'lucide-react'

export function BotonesAprobacion({ solicitudId }: { solicitudId: string }) {
  const [stateAprobar, actionAprobar, pendingAprobar] = useActionState<SolicitudState, FormData>(
    aprobarSolicitud,
    undefined
  )
  const [stateRechazar, actionRechazar, pendingRechazar] = useActionState<SolicitudState, FormData>(
    rechazarSolicitud,
    undefined
  )

  return (
    <div className="flex gap-2">
      {/* Aprobar */}
      <form action={actionAprobar}>
        <input type="hidden" name="solicitud_id" value={solicitudId} />
        <button
          id={`btn-aprobar-${solicitudId}`}
          type="submit"
          disabled={pendingAprobar || pendingRechazar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pendingAprobar ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Aprobar
        </button>
      </form>

      {/* Rechazar */}
      <form action={actionRechazar}>
        <input type="hidden" name="solicitud_id" value={solicitudId} />
        <button
          id={`btn-rechazar-${solicitudId}`}
          type="submit"
          disabled={pendingAprobar || pendingRechazar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pendingRechazar ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          Rechazar
        </button>
      </form>

      {/* Errores inline */}
      {(stateAprobar?.error || stateRechazar?.error) && (
        <p className="text-xs text-rose-500 mt-1">
          {stateAprobar?.error || stateRechazar?.error}
        </p>
      )}
    </div>
  )
}
