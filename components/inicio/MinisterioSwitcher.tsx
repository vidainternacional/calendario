'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'

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

  if (membresias.length === 1) {
    return (
      <section aria-label="Mi ministerio">
        <Link
          href={`/ministerios/${principal.ministerio_id}`}
          className="group flex min-h-[76px] items-center gap-3 rounded-[24px] border border-white/90 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition active:scale-[0.992]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl ring-1 ring-slate-100">{principal.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: principal.color }} aria-hidden="true" />
              Mi ministerio
            </span>
            <span className="mt-0.5 block truncate text-sm font-bold text-[#171923]">{principal.nombre}</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">{principal.es_lider ? 'Administra tu equipo y consulta su actividad.' : 'Consulta tu equipo, actividades y recursos.'}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {principal.es_lider && <span className="hidden rounded-full bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100 min-[390px]:inline-flex">Líder</span>}
            <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      </section>
    )
  }

  return (
    <section aria-label="Mis ministerios" ref={menuRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex min-h-[76px] w-full items-center gap-3 rounded-[24px] border border-white/90 bg-white px-4 py-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition active:scale-[0.992]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl ring-1 ring-slate-100">{principal.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: principal.color }} aria-hidden="true" />
            Mis ministerios
          </span>
          <span className="mt-0.5 block truncate text-sm font-bold text-[#171923]">{principal.nombre}</span>
          <span className="mt-0.5 block text-[11px] text-slate-500">Tienes acceso a {membresias.length} ministerios.</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-extrabold text-indigo-700 ring-1 ring-indigo-100">{membresias.length}</span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-500">
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
          </span>
        </span>
      </button>

      {abierto && (
        <>
          <button type="button" aria-label="Cerrar selector de ministerios" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setAbierto(false)} />
          <div role="menu" className="absolute left-0 right-0 z-50 mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] [-webkit-overflow-scrolling:touch]">
            <div className="px-3 pb-2 pt-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Mis ministerios</p>
              <p className="mt-1 text-xs text-slate-500">Elige el equipo que deseas consultar.</p>
            </div>
            <div className="space-y-1">
              {membresias.map((ministerio, index) => (
                <Link
                  key={ministerio.ministerio_id}
                  href={`/ministerios/${ministerio.ministerio_id}`}
                  role="menuitem"
                  onClick={() => setAbierto(false)}
                  className="flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors active:bg-slate-100"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg ring-1 ring-slate-100">{ministerio.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ministerio.color }} aria-hidden="true" />
                      <span className="truncate text-sm font-semibold text-[#171923]">{ministerio.nombre}</span>
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-400">{index === 0 ? 'Ministerio principal' : ministerio.es_lider ? 'Liderazgo' : 'Miembro'}</span>
                  </span>
                  {ministerio.es_lider && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">Líder</span>}
                </Link>
              ))}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/ministerios"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors active:bg-indigo-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50"><LayoutGrid className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">Ver todos los ministerios</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
