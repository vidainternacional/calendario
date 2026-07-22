'use client'

import { useState, useTransition } from 'react'
import { notificarMinisterio } from '@/app/actions/ministerio-notificar'
import { mostrarToast } from '@/lib/ui/toast'

export default function NotificarMinisterioForm({ ministerioId, color }: { ministerioId: string; color: string }) {
  const [abierto, setAbierto] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full min-h-11 px-3 text-sm font-semibold leading-snug rounded-xl border-2 break-safe"
        style={{ color, borderColor: color }}
      >
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
    <form action={enviar} className="min-w-0 space-y-3">
      <input
        name="titulo"
        required
        placeholder="Título (ej: Cambio de horario)"
        className="w-full min-w-0 text-sm px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none"
        style={{ colorScheme: 'light' }}
      />
      <textarea
        name="mensaje"
        required
        rows={3}
        placeholder="Mensaje para todos los del ministerio..."
        className="w-full min-w-0 text-sm px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none resize-none"
        style={{ colorScheme: 'light' }}
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          disabled={pending}
          className="w-full sm:flex-1 min-h-11 px-3 text-sm font-semibold leading-snug rounded-xl text-white disabled:opacity-50 break-safe"
          style={{ background: color }}
        >
          {pending ? 'Enviando…' : '📤 Enviar a todos'}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="w-full sm:w-auto min-h-11 px-4 text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}