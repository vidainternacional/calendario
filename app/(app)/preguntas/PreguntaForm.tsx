'use client'

import { useActionState, useEffect, useRef } from 'react'
import { enviarPregunta, type PreguntaState } from '@/app/actions/preguntas'
import { Loader2, Send } from 'lucide-react'

export default function PreguntaForm() {
  const [state, action, pending] = useActionState<PreguntaState, FormData>(enviarPregunta, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      alert('Tu pregunta ha sido enviada con éxito.')
    }
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-5 relative z-10">
      {state?.error && (
        <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm border border-red-100">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="texto" className="block text-sm font-semibold text-[#171923] mb-2">
          ¿En qué podemos ayudarte?
        </label>
        <textarea
          id="texto"
          name="texto"
          required
          rows={4}
          placeholder="Escribe tu mensaje aquí..."
          className="w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-sm text-[#171923] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="relative flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="anonima"
              name="anonima"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label htmlFor="anonima" className="font-medium text-[#171923]">
              Enviar de forma anónima
            </label>
            <p className="text-gray-500 text-xs">Tu nombre no será visible para los pastores.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#171923] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-md shadow-gray-200"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar mensaje
          </>
        )}
      </button>
    </form>
  )
}
