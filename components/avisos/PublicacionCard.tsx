'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, ExternalLink, Globe, Megaphone, X } from 'lucide-react'
import { markPublicationRead } from '@/components/avisos/usePublicationReads'

type PublicacionCardProps = {
  publicationId?: string
  unread?: boolean
  titulo: string
  cuerpo?: string | null
  tipo: string
  fecha: string
  autor: string
  ministerio?: string | null
  compacta?: boolean
  etiqueta?: string
  colorClass?: string
  variant?: 'card' | 'row'
}

export default function PublicacionCard({
  publicationId,
  unread = false,
  titulo,
  cuerpo,
  tipo,
  fecha,
  autor,
  ministerio,
  compacta = false,
  etiqueta,
  colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100',
  variant = 'card',
}: PublicacionCardProps) {
  const [abierta, setAbierta] = useState(false)
  const inicial = autor.charAt(0).toUpperCase()

  const abrir = () => {
    setAbierta(true)
    if (publicationId && unread) void markPublicationRead(publicationId)
  }

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

  const modal = abierta && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/60 px-[max(.75rem,env(safe-area-inset-left))] py-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-[3px]"
          style={{
            paddingRight: 'max(.75rem, env(safe-area-inset-right))',
            paddingBottom: 'max(.75rem, env(safe-area-inset-bottom))',
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setAbierta(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="flex min-h-0 max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colorClass}`}>
                  <Megaphone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{etiqueta ?? tipo.replace('_', ' ')}</span>
                </span>
                <h2 className="mt-2 break-words text-xl font-bold leading-snug text-[#171923] sm:text-2xl">{titulo}</h2>
              </div>
              <button
                type="button"
                onClick={() => setAbierta(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95"
                aria-label="Cerrar ficha"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] sm:px-5 sm:pb-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                {cuerpo ? (
                  <p className="whitespace-pre-wrap break-words text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">{cuerpo}</p>
                ) : (
                  <p className="text-sm text-slate-500">Esta publicación no tiene contenido adicional.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{inicial}</span>
                <span className="font-medium text-slate-600">{autor}</span>
                <span aria-hidden="true" className="text-slate-300">•</span>
                <span>{fecha}</span>
                <span aria-hidden="true" className="text-slate-300">•</span>
                {ministerio ? (
                  <span className="inline-flex max-w-full rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600">
                    <span className="truncate">{ministerio}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-500"><Globe className="h-3 w-3" /> Global</span>
                )}
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )
    : null

  if (variant === 'row') {
    return (
      <>
        <button
          type="button"
          onClick={abrir}
          className={`group flex min-h-[74px] w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 active:bg-slate-50 focus:outline-none focus-visible:bg-indigo-50/60 ${unread ? 'bg-indigo-50/25' : ''}`}
          aria-label={`Abrir publicación: ${titulo}${unread ? ', no leída' : ''}`}
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Megaphone className="h-[18px] w-[18px]" aria-hidden="true" />
            {unread && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" aria-hidden="true" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`truncate text-sm text-[#171923] ${unread ? 'font-extrabold' : 'font-bold'}`}>{titulo}</span>
              <span className="shrink-0 text-[10px] text-slate-400">{fecha}</span>
            </span>
            <span className="mt-1 block truncate text-[11px] text-slate-500">
              <span className="font-bold uppercase tracking-[0.06em] text-indigo-500">{etiqueta ?? tipo.replace('_', ' ')}</span>
              <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
              {cuerpo || autor}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
        </button>
        {modal}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`group relative w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 ${compacta ? 'p-4 sm:p-5' : 'p-5'} ${unread ? 'border-indigo-200' : 'border-slate-100'}`}
        aria-label={`Abrir publicación: ${titulo}${unread ? ', no leída' : ''}`}
      >
        {unread && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 pr-3">
          <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colorClass}`}>
            <Megaphone className="h-3 w-3 shrink-0" />
            <span className="truncate">{etiqueta ?? tipo.replace('_', ' ')}</span>
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
      {modal}
    </>
  )
}
