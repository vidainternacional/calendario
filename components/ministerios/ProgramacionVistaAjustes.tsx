'use client'

import { useEffect } from 'react'

export default function ProgramacionVistaAjustes() {
  useEffect(() => {
    const dia = document.querySelector<HTMLElement>('#dia-seleccionado')
    if (!dia) return

    const crearFecha = Array.from(dia.querySelectorAll<HTMLDetailsElement>('details')).find((details) =>
      details.querySelector('summary')?.textContent?.includes('Crear una fecha nueva'),
    )
    if (crearFecha) dia.insertAdjacentElement('beforebegin', crearFecha)
  }, [])

  return null
}
