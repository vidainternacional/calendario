'use client'

import { mostrarToast } from '@/lib/ui/toast'

import { useState } from 'react'
import { aprobarAviso, rechazarAviso } from '@/app/actions/avisos'
import { CheckCircle, XCircle } from 'lucide-react'

export default function BotonesAprobacionAviso({ avisoId }: { avisoId: string }) {
  const [loading, setLoading] = useState(false)

  const handleAprobar = async () => {
    setLoading(true)
    const res = await aprobarAviso(avisoId)
    if (!res?.success) {
      mostrarToast(res?.error || 'Error al aprobar aviso')
      setLoading(false)
    }
  }

  const handleRechazar = async () => {
    if (!confirm('¿Estás seguro de rechazar este aviso global?')) return
    setLoading(true)
    const res = await rechazarAviso(avisoId)
    if (!res?.success) {
      mostrarToast(res?.error || 'Error al rechazar aviso')
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleAprobar}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" /> Aprobar y Notificar
      </button>
      <button 
        onClick={handleRechazar}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <XCircle className="w-4 h-4" /> Rechazar
      </button>
    </div>
  )
}
