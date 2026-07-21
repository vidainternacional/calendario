'use client'

import { mostrarToast } from '@/lib/ui/toast'

import { useState } from 'react'
import { responderPregunta } from '@/app/actions/preguntas'
import { Loader2, Send } from 'lucide-react'

export default function ResponderPreguntaForm({ preguntaId }: { preguntaId: string }) {
  const [respuesta, setRespuesta] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!respuesta.trim()) return

    setLoading(true)
    const res = await responderPregunta(preguntaId, respuesta)
    if (!res?.success) {
      mostrarToast(res?.error || 'Ocurrió un error al responder.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        required
        rows={3}
        placeholder="Escribe tu respuesta aquí..."
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !respuesta.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Responder
            </>
          )}
        </button>
      </div>
    </form>
  )
}
