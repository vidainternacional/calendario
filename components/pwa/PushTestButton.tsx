'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { enviarNotificacionPrueba } from '@/app/actions/push'

export default function PushTestButton() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    setSent(false)
    await enviarNotificacionPrueba()
    setLoading(false)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <button
      id="push-test-btn"
      onClick={handleTest}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-600 px-5 py-3 rounded-[18px] text-sm font-semibold hover:bg-indigo-50 active:scale-[.98] transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : sent ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      {loading ? 'Enviando...' : sent ? '¡Notificación enviada!' : 'Enviar notificación de prueba'}
    </button>
  )
}
