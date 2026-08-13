'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthFrame from '@/components/auth/AuthFrame'

export default function RestablecerPage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const pass = fd.get('password') as string
      const conf = fd.get('confirm') as string
      if (pass.length < 8) return setMsg('La contraseña debe tener al menos 8 caracteres.')
      if (pass !== conf) return setMsg('Las contraseñas no coinciden.')
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: pass })
      if (error) return setMsg('No se pudo actualizar. El enlace pudo haber expirado — solicita uno nuevo.')
      setMsg('✓ Contraseña actualizada. Entrando…')
      setTimeout(() => router.push('/inicio'), 1200)
    })

  return (
    <AuthFrame
      title="Crea una nueva contraseña"
      subtitle="Elige una contraseña segura para volver a entrar a Vida Internacional."
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      <form action={enviar} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-slate-700">Nueva contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-bold text-slate-700">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        {msg && (
          <p className={`rounded-2xl border px-4 py-3 text-sm font-medium ${msg.startsWith('✓') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {msg}
          </p>
        )}

        <button
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-600/20 transition active:scale-[0.985] disabled:opacity-50"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</> : 'Guardar y entrar'}
        </button>
      </form>
    </AuthFrame>
  )
}
