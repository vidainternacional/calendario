'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Megaphone, User, BookOpen } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Inicio', href: '/inicio', icon: Home },
    { name: 'Calendario', href: '/calendario', icon: Calendar },
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Estudios', href: '/estudios', icon: BookOpen },
    { name: 'Perfil', href: '/perfil', icon: User },
  ]

  return (
    <div
      className="app-bottom-nav fixed inset-x-0 bottom-0 z-[100] isolate border-t border-slate-100 bg-white/95 shadow-[0_-4px_18px_rgba(20,24,40,0.08)] backdrop-blur-xl"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitTransform: 'translate3d(0,0,0)',
        transform: 'translate3d(0,0,0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      <nav className="app-bottom-nav-inner mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/inicio' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-indigo-500' : 'text-gray-500 hover:text-[#171923]'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-indigo-500/20' : ''}`} />
              <span className="app-bottom-nav-label text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
