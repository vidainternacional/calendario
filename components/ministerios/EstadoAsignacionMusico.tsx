'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import {
  responderAsignacionMinisterial,
  type EstadoAsignacionMusico,
} from '@/app/actions/asignaciones-musico'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

type Props = {
  ministerioId: string
  eventoId: string
  initialEstado: EstadoAsignacionMusico
}

export default function EstadoAsignacionMusico({ ministerioId, eventoId, initialEstado }: Props) {
  const [estado, setEstado] = useState<EstadoAsignacionMusico>(initialEstado)
  const [mensaje, setMensaje] = useState('')
  const [isPending, startTransition] = useTransition()

  function responder(nuevo: EstadoAsignacionMusico) {
    setMensaje('')
    startTransition(async () => {
      const result = await responderAsignacionMinisterial(ministerioId, eventoId, nuevo)
      if (result?.error) {
        setMensaje(result.error)
        return
      }
      setEstado(nuevo)
      requestPendingIndicatorsRefresh()
      setMensaje('Guardado')
      window.setTimeout(() => setMensaje(''), 2200)
    })
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => responder('confirmado')}
          disabled={isPending}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'confirmado' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'} disabled:opacity-60`}
        >
          <Check className="h-4 w-4" />
          {isPending && estado !== 'confirmado' ? 'Guardando…' : estado === 'confirmado' ? 'Confirmado' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={() => responder('no_disponible')}
          disabled={isPending}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'no_disponible' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'} disabled:opacity-60`}
        >
          <X className="h-4 w-4" />
          {isPending && estado !== 'no_disponible' ? 'Guardando…' : estado === 'no_disponible' ? 'No disponible' : 'No puedo servir'}
        </button>
      </div>
      {mensaje && (
        <p className={`mt-2 text-center text-[10px] font-extrabold ${mensaje === 'Guardado' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {mensaje}
        </p>
      )}
    </div>
  )
}
