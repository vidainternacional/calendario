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
    let select: HTMLSelectElement | null = null

    const sincronizar = () => {
      select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
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
      if (existente) {
        setTarget(existente)
        return true
      }

      mount = document.createElement('div')
      mount.dataset.bibliaNavegacionInferior = 'true'
      articulo.insertAdjacentElement('afterend', mount)
      setTarget(mount)
      return true
    }

    const onChange = () => sincronizar()
    if (sincronizar()) select?.addEventListener('change', onChange)

    const observer = new MutationObserver(() => {
      sincronizar()
      if (select) {
        select.removeEventListener('change', onChange)
        select.addEventListener('change', onChange)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      select?.removeEventListener('change', onChange)
      mount?.remove()
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

  return (
    <>
      <style>{`
        [data-biblia-envoltura-extendida="true"] { padding-bottom: 0 !important; }
        [data-biblia-isla-extendida="true"] { padding-bottom: calc(6.5rem + env(safe-area-inset-bottom)); }
      `}</style>
      {target && createPortal(
        <div className="mx-auto mt-8 flex max-w-[720px] items-center justify-between border-t border-slate-200/70 px-2 pt-5">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={capitulo <= 1}
            aria-label="Capítulo anterior"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-slate-400">Capítulo {capitulo}</span>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={capitulo >= maxCapitulos}
            aria-label="Capítulo siguiente"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>,
        target,
      )}
    </>
  )
}
