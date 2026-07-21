'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <main className="min-h-screen flex items-center justify-center bg-[#f4f5f9] px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(20,24,40,0.08)] border border-slate-100">
        <h1 className="text-xl font-bold text-[#171923] mb-2">Nueva contraseña</h1>
        <p className="text-sm text-slate-500 mb-6">Crea tu nueva contraseña para Vida Internacional.</p>
        <form action={enviar} className="space-y-4">
          <input name="password" type="password" required placeholder="Nueva contraseña"
            className="w-full text-sm px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" style={{ colorScheme: 'light' }} />
          <input name="confirm" type="password" required placeholder="Repite la contraseña"
            className="w-full text-sm px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" style={{ colorScheme: 'light' }} />
          {msg && <p className={`text-xs font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</p>}
          <button disabled={pending} className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
            {pending ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
