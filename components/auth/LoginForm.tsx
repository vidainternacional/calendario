'use client'

import { useActionState, useState } from 'react'
import { login, type AuthState } from '@/app/actions/auth'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginForm({ nextPath = '/inicio' }: { nextPath?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state?.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-slate-700">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-sm font-bold text-slate-700">
            Contraseña
          </label>
          <Link href="/olvide" className="text-xs font-bold text-[#C0392B] transition hover:text-[#9f2f24]">
            ¿La olvidaste?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Ingresando...</> : 'Iniciar sesión'}
      </button>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-center text-sm text-slate-500">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/signup" className="font-black text-[#C0392B] transition hover:text-[#9f2f24]">
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  )
}
