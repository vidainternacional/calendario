'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Church, X } from 'lucide-react'
import { useMisSedes } from '@/lib/sedes/useMisSedes'

export default function SedesVisiblesSelector({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const { sedes, seleccion, loaded, saving, error, guardar, refresh } = useMisSedes(userId)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const elegidas = sedes.filter(sede => seleccion.visibles.includes(sede.id))
  const label = elegidas.length === 1 ? elegidas[0].nombre.replace(/^VIDA /, '') : elegidas.length === 2 && sedes.length === 2 ? 'Ambas' : elegidas.length ? 'Varias' : 'Sedes'
  const badge = elegidas.length === 1 ? elegidas[0].slug === 'santa-ana' ? 'SA' : elegidas[0].slug === 'chalchuapa' ? 'CH' : elegidas[0].nombre.replace(/^VIDA /, '').slice(0, 2).toUpperCase() : elegidas.length || '…'

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
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

  const change = async (sede: string) => {
    const ids = seleccion.visibles.includes(sede) ? seleccion.visibles.filter(id => id !== sede) : [...seleccion.visibles, sede]
    if (!ids.length) { setNotice('Mantén al menos una sede activa. Puedes activar la otra antes de desmarcar esta.'); return }
    const result = await guardar('visibles', ids)
    setNotice(result.success ? 'Selección guardada en tu cuenta.' : result.error || 'No se pudo guardar.')
  }

  return <>
    <button ref={trigger} type="button" aria-label={`Sedes visibles: ${label}. Elegir sedes`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setNotice('') }} className="flex w-14 shrink-0 flex-col items-center text-slate-800">
      <span className="relative grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700 ring-1 ring-rose-200">
        <Church className="h-6 w-6" aria-hidden="true" />
        <span className="absolute -bottom-0.5 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-700 px-1 text-[9px] font-bold text-white ring-2 ring-[#f4f5f9]" aria-hidden="true">{badge}</span>
      </span>
      <span className="mt-1 text-[10px] font-semibold leading-3">{label}</span>
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-950/30 p-3 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
        <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="visible-sedes-title" className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-slate-900">
          <header className="flex items-center justify-between gap-3"><h2 id="visible-sedes-title" className="text-lg font-bold">Qué sedes quieres ver</h2><button type="button" aria-label="Cerrar selector de sedes" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"><X className="h-5 w-5" /></button></header>
          <p className="mt-2 text-sm leading-6 text-slate-600">Puedes activar una sede o las dos. Esta elección es distinta de la sede a la que perteneces.</p>
          <fieldset className="mt-4 divide-y divide-slate-100">
            <legend className="sr-only">Sedes visibles</legend>
            {sedes.map(sede => <label key={sede.id} className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3 text-sm font-semibold"><span>{sede.nombre.replace(/^VIDA /, '')}</span><input type="checkbox" className="h-5 w-5 accent-red-700" checked={seleccion.visibles.includes(sede.id)} disabled={!loaded || saving} onChange={() => void change(sede.id)} />
              </label>)}
          </fieldset>
          <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{saving ? 'Guardando…' : notice || error || (!loaded ? 'Cargando sedes…' : '')}</p>
          {error && <button type="button" className="min-h-11 text-sm font-semibold underline" onClick={() => void refresh()}>Volver a consultar</button>}
          <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-900">Tu preferencia ya se guarda en tu cuenta. Inicio muestra la información pública de las sedes elegidas; los mensajes privados autorizados siguen disponibles. No cambia tu pertenencia, ministerios ni permisos.</p>
          <button type="button" onClick={() => setOpen(false)} className="mt-5 min-h-11 w-full rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">Listo</button>
        </section>
      </div>, document.body)}
  </>
}
