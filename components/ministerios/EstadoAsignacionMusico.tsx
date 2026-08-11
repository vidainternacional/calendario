'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, UserRoundPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  responderAsignacionMinisterial,
  solicitarReemplazoServicioMinisterial,
  type EstadoAsignacionMusico,
} from '@/app/actions/asignaciones-musico'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

type Props = {
  ministerioId: string
  eventoId: string
  initialEstado: EstadoAsignacionMusico
  onEstadoChange?: (estado: EstadoAsignacionMusico) => void
}

export default function EstadoAsignacionMusico({
  ministerioId,
  eventoId,
  initialEstado,
  onEstadoChange,
}: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoAsignacionMusico>(initialEstado)
  const [mensaje, setMensaje] = useState('')
  const [reemplazoSolicitado, setReemplazoSolicitado] = useState(false)
  const [cargandoReemplazo, setCargandoReemplazo] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setEstado(initialEstado)
  }, [initialEstado])

  useEffect(() => {
    let cancelled = false

    async function cargarSolicitudPendiente() {
      if (estado !== 'no_disponible') {
        setReemplazoSolicitado(false)
        return
      }

      setCargandoReemplazo(true)
      try {
        const supabase = createClient() as any
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: asignaciones } = await supabase
          .from('evento_asignaciones')
          .select('id')
          .eq('profile_id', user.id)
          .eq('evento_id', eventoId)
          .eq('ministerio_id', ministerioId)

        const ids = (asignaciones || []).map((row: any) => String(row.id))
        if (!ids.length) {
          if (!cancelled) setReemplazoSolicitado(false)
          return
        }

        const { data: intercambios } = await supabase
          .from('intercambios')
          .select('id')
          .eq('solicitante_id', user.id)
          .eq('estado', 'pendiente')
          .in('asignacion_origen_id', ids)
          .limit(1)

        if (!cancelled) setReemplazoSolicitado(Boolean(intercambios?.length))
      } finally {
        if (!cancelled) setCargandoReemplazo(false)
      }
    }

    void cargarSolicitudPendiente()
    return () => {
      cancelled = true
    }
  }, [estado, eventoId, ministerioId])

  function responder(nuevo: EstadoAsignacionMusico) {
    setMensaje('')
    startTransition(async () => {
      const result = await responderAsignacionMinisterial(ministerioId, eventoId, nuevo)
      if (result?.error) {
        setMensaje(result.error)
        return
      }

      setEstado(nuevo)
      if (nuevo !== 'no_disponible') setReemplazoSolicitado(false)
      onEstadoChange?.(nuevo)
      requestPendingIndicatorsRefresh()
      setMensaje(
        nuevo === 'confirmado'
          ? 'Confirmación guardada.'
          : nuevo === 'no_disponible'
            ? 'Marcado como no disponible.'
            : 'Guardado.',
      )
      router.refresh()
      window.setTimeout(() => setMensaje(''), 2600)
    })
  }

  function solicitarReemplazo() {
    if (reemplazoSolicitado || cargandoReemplazo) return
    setMensaje('')
    setCargandoReemplazo(true)

    void solicitarReemplazoServicioMinisterial(ministerioId, eventoId)
      .then((result) => {
        if (result?.error) {
          setMensaje(result.error)
          return
        }

        setEstado('no_disponible')
        setReemplazoSolicitado(true)
        onEstadoChange?.('no_disponible')
        requestPendingIndicatorsRefresh()
        setMensaje(
          result?.alreadyPending
            ? 'Ya existe una solicitud de reemplazo pendiente.'
            : 'Solicitud de reemplazo enviada al líder.',
        )
        router.refresh()
      })
      .finally(() => setCargandoReemplazo(false))
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => responder('confirmado')}
          disabled={isPending || cargandoReemplazo}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'confirmado' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'} disabled:opacity-60`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {isPending && estado !== 'confirmado' ? 'Guardando…' : estado === 'confirmado' ? 'Confirmado' : 'Confirmar'}
        </button>

        <button
          type="button"
          onClick={() => responder('no_disponible')}
          disabled={isPending || cargandoReemplazo}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'no_disponible' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'} disabled:opacity-60`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {isPending && estado !== 'no_disponible' ? 'Guardando…' : estado === 'no_disponible' ? 'No disponible' : 'No puedo servir'}
        </button>
      </div>

      {estado === 'no_disponible' && (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-700 ring-1 ring-amber-100">
              <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-800">¿Necesitas que alguien te cubra?</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Solicita un reemplazo. El líder verá las funciones que deben cubrirse y elegirá personas con capacidad compatible.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={solicitarReemplazo}
            disabled={reemplazoSolicitado || cargandoReemplazo || isPending}
            className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition disabled:opacity-75 ${
              reemplazoSolicitado
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                : 'bg-slate-900 text-white active:scale-[0.99]'
            }`}
          >
            {cargandoReemplazo ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Revisando…
              </>
            ) : reemplazoSolicitado ? (
              'Reemplazo solicitado'
            ) : (
              <>
                <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                Solicitar reemplazo
              </>
            )}
          </button>
        </div>
      )}

      {estado !== 'no_disponible' && (
        <p className="mt-2 text-center text-[9px] font-semibold leading-4 text-slate-400">
          Si no puedes asistir, márcalo primero como “No puedo servir”. Después podrás pedir un reemplazo.
        </p>
      )}

      {mensaje && (
        <p className={`mt-2 text-center text-[10px] font-extrabold ${
          mensaje.includes('guardada') || mensaje.includes('enviada') || mensaje.includes('pendiente') || mensaje.includes('no disponible')
            ? 'text-emerald-600'
            : 'text-rose-600'
        }`}>
          {mensaje}
        </p>
      )}
    </div>
  )
}