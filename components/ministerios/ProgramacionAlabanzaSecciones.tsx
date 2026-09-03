'use client'

import { useState, type ReactNode } from 'react'
import { Music2, Palette, Users } from 'lucide-react'

type Seccion = 'equipo' | 'repertorio' | 'paleta'

type Props = {
  equipoCount: number
  repertorioCount: number
  paletaLista: boolean
  equipo: ReactNode
  repertorio: ReactNode
  paleta: ReactNode
}

const opciones: Array<{ id: Seccion; label: string; icon: typeof Users }> = [
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'repertorio', label: 'Repertorio', icon: Music2 },
  { id: 'paleta', label: 'Paleta', icon: Palette },
]

export default function ProgramacionAlabanzaSecciones({
  equipoCount,
  repertorioCount,
  paletaLista,
  equipo,
  repertorio,
  paleta,
}: Props) {
  const [activa, setActiva] = useState<Seccion | null>(null)

  const contenido = activa === 'equipo' ? equipo : activa === 'repertorio' ? repertorio : activa === 'paleta' ? paleta : null

  const estado = (id: Seccion) => {
    if (id === 'equipo') return String(equipoCount)
    if (id === 'repertorio') return String(repertorioCount)
    return paletaLista ? '✓' : '—'
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 border-y border-slate-200 py-4">
        {opciones.map(({ id, label, icon: Icon }) => {
          const seleccionada = activa === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiva(seleccionada ? null : id)}
              aria-expanded={seleccionada}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              <span className={`relative grid h-14 w-14 place-items-center rounded-full transition-all duration-200 ${seleccionada ? 'scale-105 bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                <Icon className="h-5 w-5" />
                <span className={`absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-black ${seleccionada ? 'bg-white text-indigo-700' : 'bg-slate-900 text-white'}`}>
                  {estado(id)}
                </span>
              </span>
              <span className={`truncate text-[11px] font-extrabold ${seleccionada ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className={`grid transition-all duration-250 ease-out ${activa ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {contenido ? <div className="pt-5">{contenido}</div> : null}
        </div>
      </div>
    </div>
  )
}
