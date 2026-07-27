'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function copiarParametros(searchParams: URLSearchParams) {
  const params = new URLSearchParams()
  ;['from', 'embed', 'paqueteId', 'full'].forEach((key) => {
    const value = searchParams.get(key)
    if (value) params.set(key, value)
  })
  return params
}

export default function BibleEmbeddedParity() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('embed') !== '1') return

    document.documentElement.dataset.vidaBibliaEmbebida = 'true'
    const bottomNav = document.querySelector<HTMLElement>('.app-bottom-nav')
    if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important')

    const params = copiarParametros(new URLSearchParams(searchParams.toString()))

    if (pathname === '/biblia') {
      let intentos = 0
      const prepararNotas = () => {
        intentos += 1
        const boton = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
          .find((item) => (item.textContent ?? '').replace(/\s+/g, ' ').trim() === 'Notas')
        if (!boton || boton.dataset.vidaEmbeddedNotes === 'true') return intentos >= 80

        const reemplazo = boton.cloneNode(true) as HTMLButtonElement
        reemplazo.dataset.vidaEmbeddedNotes = 'true'
        reemplazo.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          router.push(`/biblia/notas?${params.toString()}`)
        })
        boton.replaceWith(reemplazo)
        return true
      }

      if (prepararNotas()) return
      const timer = window.setInterval(() => {
        if (prepararNotas()) window.clearInterval(timer)
      }, 150)
      return () => window.clearInterval(timer)
    }

    if (pathname === '/biblia/notas') {
      let intentos = 0
      const prepararRegreso = () => {
        intentos += 1
        const enlace = document.querySelector<HTMLAnchorElement>('a[aria-label="Volver"]')
        if (!enlace) return intentos >= 80
        enlace.href = `/biblia?${params.toString()}`
        enlace.onclick = (event) => {
          event.preventDefault()
          router.push(`/biblia?${params.toString()}`)
        }
        return true
      }

      if (prepararRegreso()) return
      const timer = window.setInterval(() => {
        if (prepararRegreso()) window.clearInterval(timer)
      }, 150)
      return () => window.clearInterval(timer)
    }
  }, [pathname, router, searchParams])

  return null
}
