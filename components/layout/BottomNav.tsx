'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Megaphone, User, BookOpen } from 'lucide-react'

const PREF_KEY = 'vida-biblia-preferencias'
type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

const navItems = [
  { name: 'Inicio', href: '/inicio', icon: Home },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
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

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const dentroBiblia = pathname.startsWith('/biblia')
  const [modo, setModo] = useState<ModoBiblia>('claro')
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      navItems.forEach((item) => {
        if (!pathname.startsWith(item.href)) router.prefetch(item.href)
      })
    }, 350)
    return () => globalThis.clearTimeout(timeoutId)
  }, [pathname, router])

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

  const navigation = (
    <div
      className={`app-bottom-nav fixed inset-x-0 bottom-0 z-[100] w-full border-t transition-colors ${tema.nav} ${tema.shadow}`}
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        width: '100%',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        isolation: 'isolate',
      }}
    >
      <nav aria-label="Navegación principal" className="app-bottom-nav-inner mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/inicio' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              onPointerEnter={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              className={`group flex h-16 min-w-0 flex-1 flex-col items-center justify-center px-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${isActive ? tema.active : tema.inactive}`}
            >
              <span className={`flex h-8 min-w-11 items-center justify-center rounded-2xl px-3 transition-colors ${isActive ? tema.activeBg : 'bg-transparent'}`}>
                <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${isActive ? 'fill-current opacity-90' : ''}`} />
              </span>
              <span className={`app-bottom-nav-label -mt-0.5 max-w-full truncate text-[10px] ${isActive ? 'font-bold opacity-100' : 'font-medium opacity-80'}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] shrink-0" />
      {portalReady ? createPortal(navigation, document.body) : null}
    </>
  )
}
