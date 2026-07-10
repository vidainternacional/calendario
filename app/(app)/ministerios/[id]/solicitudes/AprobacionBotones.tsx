'use client'

import { actualizarEstadoSolicitud } from '@/app/actions/solicitudes'
import { Check, X, Loader2 } from 'lucide-react'
import { useTransition } from 'react'

export function AprobacionBotones({ solicitudId, path }: { solicitudId: string, path: string }) {
  const [isPending, startTransition] = useTransition()

  function handleActualizar(estado: 'aprobada' | 'rechazada') {
    startTransition(async () => {
      await actualizarEstadoSolicitud(solicitudId, estado, path)
    })
  }

  return (
    <>
      <button
        onClick={() => handleActualizar('aprobada')}
        disabled={isPending}
        title="Aprobar"
        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button
        onClick={() => handleActualizar('rechazada')}
        disabled={isPending}
        title="Rechazar"
        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
    </>
  )
}
