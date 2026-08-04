'use client'

import { useRef } from 'react'
import CalendarioPilotoViews from './CalendarioPilotoViews'

export default function CalendarioPolishShell({
  asignaciones,
  isRefreshing = false,
}: {
  asignaciones: any[]
  isRefreshing?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  const animarDesde = (elemento: HTMLElement, direccion: 'in' | 'out') => {
    const root = rootRef.current
    if (!root) return

    const rect = elemento.getBoundingClientRect()
    root.style.setProperty('--calendar-origin-x', `${rect.left + rect.width / 2}px`)
    root.style.setProperty('--calendar-origin-y', `${rect.top + rect.height / 2}px`)
    root.classList.remove('calendar-zoom-in', 'calendar-zoom-out')

    window.setTimeout(() => {
      root.classList.add(direccion === 'in' ? 'calendar-zoom-in' : 'calendar-zoom-out')
      window.setTimeout(() => {
        root.classList.remove('calendar-zoom-in', 'calendar-zoom-out')
      }, 440)
    }, 0)
  }

  return (
    <div
      ref={rootRef}
      className="vida-calendar-shell"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement
        const button = target.closest('button')
        if (!button) return

        const transitionName = button.style.viewTransitionName
        if (transitionName?.startsWith('mes-')) {
          animarDesde(button, 'in')
          return
        }

        const texto = button.textContent?.trim() || ''
        if (/^‹?\s*\d{4}$/.test(texto) || target.closest('h1')) {
          animarDesde(button, 'out')
        }
      }}
    >
      <CalendarioPilotoViews asignaciones={asignaciones} isRefreshing={isRefreshing} />

      <style jsx global>{`
        .vida-calendar-shell {
          --calendar-origin-x: 50vw;
          --calendar-origin-y: 35vh;
          width: 100%;
          min-height: 100dvh;
          overflow-x: clip;
          background: #ffffff;
          color: #111827;
        }

        .vida-calendar-shell > div {
          width: 100%;
          min-height: 100dvh;
          background: #ffffff !important;
        }

        .vida-calendar-shell header {
          background: rgba(255, 255, 255, 0.96) !important;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          padding-bottom: 14px !important;
          backdrop-filter: saturate(180%) blur(18px);
          -webkit-backdrop-filter: saturate(180%) blur(18px);
        }

        .vida-calendar-shell header h1 {
          font-size: clamp(2.15rem, 10vw, 3rem) !important;
          line-height: 1.02 !important;
          letter-spacing: -0.045em !important;
        }

        .vida-calendar-shell header button.rounded-full {
          box-shadow: none !important;
          background: rgba(15, 23, 42, 0.055) !important;
          border: 0 !important;
          ring-width: 0 !important;
        }

        .vida-calendar-shell main {
          width: 100%;
          background: #ffffff;
          transform-origin: var(--calendar-origin-x) var(--calendar-origin-y);
          will-change: transform, opacity, filter;
        }

        .vida-calendar-shell main > section,
        .vida-calendar-shell main > div {
          width: 100%;
          max-width: none !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .vida-calendar-shell main section.bg-white,
        .vida-calendar-shell main div.bg-white {
          background: #ffffff !important;
        }

        .vida-calendar-shell .grid.grid-cols-3 {
          column-gap: 10px;
          row-gap: 18px;
          padding-left: max(14px, env(safe-area-inset-left));
          padding-right: max(14px, env(safe-area-inset-right));
        }

        .vida-calendar-shell .grid.grid-cols-3 > button {
          min-height: 142px;
          padding: 8px 4px 10px !important;
          border-radius: 18px;
          transform: translateZ(0);
        }

        .vida-calendar-shell .grid.grid-cols-3 > button:active {
          background: rgba(99, 102, 241, 0.055);
          transform: scale(0.965);
        }

        .vida-calendar-shell .grid.grid-cols-7 {
          padding-left: max(4px, env(safe-area-inset-left));
          padding-right: max(4px, env(safe-area-inset-right));
        }

        .vida-calendar-shell .grid.grid-cols-7 > button {
          border-radius: 0 !important;
        }

        .vida-calendar-shell [role='menu'] {
          border-radius: 22px !important;
          padding: 7px !important;
          box-shadow: 0 24px 65px rgba(15, 23, 42, 0.19) !important;
        }

        .vida-calendar-shell .calendar-zoom-in main,
        .vida-calendar-shell.calendar-zoom-in main {
          animation: vidaCalendarZoomIn 420ms cubic-bezier(0.2, 0.82, 0.2, 1) both;
        }

        .vida-calendar-shell .calendar-zoom-out main,
        .vida-calendar-shell.calendar-zoom-out main {
          animation: vidaCalendarZoomOut 400ms cubic-bezier(0.32, 0, 0.2, 1) both;
        }

        @keyframes vidaCalendarZoomIn {
          0% {
            opacity: 0.2;
            transform: scale(0.72);
            filter: blur(5px);
          }
          62% {
            opacity: 1;
            transform: scale(1.018);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes vidaCalendarZoomOut {
          0% {
            opacity: 0.35;
            transform: scale(1.12);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vida-calendar-shell main {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
