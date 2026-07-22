'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutGrid } from 'lucide-react'

type Mem = { ministerio_id: string; es_lider: boolean; nombre: string; emoji: string; color: string }

export default function MinisterioSwitcher({ membresias }: { membresias: Mem[] }) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [abierto])

  if (!membresias.length) return null
  const principal = membresias[0]

  return (
    <div ref={menuRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="w-full min-h-16 flex items-center gap-3 rounded-[20px] border border-white/20 px-4 py-3 text-left text-white shadow-[0_8px_24px_rgba(20,24,40,0.12)] transition-transform active:scale-[0.99]"
        style={{ background: `linear-gradient(135deg, ${principal.color}, ${principal.color}dd)` }}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/20">
          {principal.emoji}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
            Mi ministerio
          </span>
          <span className="mt-0.5 block truncate text-sm font-bold sm:text-base">
            {principal.nombre}
          </span>
        </span>

        {membresias.length > 1 && (
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold ring-1 ring-white/20">
            +{membresias.length - 1}
          </span>
        )}

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector de ministerios"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setAbierto(false)}
          />

          <div
            role="menu"
            className="absolute left-0 right-0 z-50 mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(20,24,40,0.18)]"
          >
            <div className="px-3 pb-2 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Mis ministerios</p>
              <p className="mt-1 text-xs text-slate-500">Selecciona el espacio que deseas administrar o consultar.</p>
            </div>

            <div className="space-y-1">
              {membresias.map((m, index) => (
                <Link
                  key={m.ministerio_id}
                  href={`/ministerios/${m.ministerio_id}`}
                  role="menuitem"
                  onClick={() => setAbierto(false)}
                  className="flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-slate-50 active:bg-slate-100"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-white shadow-sm"
                    style={{ background: m.color }}
                  >
                    {m.emoji}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold leading-snug text-[#171923]">{m.nombre}</span>
                    {index === 0 && (
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Ministerio principal</span>
                    )}
                  </span>

                  {m.es_lider && (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
                      LÍDER
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/ministerios"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50">
                  <LayoutGrid className="h-4 w-4" />
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
