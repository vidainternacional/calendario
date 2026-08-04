'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { enviarNotificacionPrueba } from '@/app/actions/push'

export default function PushTestButton() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleTest = async () => {
    setLoading(true)
    setSent(false)
    setError('')

    const result = await enviarNotificacionPrueba()
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="space-y-2">
      <button
        id="push-test-btn"
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-50 active:scale-[.98] disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : error ? (
          <AlertCircle className="h-4 w-4 text-rose-500" />
        ) : sent ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {loading
          ? 'Enviando...'
          : error
            ? 'Revisar notificaciones'
            : sent
              ? '¡Notificación enviada!'
              : 'Enviar notificación de prueba'}
      </button>
      {error && <p className="break-words text-xs leading-relaxed text-rose-600">{error}</p>}
    </div>
  )
}
