'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { MessageCircle, RefreshCcw, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { enviarMensajeAyudaSolidaria } from '@/app/actions/solidaridad'
import { createClient } from '@/lib/supabase/client'
import type { SolidarityMessage } from '@/lib/solidarity/types'

type ContextType = 'solicitud' | 'aporte'

export default function SolidarityChat({
  contextType,
  contextId,
  currentUserId,
  label = 'Conversación en VIDA',
}: {
  contextType: ContextType
  contextId: string
  currentUserId: string
  label?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SolidarityMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      let query = (supabase as any)
        .from('ayuda_solidaria_mensajes')
        .select('id, solicitud_id, aporte_id, autor_id, mensaje, created_at')
        .order('created_at', { ascending: true })
        .limit(200)

      query = contextType === 'solicitud'
        ? query.eq('solicitud_id', contextId)
        : query.eq('aporte_id', contextId)

      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setMessages((data || []) as SolidarityMessage[])
    } catch (loadError) {
      console.error('[solidarity-chat] cargar', loadError)
      setError('No fue posible actualizar la conversación.')
    } finally {
      setLoading(false)
    }
  }, [contextId, contextType])

  useEffect(() => {
    if (!open) return
    void load()
    const interval = window.setInterval(() => void load(), 8000)
    return () => window.clearInterval(interval)
  }, [load, open])

  const send = () => {
    const message = text.trim()
    if (!message) return
    setError(null)
    startTransition(async () => {
      const result = await enviarMensajeAyudaSolidaria({
        requestId: contextType === 'solicitud' ? contextId : undefined,
        contributionId: contextType === 'aporte' ? contextId : undefined,
        message,
      })
      if (!result.success) {
        setError(result.error || 'No fue posible enviar el mensaje.')
        return
      }
      setText('')
      await load()
      router.refresh()
    })
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-xs font-extrabold text-slate-700">
        <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-violet-600" />{label}</span>
        <span className="text-[10px] font-bold text-slate-400">{open ? 'Cerrar' : 'Abrir'}</span>
      </button>

      {open ? (
        <div className="border-t border-slate-200/70 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold text-slate-400">Privado entre tú y el equipo autorizado.</p>
            <button type="button" onClick={() => void load()} disabled={loading} className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200 disabled:opacity-50" aria-label="Actualizar conversación">
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-white p-3 ring-1 ring-slate-100">
            {messages.length === 0 ? <p className="py-4 text-center text-xs text-slate-400">Aún no hay mensajes. Puedes escribir aquí para coordinar.</p> : null}
            {messages.map((item) => {
              const own = item.autor_id === currentUserId
              return (
                <div key={item.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] rounded-2xl px-3 py-2 ${own ? 'bg-[#5b3df5] text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-5">{item.mensaje}</p>
                    <p className={`mt-1 text-[9px] ${own ? 'text-white/65' : 'text-slate-400'}`}>{own ? 'Tú' : 'Equipo VIDA'} · {new Date(item.created_at).toLocaleString('es-SV')}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} maxLength={2000} placeholder="Escribe un mensaje" className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400" />
            <button type="button" disabled={pending || !text.trim()} onClick={send} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#5b3df5] text-white disabled:opacity-50" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button>
          </div>
          {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
