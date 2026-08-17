'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function MinisterioRoleContextSync({
  esLiderMinisterio,
  esMiembroMinisterio,
  gestionGlobal,
}: {
  esLiderMinisterio: boolean
  esMiembroMinisterio: boolean
  gestionGlobal: boolean
}) {
  const pathname = usePathname()

  useEffect(() => {
    if (esLiderMinisterio || !gestionGlobal) return

    const relacion = esMiembroMinisterio ? 'Eres parte del equipo' : 'Acceso de gestión'

    const sincronizar = () => {
      document.querySelectorAll<HTMLElement>('p, h2, span').forEach((element) => {
        if (element.childElementCount > 0) return
        const texto = element.textContent?.trim() || ''

        if (texto.includes('· Eres líder aquí')) {
          element.textContent = texto.replace('· Eres líder aquí', `· ${relacion}`)
          element.dataset.ministerioRoleContext = 'relationship'
          return
        }

        if (texto === 'Panel del líder') {
          element.textContent = 'Gestión del ministerio'
          element.dataset.ministerioRoleContext = 'management'
        }
      })
    }

    sincronizar()
    const observer = new MutationObserver(sincronizar)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [esLiderMinisterio, esMiembroMinisterio, gestionGlobal, pathname])

  return null
}
