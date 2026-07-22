'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Globe, Megaphone, X } from 'lucide-react'

type PublicacionCardProps = {
  titulo: string
  cuerpo?: string | null
  tipo: string
  fecha: string
  autor: string
  ministerio?: string | null
  compacta?: boolean
  etiqueta?: string
  colorClass?: string
}

export default function PublicacionCard({
  titulo,
  cuerpo,
  tipo,
  fecha,
  autor,
  ministerio,
  compacta = false,
  etiqueta,
  colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100',
}: PublicacionCardProps) {
  const [abierta, setAbierta] = useState(false)
  const inicial = autor.charAt(0).toUpperCase()

  useEffect(() => {
    if (!abierta) return
    const scrollY = window.scrollY
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    const cerrar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierta(false)
    }
    document.addEventListener('keydown', cerrar)

    return () => {
      document.removeEventListener('keydown', cerrar)
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
  }, [abierta])

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={`group w-full overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 ${compacta ? 'p-4 sm:p-5' : 'p-5'}`}
        aria-label={`Abrir publicación: ${titulo}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colorClass}`}>
            <Megaphone className="h-3 w-3" />
            {etiqueta ?? tipo.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-gray-400">{fecha}</span>
        </div>

        <h3 className="break-words text-base font-bold leading-snug text-[#171923]">{titulo}</h3>
        {cuerpo && (
          <p className={`mt-2 break-words text-sm leading-relaxed text-gray-500 ${compacta ? 'line-clamp-3' : 'line-clamp-4'}`}>
            {cuerpo}
          </p>
        )}

        <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-slate-100 pt-3 text-xs text-gray-500">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{inicial}</div>
          <span className="min-w-0 flex-1 truncate">{autor}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-indigo-600">
            Ver completo <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>

      {abierta && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-3 pt-[calc(.75rem+env(safe-area-inset-top))] pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:p-6"
          onClick={(event) => { if (event.target === event.currentTarget) setAbierta(false) }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="flex max-h-[calc(100dvh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-0 w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl landscape:max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] landscape:max-w-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colorClass}`}>
                  <Megaphone className="h-3 w-3" />
                  {etiqueta ?? tipo.replace('_', ' ')}
                </span>
                <h2 className="mt-2 break-words text-lg font-bold leading-snug text-[#171923] sm:text-xl">{titulo}</h2>
              </div>
              <button type="button" onClick={() => setAbierta(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-label="Cerrar ficha">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-5">
              {cuerpo ? (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{cuerpo}</p>
              ) : (
                <p className="text-sm text-slate-500">Esta publicación no tiene contenido adicional.</p>
              )}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{inicial}</div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-[#171923]">{autor}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{fecha}</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  {ministerio ? (
                    <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">{ministerio}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"><Globe className="h-3 w-3" /> Global</span>
                  )}
                </div>
              </div>
              <div className="h-4" aria-hidden />
            </div>
          </section>
        </div>
      )}
    </>
  )
}
