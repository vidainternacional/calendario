'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Megaphone, FileText, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Inicio', href: '/inicio', icon: Home },
    { name: 'Calendario', href: '/calendario', icon: Calendar },
    { name: 'Avisos', href: '/avisos', icon: Megaphone },
    { name: 'Solicitudes', href: '/solicitudes', icon: FileText },
    { name: 'Perfil', href: '/perfil', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_18px_rgba(20,24,40,0.08)] pb-safe">
      <nav className="flex justify-around items-center px-2 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          // Simple match: if pathname starts with href, it's active. Except for exact matches if needed.
          // For '/ministerios', any subpath should also light it up.
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
