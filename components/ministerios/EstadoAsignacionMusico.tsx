'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Check, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  responderAsignacionMinisterial,
  solicitarCambioAsignacionMinisterial,
  type EstadoAsignacionMusico,
} from '@/app/actions/asignaciones-musico'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'

type Props = {
  ministerioId: string
  eventoId: string
  initialEstado: EstadoAsignacionMusico
}

type FuncionCambio = {
  id: string
  nombre: string
  solicitado: boolean
}

export default function EstadoAsignacionMusico({ ministerioId, eventoId, initialEstado }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoAsignacionMusico>(initialEstado)
  const [mensaje, setMensaje] = useState('')
  const [cambiosOpen, setCambiosOpen] = useState(false)
  const [funciones, setFunciones] = useState<FuncionCambio[]>([])
  const [cargandoFunciones, setCargandoFunciones] = useState(false)
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null)
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
      router.refresh()
      window.setTimeout(() => setMensaje(''), 2200)
    })
  }

  async function cargarFuncionesCambio() {
    if (funciones.length > 0 || cargandoFunciones) return
    setCargandoFunciones(true)
    setMensaje('')

    try {
      const supabase = createClient() as any
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMensaje('No autorizado.')
        return
      }

      const { data: asignaciones, error } = await supabase
        .from('evento_asignaciones')
        .select('id,capacidad_id,ministerio_capacidades(nombre)')
        .eq('profile_id', user.id)
        .eq('evento_id', eventoId)
        .eq('ministerio_id', ministerioId)
        .order('created_at')

      if (error) {
        setMensaje('No se pudieron cargar tus funciones.')
        return
      }

      const ids = (asignaciones || []).map((row: any) => String(row.id))
      let solicitadas = new Set<string>()
      if (ids.length > 0) {
        const { data: intercambios } = await supabase
          .from('intercambios')
          .select('asignacion_origen_id')
          .eq('solicitante_id', user.id)
          .eq('estado', 'pendiente')
          .in('asignacion_origen_id', ids)
        solicitadas = new Set((intercambios || []).map((row: any) => String(row.asignacion_origen_id)))
      }

      setFunciones((asignaciones || []).map((row: any) => {
        const capacidad = Array.isArray(row.ministerio_capacidades) ? row.ministerio_capacidades[0] : row.ministerio_capacidades
        return {
          id: String(row.id),
          nombre: String(capacidad?.nombre || 'Asignación'),
          solicitado: solicitadas.has(String(row.id)),
        }
      }))
    } finally {
      setCargandoFunciones(false)
    }
  }

  function toggleCambios() {
    const next = !cambiosOpen
    setCambiosOpen(next)
    if (next) void cargarFuncionesCambio()
  }

  async function solicitarCambio(funcion: FuncionCambio) {
    if (funcion.solicitado || solicitandoId) return
    setSolicitandoId(funcion.id)
    setMensaje('')

    try {
      const result = await solicitarCambioAsignacionMinisterial(funcion.id)
      if (result?.error) {
        setMensaje(result.error)
        return
      }

      setFunciones((current) => current.map((item) => (
        item.id === funcion.id ? { ...item, solicitado: true } : item
      )))
      setEstado('no_disponible')
      requestPendingIndicatorsRefresh()
      setMensaje(result?.alreadyPending ? 'La solicitud ya estaba pendiente.' : `Cambio solicitado para ${funcion.nombre}.`)
      router.refresh()
    } finally {
      setSolicitandoId(null)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => responder('confirmado')}
          disabled={isPending || Boolean(solicitandoId)}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'confirmado' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'} disabled:opacity-60`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {isPending && estado !== 'confirmado' ? 'Guardando…' : estado === 'confirmado' ? 'Confirmado' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={() => responder('no_disponible')}
          disabled={isPending || Boolean(solicitandoId)}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${estado === 'no_disponible' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'} disabled:opacity-60`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {isPending && estado !== 'no_disponible' ? 'Guardando…' : estado === 'no_disponible' ? 'No disponible' : 'No puedo servir'}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleCambios}
        disabled={isPending}
        className={`mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 text-left transition active:scale-[0.995] disabled:opacity-60 ${cambiosOpen ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}
        aria-expanded={cambiosOpen}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-extrabold">Solicitar cambio</span>
            <span className="block truncate text-[10px] font-medium text-slate-400">Elige la función que necesitas cubrir</span>
          </span>
        </span>
        <span className="text-lg font-light leading-none">{cambiosOpen ? '−' : '+'}</span>
      </button>

      {cambiosOpen && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="border-b border-slate-200 px-3.5 py-2.5">
            <p className="text-[10px] font-bold leading-4 text-slate-500">
              La solicitud se hace por función. Tu líder conservará la decisión final del reemplazo.
            </p>
          </div>

          {cargandoFunciones ? (
            <div className="flex min-h-16 items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando funciones…
            </div>
          ) : funciones.length === 0 ? (
            <p className="px-3.5 py-4 text-xs text-slate-400">No encontramos funciones disponibles para solicitar cambio.</p>
          ) : (
            <div>
              {funciones.map((funcion, index) => (
                <div key={funcion.id} className={`flex items-center justify-between gap-3 px-3.5 py-3 ${index < funciones.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-slate-700">{funcion.nombre}</span>
                  <button
                    type="button"
                    onClick={() => void solicitarCambio(funcion)}
                    disabled={funcion.solicitado || Boolean(solicitandoId)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold transition disabled:opacity-70 ${funcion.solicitado ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white active:scale-95'}`}
                  >
                    {solicitandoId === funcion.id ? 'Solicitando…' : funcion.solicitado ? 'Solicitud pendiente' : 'Solicitar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mensaje && (
        <p className={`mt-2 text-center text-[10px] font-extrabold ${mensaje === 'Guardado' || mensaje.startsWith('Cambio solicitado') || mensaje.includes('pendiente') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {mensaje}
        </p>
      )}
    </div>
  )
}
