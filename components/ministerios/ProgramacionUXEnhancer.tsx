'use client'

import { useEffect } from 'react'
import EquipoEstadoSync from '@/components/ministerios/EquipoEstadoSync'
import EquipoServicioInline from '@/components/ministerios/EquipoServicioInline'
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

export default function ProgramacionUXEnhancer() {
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
  }, [])

  return (
    <>
      <EquipoServicioInline />
      <ReemplazosServicioInline />
      <EquipoEstadoSync />
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

        .programacion-ministerial #servicio-activo > details:nth-of-type(1) > summary { background: #f5f7ff; }
        .programacion-ministerial #servicio-activo > details:nth-of-type(2) > summary { background: #faf7ff; }
        .programacion-ministerial #servicio-activo > details:nth-of-type(3) > summary { background: #fff7fb; }
        .programacion-ministerial #servicio-activo > details + details { border-top-width: 6px !important; border-top-color: #f1f5f9 !important; }
        .programacion-ministerial #servicio-activo > details > div { border-top-color: #e2e8f0 !important; }
        .programacion-ministerial [data-equipo-legacy='true'] { display: none !important; }

        .programacion-ministerial a[href*='#servicio-activo'] {
          min-height: 48px !important;
          border-radius: 16px !important;
          background: linear-gradient(135deg, #312e81 0%, #5b3df5 55%, #7c3aed 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 10px 24px rgba(79, 70, 229, .22), inset 0 1px 0 rgba(255,255,255,.18) !important;
          border: 1px solid rgba(255,255,255,.14) !important;
          transition: transform .16s ease, box-shadow .16s ease !important;
        }

        .programacion-ministerial a[href*='#servicio-activo']:active {
          transform: scale(.985);
          box-shadow: 0 5px 14px rgba(79, 70, 229, .18) !important;
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
