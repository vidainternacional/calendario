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
      <label htmlFor={`respuesta-${preguntaId}`} className="text-sm font-semibold text-[#171923]">
        Escribir respuesta
      </label>
      <textarea
        id={`respuesta-${preguntaId}`}
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        required
        rows={4}
        placeholder="Escribe tu respuesta aquí..."
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#171923] placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        type="submit"
        disabled={loading || !respuesta.trim()}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Responder
          </>
        )}
      </button>
    </form>
  )
}
