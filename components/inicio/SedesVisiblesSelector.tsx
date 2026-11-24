'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { normalizeVisibleSedes, toggleVisibleSede, visibleSedesKey, type VisibleSedes } from '@/lib/inicio/sedes-visibles'

const CHANGE = 'vida:sedes-visibles:changed'
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(CHANGE, listener)
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(CHANGE, listener) }
}
const LABELS = { 'santa-ana': 'Santa Ana', chalchuapa: 'Chalchuapa', ambas: 'Ambas' }

export default function SedesVisiblesSelector({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [fallback, setFallback] = useState<{ owner: string; value: VisibleSedes } | null>(null)
  const [notice, setNotice] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const choice = useSyncExternalStore(subscribe, () => {
    if (fallback?.owner === userId) return fallback.value
    try { return normalizeVisibleSedes(window.localStorage.getItem(visibleSedesKey(userId))) }
    catch { return fallback?.owner === userId ? fallback.value : 'ambas' }
  }, () => 'ambas' as VisibleSedes)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
      if (event.key !== 'Tab') return
      const elements = panel.current?.querySelectorAll<HTMLElement>('button,input')
      if (!elements?.length) return
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])

  const change = (sede: 'santa-ana' | 'chalchuapa') => {
    const value = toggleVisibleSede(choice, sede)
    if (value === choice) { setNotice('Mantén al menos una sede activa. Puedes activar la otra antes de desmarcar esta.'); return }
    try { window.localStorage.setItem(visibleSedesKey(userId), value); setFallback(null); setNotice('Selección de revisión guardada en este dispositivo.') }
    catch { setFallback({ owner: userId, value }); setNotice('La selección es temporal: el navegador no permite guardarla.') }
    window.dispatchEvent(new Event(CHANGE))
  }

  return <>
    <button ref={trigger} type="button" aria-label={`Sedes visibles: ${LABELS[choice]}. Elegir sedes`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setNotice('') }} className="flex w-14 shrink-0 flex-col items-center text-slate-800">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-base font-bold ring-1 ring-slate-200">{choice === 'santa-ana' ? 'SA' : choice === 'chalchuapa' ? 'CH' : '2'}</span>
      <span className="mt-1 text-[10px] font-semibold leading-3">{LABELS[choice]}</span>
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-950/30 p-3 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
        <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="visible-sedes-title" className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-slate-900">
          <header className="flex items-center justify-between gap-3"><h2 id="visible-sedes-title" className="text-lg font-bold">Qué sedes quieres ver</h2><button type="button" aria-label="Cerrar selector de sedes" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"><X className="h-5 w-5" /></button></header>
          <p className="mt-2 text-sm leading-6 text-slate-600">Puedes activar una sede o las dos. Esta elección es distinta de la sede a la que perteneces.</p>
          <fieldset className="mt-4 divide-y divide-slate-100">
            <legend className="sr-only">Sedes visibles</legend>
            {(['santa-ana', 'chalchuapa'] as const).map(sede => <label key={sede} className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3 text-sm font-semibold"><span>{LABELS[sede]}</span><input type="checkbox" className="h-5 w-5 accent-red-700" checked={choice === 'ambas' || choice === sede} onChange={() => change(sede)} />
              </label>)}
          </fieldset>
          <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{notice}</p>
          <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-900">Selector en revisión: todavía no filtra las publicaciones reales. No cambia tu pertenencia, ministerios ni permisos.</p>
          <button type="button" onClick={() => setOpen(false)} className="mt-5 min-h-11 w-full rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">Listo</button>
        </section>
      </div>, document.body)}
  </>
}
