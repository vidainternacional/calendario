'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react'

export default function LogoutButton() {
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-[#171923] hover:bg-slate-100 disabled:opacity-50 transition-all"
    >
      <LogOut className="w-4 h-4" />
      {pending ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  )
}
