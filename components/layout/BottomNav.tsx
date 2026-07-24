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
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] shrink-0"
      />

      <div
        className="app-bottom-nav fixed inset-x-0 bottom-0 z-[100] isolate border-t border-slate-100 bg-white/95 shadow-[0_-4px_18px_rgba(20,24,40,0.08)] backdrop-blur-xl"
        style={{
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        <nav
          aria-label="Navegación principal"
          className="app-bottom-nav-inner mx-auto flex h-16 max-w-lg items-center justify-around px-2"
        >
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
                className={`group flex h-full min-w-0 flex-1 flex-col items-center justify-center px-1 text-gray-500 outline-none motion-safe:transition-[color,transform] motion-safe:duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                  isActive ? 'text-indigo-600' : 'hover:text-[#171923]'
                }`}
              >
                <span
                  className={`flex min-h-8 min-w-11 items-center justify-center rounded-2xl px-3 motion-safe:transition-[background-color,transform] motion-safe:duration-200 ${
                    isActive ? 'bg-indigo-50 motion-safe:-translate-y-0.5' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 motion-safe:transition-[transform,fill] motion-safe:duration-200 ${
                      isActive ? 'scale-105 fill-indigo-500/20' : 'group-active:scale-95'
                    }`}
                  />
                </span>
                <span
                  className={`app-bottom-nav-label -mt-0.5 max-w-full truncate text-[10px] motion-safe:transition-[font-weight,opacity] motion-safe:duration-200 ${
                    isActive ? 'font-bold opacity-100' : 'font-medium opacity-80'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
