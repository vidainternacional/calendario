'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight, Grid2X2, List, Rows3 } from 'lucide-react'
import { useState } from 'react'

export type PaqueteRecibido = {
  id: string
  titulo: string
  descripcion_publica: string | null
  published_at: string | null
  public_slug: string
  audiencia: string
}

type Vista = 'lista' | 'miniaturas' | 'compacta'

function fechaPaquete(value: string | null) {
  if (!value) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value))
}

const vistas: Array<{ id: Vista; label: string; Icon: typeof List }> = [
  { id: 'lista', label: 'Lista', Icon: List },
  { id: 'miniaturas', label: 'Miniaturas', Icon: Grid2X2 },
  { id: 'compacta', label: 'Compacta', Icon: Rows3 },
]

export default function PaquetesRecibidosClient({ paquetes }: { paquetes: PaqueteRecibido[] }) {
  const [vista, setVista] = useState<Vista>('lista')

  return (
    <>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-slate-400">{paquetes.length} paquete{paquetes.length === 1 ? '' : 's'}</p>
        <div className="inline-grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1" aria-label="Cambiar vista de paquetes">
          {vistas.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setVista(id)}
              aria-label={`Vista ${label}`}
              aria-pressed={vista === id}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[10px] font-bold transition ${
                vista === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {vista === 'lista' && (
        <section className="mt-3 overflow-hidden rounded-[24px] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {paquetes.map((paquete) => (
              <Link key={paquete.id} href={`/material/${paquete.public_slug}`} className="group flex min-h-[82px] items-center gap-3 px-4 py-3.5 active:bg-violet-50/40">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{paquete.titulo}</span>
                  <span className="mt-1 block line-clamp-1 text-[11px] text-slate-500">{paquete.descripcion_publica || 'Paquete pastoral recibido'}</span>
                  <span className="mt-1 block text-[9px] font-bold uppercase tracking-[.08em] text-violet-500">{fechaPaquete(paquete.published_at)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {vista === 'miniaturas' && (
        <section className="mt-3 grid grid-cols-2 gap-3">
          {paquetes.map((paquete) => (
            <Link key={paquete.id} href={`/material/${paquete.public_slug}`} className="group overflow-hidden rounded-[22px] bg-white shadow-[0_7px_22px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 active:scale-[.99]">
              <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-violet-50 via-white to-indigo-50">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{paquete.titulo}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[.08em] text-violet-500">{fechaPaquete(paquete.published_at)}</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {vista === 'compacta' && (
        <section className="mt-3 overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-200">
          <div className="divide-y divide-slate-100">
            {paquetes.map((paquete) => (
              <Link key={paquete.id} href={`/material/${paquete.public_slug}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5 active:bg-violet-50/35">
                <BookOpen className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">{paquete.titulo}</span>
                  <span className="mt-0.5 block text-[9px] text-slate-400">{fechaPaquete(paquete.published_at)}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
