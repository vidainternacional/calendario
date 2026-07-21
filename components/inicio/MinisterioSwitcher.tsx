'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutGrid } from 'lucide-react'

type Mem = { ministerio_id: string; es_lider: boolean; nombre: string; emoji: string; color: string }

export default function MinisterioSwitcher({ membresias }: { membresias: Mem[] }) {
  const [abierto, setAbierto] = useState(false)
  if (!membresias.length) return null
  const principal = membresias[0]

  return (
    <div className="relative mb-5">
      <button onClick={() => setAbierto(v => !v)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white text-sm font-bold shadow-sm"
        style={{ background: principal.color }}>
        <span className="text-lg">{principal.emoji}</span>
        {principal.nombre}
        {membresias.length > 1 && <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-md">+{membresias.length - 1}</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute z-50 mt-2 w-72 max-w-[85vw] bg-white rounded-2xl border border-slate-100 shadow-xl p-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-3 pt-2 pb-1">Mis ministerios</p>
            {membresias.map(m => (
              <Link key={m.ministerio_id} href={`/ministerios/${m.ministerio_id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                <span className="w-9 h-9 rounded-xl grid place-items-center text-lg text-white" style={{ background: m.color }}>{m.emoji}</span>
                <span className="flex-1 text-sm font-semibold text-[#171923]">{m.nombre}</span>
                {m.es_lider && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">LÍDER</span>}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <Link href="/ministerios" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-indigo-600">
                <LayoutGrid className="w-4 h-4" /> Ver todos los ministerios
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
