'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { ChevronRight, Clock3, History, X } from 'lucide-react'
import {
  obtenerCentroSolicitudesMinisterio,
  type HistorialCentroSolicitudes,
} from '@/app/actions/centro-solicitudes-ministerio'
import { PENDING_INDICATORS_EVENT } from '@/components/notificaciones/usePendingIndicators'

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function estadoHistorial(value: string) {
  if (value === 'aceptado') return 'Resuelto'
  if (value === 'cancelado') return 'Cancelado'
  if (value === 'rechazado') return 'Rechazado'
  return value
}

export default function HistorialReemplazosButton({
  ministerioId,
  puedeGestionar,
}: {
  ministerioId: string
  puedeGestionar: boolean
}) {
  const pathname = usePathname()
  const solicitudesPath = `/ministerios/${ministerioId}/solicitudes`
  const visible = puedeGestionar && pathname === solicitudesPath

  const [historial, setHistorial] = useState<HistorialCentroSolicitudes[]>([])
  const [abierto, setAbierto] = useState(false)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  const cargar = useCallback(async () => {
    if (!visible) return
    try {
      const data = await obtenerCentroSolicitudesMinisterio(ministerioId)
      setHistorial(data.historialReemplazos)
    } catch (error) {
      console.error('No se pudo cargar el historial de reemplazos', error)
    }
  }, [ministerioId, visible])

  useEffect(() => {
    if (!visible) return
    void cargar()

    const onFocus = () => void cargar()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void cargar()
    }
    const onRefresh = () => void cargar()

    window.addEventListener('focus', onFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, onRefresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, onRefresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [cargar, visible])

  useEffect(() => {
    if (!visible) {
      setTarget(null)
      return
    }

    let cancelled = false
    let observer: MutationObserver | null = null

    const montar = () => {
      if (cancelled) return false
      const root = document.querySelector<HTMLElement>('[data-centro-reemplazos-root]')
      const section = root?.querySelector<HTMLElement>('section[aria-label="Solicitudes de reemplazo"]')
      if (!root || !section) return false

      const legacy = section.querySelector<HTMLDetailsElement>('details')
      if (legacy) {
        legacy.dataset.historialReemplazosLegacy = 'true'
        legacy.style.display = 'none'
      }

      let mount = section.querySelector<HTMLElement>('[data-historial-reemplazos-button-root]')
      if (!mount) {
        mount = document.createElement('div')
        mount.dataset.historialReemplazosButtonRoot = 'true'
        const header = section.firstElementChild
        if (header) header.insertAdjacentElement('afterend', mount)
        else section.prepend(mount)
      }
      setTarget(mount)
      return true
    }

    if (!montar()) {
      observer = new MutationObserver(() => {
        if (montar()) observer?.disconnect()
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      document.querySelector('[data-historial-reemplazos-button-root]')?.remove()
      const legacy = document.querySelector<HTMLElement>('[data-historial-reemplazos-legacy]')
      if (legacy) legacy.style.display = ''
    }
  }, [historial.length, visible])

  useEffect(() => {
    if (!abierto) return
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
  }, [abierto])

  if (!visible || !target) return null

  const button = (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-left ring-1 ring-slate-200 transition active:scale-[0.99]"
      aria-haspopup="dialog"
      aria-label={`Abrir historial de reemplazos${historial.length ? `, ${historial.length} registros` : ''}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
        <History className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-extrabold text-slate-800">Historial de reemplazos</span>
        <span className="mt-0.5 block text-[9px] text-slate-400">
          {historial.length > 0
            ? `${historial.length} ${historial.length === 1 ? 'movimiento registrado' : 'movimientos registrados'}`
            : 'Todavía no hay movimientos resueltos'}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  )

  const modal = abierto && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-end justify-center bg-slate-950/35 backdrop-blur-[2px] sm:items-center sm:px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAbierto(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="historial-reemplazos-title"
            className="flex max-h-[84dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[30px] border border-white/80 bg-[#f7f8fb] shadow-[0_-18px_60px_rgba(15,23,42,0.22)] sm:rounded-[30px]"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-4 backdrop-blur-xl sm:px-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                <History className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">Registro del equipo</p>
                <h2 id="historial-reemplazos-title" className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-[#171923]">Historial de reemplazos</h2>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95"
                aria-label="Cerrar historial de reemplazos"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-4">
              {historial.length === 0 ? (
                <div className="rounded-[22px] bg-white px-4 py-8 text-center ring-1 ring-slate-100">
                  <History className="mx-auto h-6 w-6 text-slate-300" aria-hidden="true" />
                  <p className="mt-2 text-sm font-bold text-slate-700">Sin historial todavía</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">Los reemplazos resueltos o cancelados aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historial.slice(0, 50).map((item) => (
                    <article key={`${item.eventoId}:${item.intercambioId}`} className="rounded-[20px] bg-white px-3.5 py-3 ring-1 ring-slate-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-extrabold text-slate-800">{item.eventoTitulo}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-600">{item.solicitanteNombre} · {item.funcion}</p>
                          <p className="mt-0.5 text-[9px] text-slate-400">{item.reemplazoNombre ? `Cubrió: ${item.reemplazoNombre}` : 'Sin reemplazo asignado'}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-extrabold ${item.estado === 'aceptado' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                          {estadoHistorial(item.estado)}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[8px] text-slate-300">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        {fechaCorta(item.resueltoAt || item.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {createPortal(button, target)}
      {modal}
    </>
  )
}
