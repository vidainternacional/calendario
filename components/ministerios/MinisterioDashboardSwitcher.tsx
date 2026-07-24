'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'

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
  const contenedorRef = useRef<HTMLDivElement>(null)
  const actual = ministerios.find((ministerio) => ministerio.id === actualId) ?? ministerios[0]

  useEffect(() => {
    if (!abierto) return

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }

    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [abierto])

  if (!actual) return null

  return (
    <div ref={contenedorRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg"
          style={{ backgroundColor: `${actual.color || '#6366f1'}18` }}
          aria-hidden="true"
        >
          {actual.emoji || '⛪'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Ministerio actual
          </span>
          <span className="block truncate text-sm font-bold text-[#171923]">{actual.nombre}</span>
        </span>

        {ministerios.length > 1 && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-600">
            {ministerios.length}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de ministerios"
            className="fixed inset-0 z-[120] cursor-default bg-black/10"
            onClick={() => setAbierto(false)}
          />

          <div
            role="menu"
            className="absolute left-0 right-0 z-[130] mt-2 max-h-[min(65dvh,420px)] overflow-y-auto overscroll-contain rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(20,24,40,0.2)]"
          >
            <div className="px-3 pb-2 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Cambiar ministerio</p>
            </div>

            <div className="space-y-1">
              {ministerios.map((ministerio) => {
                const seleccionado = ministerio.id === actualId

                return (
                  <Link
                    key={ministerio.id}
                    href={`/ministerios/${ministerio.id}/avisos`}
                    role="menuitem"
                    aria-current={seleccionado ? 'page' : undefined}
                    onClick={() => setAbierto(false)}
                    className={`flex min-h-14 min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                      seleccionado ? 'bg-indigo-50' : 'hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                      style={{ backgroundColor: `${ministerio.color || '#6366f1'}18` }}
                      aria-hidden="true"
                    >
                      {ministerio.emoji || '⛪'}
                    </span>
                    <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-[#171923]">
                      {ministerio.nombre}
                    </span>
                    {seleccionado && <Check className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />}
                  </Link>
                )
              })}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/ministerios"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50">
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">Ver todos los ministerios</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
