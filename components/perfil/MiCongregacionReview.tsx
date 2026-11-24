'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ChevronDown } from 'lucide-react'
import { useMisSedes } from '@/lib/sedes/useMisSedes'
const signature = (ids: string[]) => [...ids].sort().join(',')
export default function MiCongregacionReview({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const { sedes, seleccion, loaded, saving, error, guardar, refresh } = useMisSedes(userId)
  const OPTIONS: [string, string][] = sedes.map(sede => [sede.id, sede.nombre])
  if (sedes.length > 1) OPTIONS.push([signature(sedes.map(sede => sede.id)), sedes.length === 2 ? 'Ambas congregaciones' : 'Todas las congregaciones'])
  OPTIONS.push(['', 'Todavía no pertenezco a una sede'])
  const saved = signature(seleccion.congregacion)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const id = useId()
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      if (event.key !== 'Tab') return
      const elements = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')
      if (!elements?.length) return
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])
  const apply = async (value: string) => {
    const result = await guardar('congregacion', value ? value.split(',') : [])
    if (result.success) { setOpen(false); setMessage('Congregación guardada en tu cuenta.') }
    else setMessage(result.error || 'No se pudo guardar.')
  }
  const label = !loaded ? 'Cargando…' : !seleccion.definida ? 'Sin seleccionar' : OPTIONS.find(o => o[0] === saved)?.[1] || 'Varias congregaciones'
  const shortLabel = !loaded ? 'Congregación' : !seleccion.definida ? 'Congregación' : seleccion.congregacion.length === 0 ? 'Sin sede' : seleccion.congregacion.length > 1 ? (sedes.length === 2 ? 'Ambas' : 'Varias') : sedes.find(sede => sede.id === seleccion.congregacion[0])?.nombre.replace(/^VIDA /, '') || 'Congregación'
  return <>
    {compact ? <button type="button" aria-label="Elegir congregación desde mi información" title={`Mi congregación: ${label}`} aria-haspopup="dialog" aria-expanded={open} className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:text-sm" onClick={() => { setMessage(''); setOpen(true) }}>
      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{shortLabel}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </button> : <div className="mt-5 flex min-w-0 items-center justify-between gap-3 border-t border-slate-200 pt-4 text-slate-800">
      <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">Mi congregación</p><p className="mt-1 break-words text-sm font-semibold">{label}</p></div>
      <button type="button" aria-label="Cambiar congregación en mi ficha" aria-haspopup="dialog" aria-expanded={open} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline underline-offset-4" onClick={() => { setMessage(''); setOpen(true) }}>{seleccion.definida ? 'Cambiar' : 'Elegir'}</button>
    </div>}
    {open && createPortal(<div className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/30 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-slate-800">
        <header className="flex items-center justify-between gap-3"><h3 id={`${id}-title`} className="text-lg font-bold">Mi congregación</h3><button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => setOpen(false)}>Cerrar</button></header>
        <p className="mt-2 text-sm leading-6">Es independiente de dónde vives y de las sedes que quieres ver en Inicio.</p>
        <fieldset className="mt-3"><legend className="sr-only">Congregación a la que pertenezco</legend>
          {OPTIONS.map(([value, name]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-sm">
            <input type="radio" name={`congregacion-${id}`} value={value} checked={loaded && seleccion.definida && saved === value} disabled={!loaded || saving} onChange={() => void apply(value)} className="h-5 w-5 accent-red-700" />
            {name}
          </label>)}
        </fieldset>
        <p className="mt-3 text-xs leading-5 text-slate-600">Cambiar tu congregación no te retira de tus equipos ni te inscribe en otros ministerios. Su liderazgo aprobará cada incorporación.</p>
        <p className="mt-3 text-xs leading-5 text-slate-600">La selección se guarda en tu cuenta y se conserva al entrar desde otro dispositivo.</p>


        {(error || !loaded) && <button type="button" className="mt-4 min-h-11 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white" onClick={() => void refresh()}>Volver a consultar</button>}
        <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{saving ? 'Guardando…' : message || error}</p>
      </section>
    </div>, document.body)}
  </>
}
