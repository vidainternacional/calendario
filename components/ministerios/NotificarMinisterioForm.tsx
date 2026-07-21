'use client'

import { useState, useTransition } from 'react'
import { notificarMinisterio } from '@/app/actions/ministerio-notificar'
import { mostrarToast } from '@/lib/ui/toast'

export default function NotificarMinisterioForm({ ministerioId, color }: { ministerioId: string; color: string }) {
  const [abierto, setAbierto] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="w-full text-sm font-semibold py-2.5 rounded-xl border-2" style={{ color, borderColor: color }}>
        📢 Enviar notificación al ministerio
      </button>
    )
  }

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const r = await notificarMinisterio(ministerioId, fd.get('titulo') as string, fd.get('mensaje') as string)
      mostrarToast(r.error ?? `📢 Notificación enviada a ${r.enviadas} servidores`, r.error ? 'error' : 'ok')
      if (!r.error) setAbierto(false)
    })

  return (
    <form action={enviar} className="space-y-3">
      <input name="titulo" required placeholder="Título (ej: Cambio de horario)" className="w-full text-sm px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none" style={{ colorScheme: 'light' }} />
      <textarea name="mensaje" required rows={3} placeholder="Mensaje para todos los del ministerio..." className="w-full text-sm px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none resize-none" style={{ colorScheme: 'light' }} />
      <div className="flex gap-2">
        <button disabled={pending} className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-white disabled:opacity-50" style={{ background: color }}>
          {pending ? 'Enviando…' : '📤 Enviar a todos'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="px-4 text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Cancelar</button>
      </div>
    </form>
  )
}
