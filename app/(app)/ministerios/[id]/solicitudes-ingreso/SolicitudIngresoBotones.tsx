'use client'

import { useRouter } from 'next/navigation'
import { mostrarToast } from '@/lib/ui/toast'
import { useState } from 'react'
import { aprobarSolicitudIngreso, rechazarSolicitudIngreso } from '@/app/actions/ministerios'
import { requestPendingIndicatorsRefresh } from '@/components/notificaciones/usePendingIndicators'
import { CheckCircle, XCircle } from 'lucide-react'

export default function SolicitudIngresoBotones({
  solicitudId,
  profileId,
  ministerioId,
}: {
  solicitudId: string
  profileId: string
  ministerioId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const completar = () => {
    requestPendingIndicatorsRefresh()
    router.refresh()
    setLoading(false)
  }

  const handleAprobar = async () => {
    setLoading(true)
    const res = await aprobarSolicitudIngreso(solicitudId, profileId, ministerioId)
    if (!res.success) {
      mostrarToast(res.error)
      setLoading(false)
      return
    }
    completar()
  }

  const handleRechazar = async () => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return
    setLoading(true)
    const res = await rechazarSolicitudIngreso(solicitudId, ministerioId)
    if (!res.success) {
      mostrarToast(res.error)
      setLoading(false)
      return
    }
    completar()
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={handleAprobar}
        disabled={loading}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle className="h-4 w-4" />
        Aprobar
      </button>
      <button
        type="button"
        onClick={handleRechazar}
        disabled={loading}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XCircle className="h-4 w-4" />
        Rechazar
      </button>
    </div>
  )
}
