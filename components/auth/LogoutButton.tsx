'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react'

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      aria-label={pending ? 'Cerrando sesión' : 'Cerrar sesión'}
      className={compact
        ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition active:scale-95 disabled:opacity-50'
        : 'inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition-all hover:bg-slate-100 hover:text-[#171923] disabled:opacity-50 min-[390px]:px-4'}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!compact && (
        <span className="hidden whitespace-nowrap min-[390px]:inline">
          {pending ? 'Saliendo…' : 'Cerrar sesión'}
        </span>
      )}
    </button>
  )
}
