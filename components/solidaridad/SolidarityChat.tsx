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
  defaultOpen = false,
  alwaysOpen = false,
}: {
  contextType: ContextType
  contextId: string
  currentUserId: string
  label?: string
  defaultOpen?: boolean
  alwaysOpen?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<SolidarityMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const visible = alwaysOpen || open

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
    if (!visible) return
    void load()
    const interval = window.setInterval(() => void load(), 8000)
    return () => window.clearInterval(interval)
  }, [load, visible])

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
    <div className={alwaysOpen ? '' : 'mt-3 border-t border-slate-100 pt-3'}>
      {!alwaysOpen ? (
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-xs font-extrabold text-slate-700">
          <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-violet-600" />{label}</span>
          <span className="text-[10px] font-bold text-slate-400">{open ? 'Ocultar' : 'Abrir'}</span>
        </button>
      ) : null}

      {visible ? (
        <div className={alwaysOpen ? '' : 'pt-2'}>
          {!alwaysOpen ? (
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-medium text-slate-400">Privado entre tú y el equipo autorizado.</p>
              <button type="button" onClick={() => void load()} disabled={loading} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-50" aria-label="Actualizar conversación">
                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : null}

          <div className={`space-y-2 overflow-y-auto bg-[#eef0f4] p-3 ${alwaysOpen ? 'min-h-[46vh] max-h-[58vh]' : 'max-h-72 rounded-2xl'}`}>
            {messages.length === 0 ? <p className="py-8 text-center text-xs text-slate-500">Escribe abajo para iniciar la conversación.</p> : null}
            {messages.map((item) => {
              const own = item.autor_id === currentUserId
              return (
                <div key={item.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[84%] px-3 py-2 shadow-sm ${own ? 'rounded-[18px_18px_5px_18px] bg-[#5b3df5] text-white' : 'rounded-[18px_18px_18px_5px] bg-white text-slate-800'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-5">{item.mensaje}</p>
                    <p className={`mt-1 text-[9px] ${own ? 'text-white/65' : 'text-slate-400'}`}>{own ? 'Tú' : 'Equipo VIDA'} · {new Date(item.created_at).toLocaleString('es-SV')}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={`flex items-end gap-2 bg-white p-2 ${alwaysOpen ? 'border-t border-slate-200' : 'mt-2 rounded-2xl ring-1 ring-slate-200'}`}>
            {alwaysOpen ? (
              <button type="button" onClick={() => void load()} disabled={loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-400 disabled:opacity-50" aria-label="Actualizar conversación">
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            ) : null}
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={1} maxLength={2000} placeholder="Escribe un mensaje…" className="min-h-10 flex-1 resize-none rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            <button type="button" disabled={pending || !text.trim()} onClick={send} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#5b3df5] text-white disabled:opacity-40" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button>
          </div>
          {error ? <p className="px-3 pt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
