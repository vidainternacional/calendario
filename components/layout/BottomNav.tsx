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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#ffffff',
        boxShadow: '0 -4px 18px rgba(20,24,40,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: 'translateZ(0)',
      }}
    >
      <nav className="flex justify-around items-center px-2 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/inicio' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-indigo-500' : 'text-gray-500 hover:text-[#171923]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-500/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
