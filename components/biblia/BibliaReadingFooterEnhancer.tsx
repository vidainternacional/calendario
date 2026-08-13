'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function BibliaReadingFooterEnhancer() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [capitulo, setCapitulo] = useState(1)
  const [maxCapitulos, setMaxCapitulos] = useState(1)

  useEffect(() => {
    let mount: HTMLDivElement | null = null
    const sincronizar = () => {
      const select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!select) return false
      setCapitulo(Number(select.value) || 1)
      setMaxCapitulos(Math.max(1, select.options.length))
      const sticky = select.closest('.sticky') as HTMLElement | null
      const isla = sticky?.parentElement as HTMLElement | null
      const envoltura = isla?.parentElement as HTMLElement | null
      if (!isla || !envoltura) return false
      isla.dataset.bibliaIslaExtendida = 'true'
      envoltura.dataset.bibliaEnvolturaExtendida = 'true'
      const articulo = isla.querySelector<HTMLElement>('article [id^="versiculo-"]')?.closest('article') as HTMLElement | null
      if (!articulo) return true
      const existente = isla.querySelector<HTMLElement>('[data-biblia-navegacion-inferior="true"]')
      if (existente) { setTarget(existente); return true }
      mount = document.createElement('div')
      mount.dataset.bibliaNavegacionInferior = 'true'
      articulo.insertAdjacentElement('afterend', mount)
      setTarget(mount)
      return true
    }
    const onChange = (event: Event) => {
      const elemento = event.target
      if (elemento instanceof HTMLSelectElement && elemento.getAttribute('aria-label') === 'Capítulo') sincronizar()
    }
    sincronizar()
    document.addEventListener('change', onChange)
    const observer = new MutationObserver(() => sincronizar())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect(); document.removeEventListener('change', onChange); mount?.remove()
      document.querySelector('[data-biblia-isla-extendida="true"]')?.removeAttribute('data-biblia-isla-extendida')
      document.querySelector('[data-biblia-envoltura-extendida="true"]')?.removeAttribute('data-biblia-envoltura-extendida')
    }
  }, [])

  const mover = (direccion: -1 | 1) => {
    const select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
    if (!select) return
    const siguiente = Math.min(maxCapitulos, Math.max(1, Number(select.value) + direccion))
    if (siguiente === Number(select.value)) return
    select.value = String(siguiente)
    select.dispatchEvent(new Event('change', { bubbles: true }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <>
    <style>{`
      [data-biblia-envoltura-extendida="true"] { padding-bottom:0 !important; }
      [data-biblia-isla-extendida="true"] { padding-bottom:calc(6.5rem + env(safe-area-inset-bottom)); }
      .vida-biblia-footer-nav { border-color:#e2e8f0; }
      .vida-biblia-footer-button { border-color:#e2e8f0; background:#fff; color:#334155; }
      .vida-biblia-footer-label { color:#94a3b8; }
      [data-biblia-tema="oscuro"] .vida-biblia-footer-nav { border-color:#334155; }
      [data-biblia-tema="oscuro"] .vida-biblia-footer-button { border-color:#334155; background:#0f172a; color:#e2e8f0; }
      [data-biblia-tema="oscuro"] .vida-biblia-footer-label { color:#64748b; }
      [data-biblia-tema="sepia"] .vida-biblia-footer-nav { border-color:#cdb991; }
      [data-biblia-tema="sepia"] .vida-biblia-footer-button { border-color:#cdb991; background:#fff8e8; color:#493c2d; }
      [data-biblia-tema="sepia"] .vida-biblia-footer-label { color:#8f7b60; }
    `}</style>
    {target && createPortal(
      <div className="vida-biblia-footer-nav mx-auto mt-8 flex max-w-[720px] items-center justify-between border-t px-2 pt-5">
        <button type="button" onClick={() => mover(-1)} disabled={capitulo <= 1} aria-label="Capítulo anterior" className="vida-biblia-footer-button grid h-11 w-11 place-items-center rounded-full border shadow-sm disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
        <span className="vida-biblia-footer-label text-xs font-bold">Capítulo {capitulo}</span>
        <button type="button" onClick={() => mover(1)} disabled={capitulo >= maxCapitulos} aria-label="Capítulo siguiente" className="vida-biblia-footer-button grid h-11 w-11 place-items-center rounded-full border shadow-sm disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
      </div>, target,
    )}
  </>
}
