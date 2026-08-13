'use client'

import { useActionState, useState } from 'react'
import { signup, type AuthState } from '@/app/actions/auth'
import { User, Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const inputClass = 'h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10'

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.success}</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="nombre" className="block text-sm font-bold text-slate-700">Nombre completo</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input id="nombre" name="nombre" type="text" placeholder="Juan Pérez" required autoComplete="name" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-slate-700">Correo electrónico</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input id="email" name="email" type="email" placeholder="tu@correo.com" required autoComplete="email" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-bold text-slate-700">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
            className={`${inputClass} pr-12`}
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

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700">Confirmar contraseña</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
          >
            {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Creando cuenta...</> : 'Crear cuenta'}
      </button>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-black text-[#C0392B] transition hover:text-[#9f2f24]">Iniciar sesión</Link>
        </p>
      </div>
    </form>
  )
}
