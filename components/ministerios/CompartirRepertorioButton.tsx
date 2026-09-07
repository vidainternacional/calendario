'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, ChevronDown, Loader2, Share2 } from 'lucide-react'
import type { MinisterioCompartible } from '@/app/actions/repertorio-compartido'

type Props = {
  ministerios: MinisterioCompartible[]
  seleccionadosIniciales: string[]
  action: (destinos: string[]) => Promise<void>
}

export default function CompartirRepertorioButton({ ministerios, seleccionadosIniciales, action }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>(seleccionadosIniciales)
  const [guardados, setGuardados] = useState<string[]>(seleccionadosIniciales)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const seleccionadosSet = useMemo(() => new Set(seleccionados), [seleccionados])

  if (ministerios.length === 0) return null

  const alternar = (id: string) => {
    setSeleccionados((actuales) => actuales.includes(id) ? actuales.filter((item) => item !== id) : [...actuales, id])
    setMensaje(null)
  }

  const guardar = () => {
    setMensaje(null)
    startTransition(async () => {
      try {
        await action(seleccionados)
        setGuardados(seleccionados)
        setMensaje('Listado compartido actualizado.')
        setAbierto(false)
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : 'No fue posible compartir el listado.')
      }
    })
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={() => { setAbierto((value) => !value); setMensaje(null) }}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        aria-expanded={abierto}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
            <Share2 className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-slate-800">Compartir listado</span>
            <span className="block truncate text-[10px] text-slate-400">
              {guardados.length > 0 ? `${guardados.length} ${guardados.length === 1 ? 'ministerio' : 'ministerios'}` : 'Solo canciones y versiones'}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto ? (
        <div className="mt-3 border-y border-slate-200 bg-white">
          {ministerios.map((ministerio, index) => {
            const activo = seleccionadosSet.has(ministerio.id)
            return (
              <button
                key={ministerio.id}
                type="button"
                onClick={() => alternar(ministerio.id)}
                disabled={pending}
                className={`flex min-h-[52px] w-full items-center justify-between gap-3 px-1 py-2 text-left ${index > 0 ? 'border-t border-slate-100' : ''}`}
              >
                <span className="text-sm font-bold text-slate-700">{ministerio.nombre}</span>
                <span className={`grid h-6 w-6 place-items-center rounded-full border ${activo ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 text-transparent'}`}>
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
          <div className="border-t border-slate-200 py-3">
            <button
              type="button"
              onClick={guardar}
              disabled={pending}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar ministerios'}
            </button>
          </div>
        </div>
      ) : null}

      {mensaje ? <p className={`mt-2 text-[10px] font-semibold ${mensaje.startsWith('Listado') ? 'text-emerald-600' : 'text-rose-600'}`}>{mensaje}</p> : null}
    </div>
  )
}
