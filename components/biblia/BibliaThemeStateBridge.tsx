'use client'

import { useEffect } from 'react'

type BibleTheme = 'claro' | 'sepia' | 'oscuro'

function detectarTema(): BibleTheme | null {
  const section = document.querySelector<HTMLElement>('section.transition-colors')
  if (!section) return null
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
  useEffect(() => {
    const sincronizar = () => {
      const theme = detectarTema()
      if (theme) aplicarTema(theme)
    }

    sincronizar()

    const observer = new MutationObserver(sincronizar)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
      delete document.documentElement.dataset.bibliaTema
      delete document.body.dataset.bibliaTema
      document.documentElement.style.removeProperty('color-scheme')
    }
  }, [])

  return null
}
