'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function textoNormalizado(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export default function BibleNotesPrefetch() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/biblia') return

    let navegando = false

    const abrirNotas = (event: MouseEvent) => {
      const objetivo = event.target as HTMLElement | null
      const boton = objetivo?.closest<HTMLButtonElement>('button')
      if (!boton || textoNormalizado(boton.textContent) !== 'Notas') return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      if (navegando) return
      navegando = true
      window.location.assign('/biblia/notas')
    }

    document.addEventListener('click', abrirNotas, true)
    return () => document.removeEventListener('click', abrirNotas, true)
  }, [pathname])

  return null
}
