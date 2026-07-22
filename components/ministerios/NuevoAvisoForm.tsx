'use client'

import { useActionState } from 'react'
import { crearAviso } from '@/app/actions/avisos'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function NuevoAvisoForm({ ministerioId }: { ministerioId: string }) {
  const actionWithId = crearAviso.bind(null, ministerioId)
  const [state, action, pending] = useActionState(actionWithId, undefined)

  if (state?.success) {
    if (state.pendiente) {
      return (
        <div className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-[#171923]">Aviso en revisión</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
            Tu aviso ha sido enviado y será publicado una vez que sea aprobado por un administrador.
          </p>
          <Link
            href={ministerioId ? `/ministerios/${ministerioId}/avisos` : '/avisos'}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Volver a los avisos
          </Link>
        </div>
      )
    }

    redirect(ministerioId ? `/ministerios/${ministerioId}/avisos` : '/avisos')
  }

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-700">
          Título del aviso
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Ej: Reunión general este sábado"
          required
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cuerpo" className="block text-sm font-medium text-slate-700">
          Detalles
        </label>
        <textarea
          id="cuerpo"
          name="cuerpo"
          rows={6}
          placeholder="Escribe aquí los detalles del aviso..."
          required
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Link
          href={`/ministerios/${ministerioId}/avisos`}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-[#171923] transition-colors hover:bg-slate-300"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[2]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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
