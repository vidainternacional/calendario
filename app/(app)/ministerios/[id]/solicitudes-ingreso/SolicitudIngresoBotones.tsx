'use client'

import { mostrarToast } from '@/lib/ui/toast'

import { useState } from 'react'
import { aprobarSolicitudIngreso, rechazarSolicitudIngreso } from '@/app/actions/ministerios'
import { CheckCircle, XCircle } from 'lucide-react'

export default function SolicitudIngresoBotones({ 
  solicitudId, 
  profileId, 
  ministerioId 
}: { 
  solicitudId: string, 
  profileId: string, 
  ministerioId: string 
}) {
  const [loading, setLoading] = useState(false)

  const handleAprobar = async () => {
    setLoading(true)
    const res = await aprobarSolicitudIngreso(solicitudId, profileId, ministerioId)
    if (!res.success) {
      mostrarToast(res.error)
      setLoading(false)
    }
  }

  const handleRechazar = async () => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return
    setLoading(true)
    const res = await rechazarSolicitudIngreso(solicitudId, ministerioId)
    if (!res.success) {
      mostrarToast(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleAprobar}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" /> Aprobar
      </button>
      <button 
        onClick={handleRechazar}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <XCircle className="w-4 h-4" /> Rechazar
      </button>
    </div>
  )
}
