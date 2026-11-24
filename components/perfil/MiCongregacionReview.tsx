'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
const EVENT = 'vida:congregacion-review'
const OPTIONS = [ ['santa-ana', 'VIDA Santa Ana'], ['chalchuapa', 'VIDA Chalchuapa'], ['ambas', 'Ambas congregaciones'], ['ninguna', 'Todavía no pertenezco a una sede'] ] as const
const normalize = (v: string | null) => OPTIONS.some(o => o[0] === v) ? v || '' : ''
function subscribe(fn: () => void) {
  window.addEventListener('storage', fn); window.addEventListener(EVENT, fn)
  return () => { window.removeEventListener('storage', fn); window.removeEventListener(EVENT, fn) }
}
export default function MiCongregacionReview({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const key = `vida:congregacion:review:v1:${userId}`
  const saved = useSyncExternalStore(subscribe, () => { try { return normalize(localStorage.getItem(key)) } catch { return '' } }, () => '')
  const [draft, setDraft] = useState('')
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
      const elements = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input')
      if (!elements?.length) return
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])
  const apply = (value: string) => {
    setDraft(value)
    try { localStorage.setItem(key, value); window.dispatchEvent(new Event(EVENT)); setOpen(false); setMessage('') }
    catch { setMessage('No se pudo guardar en este dispositivo. Puedes reintentar sin perder la selección.') }
  }
  const label = OPTIONS.find(o => o[0] === saved)?.[1] || 'Sin seleccionar'
  return <>
    <div className={compact ? 'min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800' : 'mt-5 flex min-w-0 items-center justify-between gap-3 border-t border-slate-200 pt-4 text-slate-800'}>
      <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{compact ? 'Congregación a la que asisto' : 'Mi congregación'}</p><p className="mt-1 break-words text-sm font-semibold">{label}</p></div>
      <button type="button" aria-label={compact ? 'Elegir congregación desde mi información' : 'Cambiar congregación en mi ficha'} aria-haspopup="dialog" aria-expanded={open} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline underline-offset-4" onClick={() => { setDraft(saved); setMessage(''); setOpen(true) }}>{saved ? 'Cambiar' : 'Elegir'}</button>
    </div>
    {open && createPortal(<div className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/30 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-slate-800">
        <header className="flex items-center justify-between gap-3"><h3 id={`${id}-title`} className="text-lg font-bold">Mi congregación</h3><button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={() => setOpen(false)}>Cerrar</button></header>
        <p className="mt-2 text-sm leading-6">Es independiente de dónde vives y de las sedes que quieres ver en Inicio.</p>
        <fieldset className="mt-3"><legend className="sr-only">Congregación a la que pertenezco</legend>
          {OPTIONS.map(([value, name]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-sm">
            <input type="radio" name={`congregacion-${id}`} value={value} checked={draft === value} onChange={() => apply(value)} className="h-5 w-5 accent-red-700" />
            {name}
          </label>)}
        </fieldset>
        <p className="mt-3 text-xs leading-5 text-slate-600">Cambiar tu congregación no te retira de tus equipos ni te inscribe en otros ministerios. Su liderazgo aprobará cada incorporación.</p>
        <p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-900">Revisión: guarda la selección en este dispositivo y actualiza ambos lugares del Perfil. Todavía no cambia tu cuenta ni permisos.</p>


        {message && <button type="button" className="mt-4 min-h-11 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white" onClick={() => apply(draft)}>Reintentar</button>}
        <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{message}</p>
      </section>
    </div>, document.body)}
  </>
}
