'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type SVGProps } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Megaphone, User, BookOpen } from 'lucide-react'
import { usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

const PREF_KEY = 'vida-biblia-preferencias'
type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

function CalendarGridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.25" y="4.5" width="17.5" height="16" rx="3" />
      <path d="M7.5 2.75v3.5M16.5 2.75v3.5M3.5 8.6h17" />
      <rect x="6.2" y="11.15" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
      <rect x="10.82" y="11.15" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
      <rect x="15.45" y="11.15" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
      <rect x="6.2" y="15.55" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
      <rect x="10.82" y="15.55" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
      <rect x="15.45" y="15.55" width="2.35" height="2.35" rx=".45" fill="currentColor" stroke="none" />
    </svg>
  )
}

const navItems = [
  { name: 'Inicio', href: '/inicio', icon: Home },
  { name: 'Calendario', href: '/calendario', icon: CalendarGridIcon },
  { name: 'Avisos', href: '/avisos', icon: Megaphone },
  { name: 'Estudios', href: '/estudios', icon: BookOpen },
  { name: 'Perfil', href: '/perfil', icon: User },
]

function cargarTema(): ModoBiblia {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    return ['claro', 'sepia', 'oscuro'].includes(modo) ? modo : 'claro'
  } catch {
    return 'claro'
  }
}

function elementoEditableActivo() {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false
  if (active.isContentEditable) return true
  if (active instanceof HTMLTextAreaElement) return true
  if (active instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(active.type)
  }
  return false
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const dentroBiblia = pathname.startsWith('/biblia')
  const [modo, setModo] = useState<ModoBiblia>('claro')
  const [portalReady, setPortalReady] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const baselineViewportRef = useRef(0)
  const { unreadAvisos } = usePendingIndicators()
  const avisosRequierenAtencion = Math.max(0, unreadAvisos)

  useEffect(() => setPortalReady(true), [])

  useEffect(() => {
    const viewport = window.visualViewport
    let frame = 0

    const syncKeyboard = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const mobile = window.matchMedia('(pointer: coarse)').matches
        const editable = elementoEditableActivo()
        const currentHeight = viewport?.height ?? window.innerHeight

        if (!editable) {
          baselineViewportRef.current = Math.max(baselineViewportRef.current, currentHeight)
          setKeyboardOpen(false)
          return
        }

        if (!baselineViewportRef.current) baselineViewportRef.current = Math.max(window.innerHeight, currentHeight)
        const reduction = baselineViewportRef.current - currentHeight
        setKeyboardOpen(mobile && reduction >= 100)
      })
    }

    baselineViewportRef.current = viewport?.height ?? window.innerHeight
    syncKeyboard()
    document.addEventListener('focusin', syncKeyboard)
    document.addEventListener('focusout', syncKeyboard)
    window.addEventListener('resize', syncKeyboard, { passive: true })
    window.addEventListener('orientationchange', syncKeyboard, { passive: true })
    viewport?.addEventListener('resize', syncKeyboard, { passive: true })
    viewport?.addEventListener('scroll', syncKeyboard, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('focusin', syncKeyboard)
      document.removeEventListener('focusout', syncKeyboard)
      window.removeEventListener('resize', syncKeyboard)
      window.removeEventListener('orientationchange', syncKeyboard)
      viewport?.removeEventListener('resize', syncKeyboard)
      viewport?.removeEventListener('scroll', syncKeyboard)
    }
  }, [])

  useEffect(() => {
    if (!dentroBiblia) return
    setModo(cargarTema())
    const actualizar = (event: Event) => {
      const custom = event as CustomEvent<{ modo?: ModoBiblia }>
      setModo(custom.detail?.modo ?? cargarTema())
    }
    const actualizarStorage = () => setModo(cargarTema())
    window.addEventListener('vida-biblia-theme', actualizar)
    window.addEventListener('storage', actualizarStorage)
    return () => {
      window.removeEventListener('vida-biblia-theme', actualizar)
      window.removeEventListener('storage', actualizarStorage)
    }
  }, [dentroBiblia])

  const tema = !dentroBiblia ? {
    nav: 'border-slate-200 bg-white', inactive: 'text-slate-500', active: 'text-indigo-600', activeBg: 'bg-indigo-50', shadow: 'shadow-[0_-4px_18px_rgba(20,24,40,0.08)]',
  } : {
    claro: { nav: 'border-slate-200 bg-white', inactive: 'text-slate-500', active: 'text-violet-600', activeBg: 'bg-violet-50', shadow: 'shadow-[0_-4px_18px_rgba(20,24,40,0.08)]' },
    sepia: { nav: 'border-[#dac8a5] bg-[#fffaf0]', inactive: 'text-[#7d6b54]', active: 'text-[#7c3aed]', activeBg: 'bg-[#ead9b5]', shadow: 'shadow-[0_-4px_18px_rgba(73,60,45,0.12)]' },
    oscuro: { nav: 'border-slate-800 bg-slate-950', inactive: 'text-slate-400', active: 'text-violet-300', activeBg: 'bg-violet-950/70', shadow: 'shadow-[0_-4px_18px_rgba(0,0,0,0.35)]' },
  }[modo]

  // En iOS un elemento fixed se recoloca sobre el teclado porque Safari fija
  // contra el viewport visual. La navegación global no debe competir con el
  // editor: mientras el teclado ocupa el borde inferior se oculta exactamente
  // en ese borde y reaparece al cerrarlo, sin desplazarse hacia arriba.
  const navigation = (
    <div
      data-bottom-nav-fixed="true"
      data-keyboard-policy="layout-bottom-covered"
      data-keyboard-open={keyboardOpen ? 'true' : 'false'}
      aria-hidden={keyboardOpen ? 'true' : undefined}
      className={`app-bottom-nav fixed inset-x-0 bottom-0 z-[100] m-0 w-full border-t transition-[opacity,visibility,background-color,border-color] duration-150 ${keyboardOpen ? 'pointer-events-none invisible opacity-0' : 'visible opacity-100'} ${tema.nav} ${tema.shadow}`}
      style={{
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
      }}
    >
      <nav aria-label="Navegación principal" className="app-bottom-nav-inner mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/inicio' && pathname.startsWith(item.href))
          const showUnreadBadge = item.href === '/avisos' && avisosRequierenAtencion > 0
          const badgeValue = item.href === '/avisos' ? avisosRequierenAtencion : 0
          const prepareDestination = () => {
            if (!isActive) router.prefetch(item.href)
          }
          return (
            <Link key={item.name} href={item.href} prefetch={false} aria-current={isActive ? 'page' : undefined} aria-label={showUnreadBadge ? `${item.name}, ${badgeValue} elementos requieren atención` : item.name} onPointerDown={prepareDestination} onPointerEnter={prepareDestination} onFocus={prepareDestination} className={`group flex h-16 min-w-0 flex-1 flex-col items-center justify-center px-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${isActive ? tema.active : tema.inactive}`}>
              <span className={`relative flex h-8 min-w-11 items-center justify-center rounded-2xl px-3 transition-colors ${isActive ? tema.activeBg : 'bg-transparent'}`}>
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                {showUnreadBadge && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white shadow-sm">{badgeValue > 99 ? '99+' : badgeValue}</span>}
              </span>
              <span className={`app-bottom-nav-label -mt-0.5 max-w-full truncate text-[10px] ${isActive ? 'font-bold opacity-100' : 'font-medium opacity-80'}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return <><div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] shrink-0" />{portalReady ? createPortal(navigation, document.body) : null}</>
}
