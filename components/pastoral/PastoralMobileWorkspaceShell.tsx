'use client'

import { type MouseEvent, type ReactNode, useRef } from 'react'

export default function PastoralMobileWorkspaceShell({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null)

  const manejarCambioDeHerramienta = (event: MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(max-width: 639px)').matches) return

    const objetivo = event.target as HTMLElement | null
    const boton = objetivo?.closest('button')
    const workspace = shellRef.current?.firstElementChild as HTMLElement | null
    const selectorHerramientas = workspace?.children.item(1) as HTMLElement | null
    const contenido = workspace?.children.item(2) as HTMLElement | null

    if (!boton || !selectorHerramientas?.contains(boton) || !contenido) return

    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        contenido.scrollIntoView({
          behavior: reducirMovimiento ? 'auto' : 'smooth',
          block: 'start',
        })
      })
    })
  }

  return (
    <div
      ref={shellRef}
      className="pastoral-mobile-workspace-shell"
      onClickCapture={manejarCambioDeHerramienta}
    >
      {children}
    </div>
  )
}
