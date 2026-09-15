'use client'

import { useEffect, useRef } from 'react'

type BibleTheme = 'claro' | 'sepia' | 'oscuro'

function detectarTema(section: HTMLElement): BibleTheme | null {
  if (section.classList.contains('bg-slate-950')) return 'oscuro'
  if (section.classList.contains('bg-[#efe5d0]')) return 'sepia'
  if (section.classList.contains('bg-[#f7f7f4]')) return 'claro'
  return null
}

function aplicarTema(theme: BibleTheme) {
  document.documentElement.dataset.bibliaTema = theme
  document.body.dataset.bibliaTema = theme
  document.documentElement.style.colorScheme = theme === 'oscuro' ? 'dark' : 'light'
}

export default function BibliaThemeStateBridge() {
  const ultimoTemaRef = useRef<BibleTheme | null>(null)

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('section.transition-colors')
    if (!section) return

    const sincronizar = () => {
      const theme = detectarTema(section)
      if (!theme) return

      aplicarTema(theme)
      if (ultimoTemaRef.current !== theme) {
        ultimoTemaRef.current = theme
        window.dispatchEvent(new CustomEvent('vida-biblia-theme', { detail: { modo: theme } }))
      }
    }

    sincronizar()

    const observer = new MutationObserver(sincronizar)
    observer.observe(section, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      // No retirar el tema aquí. Durante Biblia → Cuaderno este componente se
      // desmonta antes de que la nueva superficie termine de pintar y borrar
      // el dataset provocaba un frame blanco. BibleThemeRouteSync es la única
      // autoridad que decide cuándo abandonar realmente el tema bíblico.
      observer.disconnect()
    }
  }, [])

  return <style>{`
    .app-bottom-nav,
    .app-bottom-nav * {
      transition-property: none !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }

    html[data-biblia-tema='claro'] .app-bottom-nav {
      background:#ffffff !important;
      border-color:#e2e8f0 !important;
      box-shadow:0 -4px 18px rgba(20,24,40,.08) !important;
    }
    html[data-biblia-tema='claro'] .app-bottom-nav a {
      color:#64748b !important;
    }

    html[data-biblia-tema='sepia'] .app-bottom-nav {
      background:#fffaf0 !important;
      border-color:#dac8a5 !important;
      box-shadow:0 -4px 18px rgba(73,60,45,.12) !important;
    }
    html[data-biblia-tema='sepia'] .app-bottom-nav a {
      color:#7d6b54 !important;
    }

    html[data-biblia-tema='oscuro'] .app-bottom-nav {
      background:#020617 !important;
      border-color:#1e293b !important;
      box-shadow:0 -4px 18px rgba(0,0,0,.35) !important;
    }
    html[data-biblia-tema='oscuro'] .app-bottom-nav a {
      color:#94a3b8 !important;
    }

    html[data-biblia-tema='claro'] article > div.relative > div[class*='shadow-lg'] {
      background:#ffffff !important;
      border-color:#e2e8f0 !important;
      color:#1e293b !important;
    }
    html[data-biblia-tema='sepia'] article > div.relative > div[class*='shadow-lg'] {
      background:#fff8e8 !important;
      border-color:#cdb991 !important;
      color:#493c2d !important;
      box-shadow:0 10px 24px rgba(86,64,34,.12) !important;
    }
    html[data-biblia-tema='sepia'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-amber-50'] {
      background:#f3e4bd !important;
      color:#76571d !important;
    }
    html[data-biblia-tema='sepia'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-indigo-50'] {
      background:#e8dcc5 !important;
      color:#5d4a35 !important;
    }
    html[data-biblia-tema='sepia'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-slate-100'] {
      background:#ead9b5 !important;
      color:#493c2d !important;
    }
    html[data-biblia-tema='oscuro'] article > div.relative > div[class*='shadow-lg'] {
      background:#0f172a !important;
      border-color:#334155 !important;
      color:#e2e8f0 !important;
      box-shadow:0 12px 28px rgba(0,0,0,.32) !important;
    }
    html[data-biblia-tema='oscuro'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-amber-50'] {
      background:rgba(120,53,15,.38) !important;
      color:#fcd34d !important;
    }
    html[data-biblia-tema='oscuro'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-indigo-50'] {
      background:rgba(49,46,129,.5) !important;
      color:#c7d2fe !important;
    }
    html[data-biblia-tema='oscuro'] article > div.relative > div[class*='shadow-lg'] button[class*='bg-slate-100'] {
      background:#1e293b !important;
      color:#e2e8f0 !important;
    }
  `}</style>
}
