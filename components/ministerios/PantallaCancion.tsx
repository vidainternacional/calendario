'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function PantallaCancion({ titulo, cerrar, children, pagina }: { titulo: string; cerrar: () => void; children: React.ReactNode; pagina?: string }) {
  const panel = useRef<HTMLElement>(null)
  const contenido = useRef<HTMLDivElement>(null)
  useEffect(() => { if (contenido.current) contenido.current.scrollTop = 0 }, [pagina])
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    const teclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); cerrar() }
      if (event.key !== 'Tab') return
      const elementos = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || [])
      const primero = elementos[0], ultimo = elementos.at(-1)
      if (event.shiftKey && (document.activeElement === primero || document.activeElement === panel.current)) { event.preventDefault(); ultimo?.focus() }
      else if (!event.shiftKey && (document.activeElement === ultimo || document.activeElement === panel.current)) { event.preventDefault(); primero?.focus() }
    }
    document.addEventListener('keydown', teclado)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', teclado); anterior?.focus() }
  }, [cerrar])
  return createPortal(<section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-[250] flex min-w-0 flex-col bg-[#f4f5f9] text-slate-900 outline-none">
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6"><h2 className="min-w-0 flex-1 break-words text-base font-bold">{titulo}</h2><button type="button" onClick={cerrar} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-600" aria-label="Cerrar vista grande"><X className="h-5 w-5" /></button></header>
    <div ref={contenido} className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6"><div className="mx-auto w-full max-w-4xl">{children}</div></div>
  </section>, document.body)
}
