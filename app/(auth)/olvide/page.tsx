'use client'

import { useState, useTransition } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { solicitarRecuperacion } from '@/app/actions/recuperacion'
import AuthFrame from '@/components/auth/AuthFrame'

export default function OlvidePage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const r = await solicitarRecuperacion(fd.get('email') as string)
      setMsg(r.error ?? '✓ Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja y spam.')
    })

  return (
    <AuthFrame
      title="Recupera tu acceso"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña."
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      <form action={enviar} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        {msg && (
          <p className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-5 ${msg.startsWith('✓') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {msg}
          </p>
        )}

        <button
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-600/20 transition active:scale-[0.985] disabled:opacity-50"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</> : 'Enviar enlace'}
        </button>
      </form>
    </AuthFrame>
  )
}
