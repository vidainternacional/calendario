'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import EquipoServicioManager from '@/components/ministerios/EquipoServicioManager'
import ReemplazosServicioInline from '@/components/ministerios/ReemplazosServicioInline'

function hoySV() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((item) => item.type === 'year')?.value
  const month = parts.find((item) => item.type === 'month')?.value
  const day = parts.find((item) => item.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function mesActualSV() {
  return hoySV().slice(0, 7)
}

function moverMes(mes: string, delta: number) {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function nombreMes(mes: string) {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  const monthName = new Intl.DateTimeFormat('es-SV', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
  return {
    month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    year: String(year),
  }
}

export default function ProgramacionUXEnhancer() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryMes = searchParams.get('mes')
  const mesSeleccionado = /^\d{4}-\d{2}$/.test(queryMes || '') ? String(queryMes) : mesActualSV()
  const [monthTarget, setMonthTarget] = useState<HTMLElement | null>(null)
  const [mesPendiente, setMesPendiente] = useState<string | null>(null)

  const meses = useMemo(() => {
    const base = mesActualSV()
    const values = [-1, 0, 1, 2, 3].map((offset) => moverMes(base, offset))
    if (!values.includes(mesSeleccionado)) values.push(mesSeleccionado)
    return Array.from(new Set(values)).sort()
  }, [mesSeleccionado])

  useEffect(() => {
    setMesPendiente(null)
  }, [mesSeleccionado])

  useEffect(() => {
    // Calienta solo los dos saltos más probables. La ruta es dinámica, pero Next conserva
    // el payload de navegación precargado y evita que el primer toque arranque desde cero.
    const cercanos = [moverMes(mesSeleccionado, -1), moverMes(mesSeleccionado, 1)]
    for (const mes of cercanos) {
      router.prefetch(`${pathname}?mes=${mes}`)
    }
  }, [mesSeleccionado, pathname, router])

  useEffect(() => {
    const hoy = hoySV()
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/programacion?mes="][href*="&dia="]'))
    const actual = links.find((link) => link.href.includes(`dia=${hoy}`))
    if (!actual) return

    actual.dataset.esHoy = 'true'
    actual.setAttribute('aria-current', 'date')
    if (!actual.querySelector('[data-hoy-label]')) {
      const badge = document.createElement('span')
      badge.dataset.hoyLabel = 'true'
      badge.textContent = 'Hoy'
      badge.setAttribute('aria-hidden', 'true')
      actual.appendChild(badge)
    }
  }, [searchParams])

  useEffect(() => {
    setMonthTarget(null)
    let disposed = false
    let mount: HTMLElement | null = null

    const montar = () => {
      if (disposed || mount?.isConnected) return
      const root = document.querySelector<HTMLElement>('#programacion-ministerial-root')
      const main = root?.querySelector<HTMLElement>('main')
      const header = main?.querySelector<HTMLElement>(':scope > header')
      const calendarSection = main?.querySelector<HTMLElement>(':scope > section')
      const details = calendarSection?.querySelector<HTMLDetailsElement>(':scope > details')
      const detailsBody = details?.querySelector<HTMLElement>(':scope > div')
      const legacyNav = detailsBody?.querySelector<HTMLElement>(':scope > div')
      if (!main || !header || !calendarSection) return

      if (legacyNav) legacyNav.dataset.monthNavLegacy = 'true'

      const nextMount = document.createElement('div')
      nextMount.dataset.programacionMonthCards = 'true'
      header.insertAdjacentElement('afterend', nextMount)
      mount = nextMount
      setMonthTarget(nextMount)
    }

    montar()
    const observer = new MutationObserver(montar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      disposed = true
      observer.disconnect()
      document.querySelector<HTMLElement>('[data-month-nav-legacy="true"]')?.removeAttribute('data-month-nav-legacy')
      mount?.remove()
      setMonthTarget(null)
    }
  }, [mesSeleccionado])

  const monthCards = monthTarget
    ? createPortal(
        <section className="mb-5" aria-label="Meses de programación" aria-busy={Boolean(mesPendiente && mesPendiente !== mesSeleccionado)}>
          <div className="mb-2 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Programar por mes</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {mesPendiente && mesPendiente !== mesSeleccionado
                  ? `Abriendo ${nombreMes(mesPendiente).month}…`
                  : 'Trabaja un solo mes a la vez. Cambiar de tarjeta no duplica eventos.'}
              </p>
            </div>
          </div>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {meses.map((mes) => {
              const label = nombreMes(mes)
              const activo = mes === (mesPendiente || mesSeleccionado)
              return (
                <Link
                  key={mes}
                  href={`${pathname}?mes=${mes}`}
                  prefetch
                  scroll={false}
                  onClick={() => setMesPendiente(mes)}
                  aria-current={activo ? 'date' : undefined}
                  className={`min-w-[96px] shrink-0 snap-start rounded-[18px] px-3 py-3 text-left transition active:scale-[0.98] ${
                    activo
                      ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.2)]'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  <span className={`block text-[10px] font-extrabold uppercase tracking-[0.08em] ${activo ? 'text-white/75' : 'text-slate-400'}`}>
                    {label.year}
                  </span>
                  <span className="mt-1 block text-sm font-extrabold">{label.month}</span>
                </Link>
              )
            })}
          </div>
        </section>,
        monthTarget,
      )
    : null

  return (
    <>
      <EquipoServicioManager />
      <ReemplazosServicioInline />
      {monthCards}
      <style jsx global>{`
        .programacion-ministerial input:not([type='color']):not([type='hidden']),
        .programacion-ministerial textarea,
        .programacion-ministerial select {
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          color-scheme: light !important;
        }

        .programacion-ministerial input::placeholder,
        .programacion-ministerial textarea::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          opacity: 1 !important;
        }

        .programacion-ministerial [data-month-nav-legacy='true'] {
          display: none !important;
        }

        .programacion-ministerial main > section:first-of-type {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .programacion-ministerial main > section:first-of-type > details > summary {
          padding: 0 0 12px !important;
        }

        .programacion-ministerial main > section:first-of-type > details > div {
          margin-top: 0 !important;
          padding-top: 0 !important;
          border-top-width: 0 !important;
        }

        .programacion-ministerial #dia-seleccionado {
          margin-top: 16px !important;
          padding: 16px 0 0 !important;
          border-top: 1px solid #e2e8f0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .programacion-ministerial #dia-seleccionado > div > div {
          padding: 12px 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border-top: 1px solid #f1f5f9 !important;
        }

        .programacion-ministerial a[data-es-hoy='true'] {
          box-shadow: inset 0 0 0 2px #ec4899 !important;
        }

        .programacion-ministerial a[data-es-hoy='true'] [data-hoy-label] {
          position: absolute;
          top: 2px;
          right: 3px;
          border-radius: 9999px;
          background: #ec4899;
          color: #fff;
          padding: 1px 4px;
          font-size: 6px;
          line-height: 9px;
          font-weight: 900;
          letter-spacing: .02em;
          z-index: 2;
        }

        .programacion-ministerial #servicio-activo > details > summary {
          background: #ffffff !important;
        }

        .programacion-ministerial #servicio-activo > details + details {
          border-top-width: 1px !important;
          border-top-color: #e2e8f0 !important;
        }

        .programacion-ministerial #servicio-activo > details > div {
          border-top-color: #e2e8f0 !important;
          background: #ffffff !important;
        }

        .programacion-ministerial [data-equipo-legacy='true'] {
          display: none !important;
        }

        .programacion-ministerial a[href*='#servicio-activo'] {
          min-height: 48px !important;
          border-radius: 14px !important;
          background: #312e81 !important;
          color: #ffffff !important;
          box-shadow: none !important;
          border: 0 !important;
          transition: transform .16s ease !important;
        }

        .programacion-ministerial a[href*='#servicio-activo']:active {
          transform: scale(.985);
        }

        .programacion-ministerial a[href*='#servicio-activo'] svg {
          background: rgba(255,255,255,.14);
          border-radius: 9999px;
          padding: 3px;
          width: 22px;
          height: 22px;
        }
      `}</style>
    </>
  )
}
