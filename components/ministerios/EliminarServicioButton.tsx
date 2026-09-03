'use client'

import { useState, useTransition } from 'react'
import { Trash2, X } from 'lucide-react'
import { eliminarServicioAlabanza } from '@/app/actions/eliminar-servicio-alabanza'

export default function EliminarServicioButton({
  ministerioId,
  eventoId,
  mes,
  dia,
}: {
  ministerioId: string
  eventoId: string
  mes: string
  dia: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const eliminar = () => {
    startTransition(async () => {
      await eliminarServicioAlabanza(ministerioId, eventoId, mes, dia)
    })
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`grid h-9 w-9 place-items-center rounded-full transition ${open ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400 active:bg-rose-50 active:text-rose-600'}`}
        aria-label={open ? 'Cerrar opción de eliminar' : 'Eliminar servicio'}
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <div
        className={`absolute inset-x-3 z-10 grid transition-all duration-200 ease-out ${open ? 'mt-2 grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-rose-100">
            <p className="min-w-0 text-[11px] leading-4 text-slate-600">
              ¿Eliminar este servicio? Se quitará del calendario y de Alabanza.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={eliminar}
              className="h-9 shrink-0 rounded-xl bg-rose-600 px-3 text-[11px] font-extrabold text-white disabled:opacity-50"
            >
              {pending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
