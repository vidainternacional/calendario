'use client'

import { useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  embedded?: boolean
  paqueteId?: string
}

type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

const PREF_KEY = 'vida-biblia-preferencias'

function leerTema(): ModoBiblia {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    return ['claro', 'sepia', 'oscuro'].includes(modo) ? modo : 'claro'
  } catch {
    return 'claro'
  }
}

function destinoNotas(embedded: boolean, paqueteId?: string) {
  const params = new URLSearchParams()
  if (embedded) {
    params.set('from', 'pastoral')
    params.set('embed', '1')
    if (paqueteId) params.set('paqueteId', paqueteId)
  }
  const query = params.toString()
  return `/biblia/notas${query ? `?${query}` : ''}`
}

function crearCortina(modo: ModoBiblia) {
  const cortina = document.createElement('div')
  cortina.dataset.vidaNotesTransition = 'true'
  cortina.setAttribute('aria-hidden', 'true')
  cortina.style.position = 'fixed'
  cortina.style.inset = '0'
  cortina.style.zIndex = '2147483646'
  cortina.style.pointerEvents = 'none'
  cortina.style.opacity = '0'
  cortina.style.transition = 'opacity 150ms ease-out'
  cortina.style.background = modo === 'oscuro' ? '#020617' : modo === 'sepia' ? '#efe5d0' : '#f7f7f4'
  cortina.style.display = 'grid'
  cortina.style.placeItems = 'center'
  cortina.innerHTML = '<div style="width:34px;height:34px;border-radius:999px;border:3px solid rgba(124,58,237,.22);border-top-color:#7c3aed;animation:vida-notes-spin .7s linear infinite"></div><style>@keyframes vida-notes-spin{to{transform:rotate(360deg)}}</style>'
  document.body.append(cortina)
  requestAnimationFrame(() => { cortina.style.opacity = '1' })
  return cortina
}

export default function BibleNotesTransition({ embedded = false, paqueteId }: Props) {
  const router = useRouter()

  useLayoutEffect(() => {
    const destino = destinoNotas(embedded, paqueteId)
    router.prefetch(destino)

    const manejarClick = (event: MouseEvent) => {
      const objetivo = event.target as HTMLElement | null
      const boton = objetivo?.closest('button') as HTMLButtonElement | null
      if (!boton || (boton.textContent ?? '').replace(/\s+/g, ' ').trim() !== 'Notas') return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      if (document.querySelector('[data-vida-notes-transition="true"]')) return
      crearCortina(leerTema())
      window.setTimeout(() => router.push(destino), 110)
    }

    document.addEventListener('click', manejarClick, true)
    return () => {
      document.removeEventListener('click', manejarClick, true)
      document.querySelector('[data-vida-notes-transition="true"]')?.remove()
    }
  }, [embedded, paqueteId, router])

  return null
}
