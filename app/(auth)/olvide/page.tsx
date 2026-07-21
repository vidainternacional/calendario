'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { solicitarRecuperacion } from '@/app/actions/recuperacion'

export default function OlvidePage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const r = await solicitarRecuperacion(fd.get('email') as string)
      setMsg(r.error ?? '✓ Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).')
    })

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f5f9] px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(20,24,40,0.08)] border border-slate-100">
        <h1 className="text-xl font-bold text-[#171923] mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-slate-500 mb-6">Escribe tu correo y te enviaremos un enlace para crear una nueva.</p>
        <form action={enviar} className="space-y-4">
          <input name="email" type="email" required placeholder="tu@correo.com"
            className="w-full text-sm px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" style={{ colorScheme: 'light' }} />
          {msg && <p className={`text-xs font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</p>}
          <button disabled={pending} className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
            {pending ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
        <Link href="/login" className="block text-center text-xs text-slate-400 mt-5 hover:text-[#171923]">← Volver a iniciar sesión</Link>
      </div>
    </main>
  )
}
