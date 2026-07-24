'use client'

import { useEffect } from 'react'

const EMPTY_TEXT = 'Aún no guardas versículos'

export default function BibliaFavoritesEmptyEnhancer() {
  useEffect(() => {
    const mejorar = () => {
      const textos = Array.from(document.querySelectorAll('p'))
      const titulo = textos.find((elemento) => elemento.textContent?.trim() === EMPTY_TEXT)
      const contenedor = titulo?.parentElement

      if (!contenedor || contenedor.dataset.favoritesEmptyEnhanced === 'true') return

      contenedor.dataset.favoritesEmptyEnhanced = 'true'
      contenedor.classList.add('bg-slate-50/70')

      const descripcion = document.createElement('p')
      descripcion.className = 'mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500'
      descripcion.textContent = 'Toca un versículo durante la lectura y selecciona Favorito para guardarlo aquí.'

      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white shadow-sm'
      boton.textContent = 'Volver a la lectura'
      boton.addEventListener('click', () => {
        const cerrar = document.querySelector<HTMLButtonElement>('button[aria-label="Cerrar favoritos"]')
        cerrar?.click()
      })

      contenedor.append(descripcion, boton)
    }

    mejorar()
    const observer = new MutationObserver(mejorar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
