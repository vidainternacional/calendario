'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Megaphone, User, BookOpen } from 'lucide-react'

const navItems = [
  { name: 'Inicio', href: '/inicio', icon: Home },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  { name: 'Avisos', href: '/avisos', icon: Megaphone },
  { name: 'Estudios', href: '/estudios', icon: BookOpen },
  { name: 'Perfil', href: '/perfil', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      navItems.forEach((item) => {
        if (!pathname.startsWith(item.href)) router.prefetch(item.href)
      })
    }, 350)
    return () => globalThis.clearTimeout(timeoutId)
  }, [pathname, router])

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] shrink-0" />
      <div
        className="app-bottom-nav fixed bottom-0 left-0 right-0 z-[100] w-full border-t border-slate-200 bg-white shadow-[0_-4px_18px_rgba(20,24,40,0.08)]"
        style={{
          position: 'fixed',
          insetInline: 0,
          bottom: 0,
          width: '100%',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          transform: 'none',
          WebkitTransform: 'none',
          contain: 'layout paint',
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
                className={`group flex h-16 min-w-0 flex-1 flex-col items-center justify-center px-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}
              >
                <span className={`flex h-8 min-w-11 items-center justify-center rounded-2xl px-3 ${isActive ? 'bg-indigo-50' : 'bg-transparent'}`}>
                  <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${isActive ? 'fill-indigo-500/20' : ''}`} />
                </span>
                <span className={`app-bottom-nav-label -mt-0.5 max-w-full truncate text-[10px] ${isActive ? 'font-bold opacity-100' : 'font-medium opacity-80'}`}>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
