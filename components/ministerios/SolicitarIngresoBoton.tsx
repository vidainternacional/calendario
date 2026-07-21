'use client'

import { mostrarToast } from '@/lib/ui/toast'

import { useState } from 'react'
import { solicitarIngreso } from '@/app/actions/ministerios'
import { Check, Plus } from 'lucide-react'

export default function SolicitarIngresoBoton({ ministerioId, estadoActual }: { ministerioId: string, estadoActual: 'ninguno' | 'pendiente' | 'rechazada' }) {
  const [loading, setLoading] = useState(false)

  if (estadoActual === 'pendiente') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
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
      onClick={handleSolicitar}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Enviando...' : (
        <>
          <Plus className="w-3.5 h-3.5" />
          Solicitar unirme
        </>
      )}
    </button>
  )
}
