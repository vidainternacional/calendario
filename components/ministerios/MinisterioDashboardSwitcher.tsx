'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, LayoutGrid } from 'lucide-react'

type MinisterioAccesible = {
  id: string
  nombre: string
  emoji: string | null
  color: string | null
}

export default function MinisterioDashboardSwitcher({
  actualId,
  ministerios,
}: {
  actualId: string
  ministerios: MinisterioAccesible[]
}) {
  const [abierto, setAbierto] = useState(false)
  const actual = ministerios.find((ministerio) => ministerio.id === actualId) ?? ministerios[0]

  useEffect(() => {
    if (!abierto) return

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  if (!actual) return null

  return (
    <div className="relative ml-auto shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Cambiar ministerio. Actual: ${actual.nombre}`}
        className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-white text-xl shadow-[0_6px_20px_rgba(20,24,40,0.18)] ring-1 ring-slate-200 transition-transform active:scale-95"
        style={{ backgroundColor: `${actual.color || '#6366f1'}18` }}
      >
        <span aria-hidden="true">{actual.emoji || '⛪'}</span>
        {ministerios.length > 1 && (
          <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[9px] font-bold text-white">
            {ministerios.length}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de ministerios"
            className="fixed inset-0 z-[120] cursor-default bg-slate-950/25 backdrop-blur-[2px]"
            onClick={() => setAbierto(false)}
          />

          <div
            role="menu"
            aria-label="Cambiar de ministerio"
            className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[130] mx-auto max-h-[min(72dvh,32rem)] max-w-sm overflow-y-auto overscroll-contain rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(20,24,40,0.28)]"
          >
            <div className="px-2 pb-3 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Cambiar cuenta</p>
              <h2 className="mt-1 text-lg font-bold text-[#171923]">Tus ministerios</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Selecciona el ministerio que deseas consultar o administrar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-2">
              {ministerios.map((ministerio) => {
                const seleccionado = ministerio.id === actualId

                return (
                  <Link
                    key={ministerio.id}
                    href={`/ministerios/${ministerio.id}`}
                    role="menuitem"
                    aria-current={seleccionado ? 'page' : undefined}
                    onClick={() => setAbierto(false)}
                    className={`relative flex min-w-0 flex-col items-center rounded-2xl px-2 py-3 text-center transition-colors ${
                      seleccionado ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <span
                      className="grid h-14 w-14 place-items-center rounded-full border-2 border-white text-2xl shadow-md ring-1 ring-slate-200"
                      style={{ backgroundColor: `${ministerio.color || '#6366f1'}20` }}
                      aria-hidden="true"
                    >
                      {ministerio.emoji || '⛪'}
                    </span>
                    <span className="mt-2 line-clamp-2 break-words text-[11px] font-semibold leading-tight text-[#171923]">
                      {ministerio.nombre}
                    </span>
                    {seleccionado && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <Link
                href="/ministerios"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50">
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">Ver y solicitar otros ministerios</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
