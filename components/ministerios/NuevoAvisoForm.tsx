'use client'

import { useActionState } from 'react'
import { crearAviso } from '@/app/actions/avisos'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoAvisoForm({ ministerioId }: { ministerioId: string }) {
  // Bind the ministerioId to the action
  const actionWithId = crearAviso.bind(null, ministerioId)
  const [state, action, pending] = useActionState(actionWithId, undefined)

  return (
    <form action={action} className="space-y-6">
      {/* Error */}
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Título */}
      <div className="space-y-1.5">
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-300">
          Título del aviso
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Ej: Reunión general este sábado"
          required
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Cuerpo */}
      <div className="space-y-1.5">
        <label htmlFor="cuerpo" className="block text-sm font-medium text-slate-300">
          Detalles
        </label>
        <textarea
          id="cuerpo"
          name="cuerpo"
          rows={6}
          placeholder="Escribe aquí los detalles del aviso..."
          required
          className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Link 
          href={`/ministerios/${ministerioId}/avisos`}
          className="flex-1 text-center rounded-xl bg-slate-200 hover:bg-slate-300 px-4 py-3 text-sm font-semibold text-[#171923] transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar aviso'
          )}
        </button>
      </div>
    </form>
  )
}
