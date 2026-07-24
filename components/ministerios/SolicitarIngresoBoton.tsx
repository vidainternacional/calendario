'use client'

import { mostrarToast } from '@/lib/ui/toast'
import { useState } from 'react'
import { solicitarIngreso } from '@/app/actions/ministerios'
import { Loader2, Plus } from 'lucide-react'

export default function SolicitarIngresoBoton({ ministerioId, estadoActual }: { ministerioId: string, estadoActual: 'ninguno' | 'pendiente' | 'rechazada' }) {
  const [loading, setLoading] = useState(false)

  if (estadoActual === 'pendiente') {
    return (
      <span className="inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-600">
        Solicitud pendiente
      </span>
    )
  }

  const handleSolicitar = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await solicitarIngreso(ministerioId)
    if (!res.success) {
      mostrarToast(res.error)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSolicitar}
      disabled={loading}
      className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          Enviando…
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          Solicitar unirme
        </>
      )}
    </button>
  )
}
