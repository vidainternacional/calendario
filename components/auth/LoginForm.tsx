'use client'

import { useActionState, useState } from 'react'
import { login, type AuthState } from '@/app/actions/auth'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-4">
      {/* Error */}
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-300"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-300"
        >
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white transition-colors"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Ingresando...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </button>

      {/* Signup link */}
      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link
          href="/signup"
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
