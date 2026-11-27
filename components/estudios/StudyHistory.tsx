'use client'

import { useEffect, useState } from 'react'
import { Clock, Loader2, Trash2 } from 'lucide-react'
import { abrirEstudioHistorial, eliminarEstudioHistorial, listarEstudiosHistorial } from '@/app/actions/estudio-historial'
import type { EstudioState } from '@/app/actions/estudio-interno'
import type { StudyHistoryItem } from '@/lib/estudios/study-history-types'

export default function StudyHistory({ revision, disabled, onRestore, onBusy }: {
  revision?: string
  disabled: boolean
  onRestore: (state: EstudioState) => void
  onBusy: (busy: boolean) => void
}) {
  const [items, setItems] = useState<StudyHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listarEstudiosHistorial().then(result => {
      if (cancelled) return
      if (result.success) { setItems(result.items); setTotal(result.total); setHasMore(result.hasMore); setError('') }
      else setError(result.error)
    }).catch(() => { if (!cancelled) setError('No pudimos cargar tu historial.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [revision])

  const open = async (id: string) => {
    if (disabled || busy) return
    setBusy(id); onBusy(true); setError('')
    try {
      const response = await abrirEstudioHistorial(id)
      if (response.status === 'success' || response.status === 'place') onRestore(response)
      else setError(response.status === 'error' ? response.error : 'No pudimos abrir esa respuesta.')
    } catch { setError('No pudimos abrir esa respuesta. No se generó una nueva.') }
    finally { setBusy(null); onBusy(false) }
  }

  const remove = async (id: string) => {
    if (disabled || busy || !window.confirm('¿Eliminar esta respuesta del historial? Si vuelves a buscarla, podría consumir IA para generarla otra vez.')) return
    setBusy(id); onBusy(true); setError('')
    try {
      const result = await eliminarEstudioHistorial(id)
      if (!result.success) { setError(result.error ?? 'No pudimos eliminar la respuesta.'); return }
      const page = await listarEstudiosHistorial()
      if (page.success) { setItems(page.items); setTotal(page.total); setHasMore(page.hasMore) }
      else setError(page.error)
    } catch { setError('No pudimos actualizar tu historial.') }
    finally { setBusy(null); onBusy(false) }
  }

  const more = async () => {
    if (disabled || busy) return
    setBusy('more'); setError('')
    try {
      const result = await listarEstudiosHistorial(items.length)
      if (result.success) {
        setItems(previous => [...new Map([...previous, ...result.items].map(item => [item.id, item])).values()])
        setTotal(result.total); setHasMore(result.hasMore)
      } else setError(result.error)
    } catch { setError('No pudimos cargar las respuestas anteriores.') }
    finally { setBusy(null) }
  }

  return <details className="border-y border-slate-200 px-1 py-2">
    <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-800">
      <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#C0392B]" aria-hidden="true" /> Historial</span>
      <span className="text-xs font-normal text-slate-500">{loading ? 'Cargando…' : total}</span>
    </summary>
    <p className="mb-2 text-xs leading-5 text-slate-500">Solo tú puedes abrir tus respuestas guardadas. Abrirlas no vuelve a consultar la IA.</p>
    {error && <p role="status" className="py-2 text-sm text-amber-800">{error}</p>}
    {!loading && !error && items.length === 0 && <p className="py-3 text-sm text-slate-500">Tus próximas respuestas aparecerán aquí cuando queden guardadas.</p>}
    <div className="divide-y divide-slate-100">{items.map(item => <div key={item.id} className="flex items-center gap-2 py-1">
      <button type="button" disabled={disabled || Boolean(busy)} onClick={() => void open(item.id)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pr-2 text-left disabled:opacity-50">
        {busy === item.id ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-slate-800">{item.consulta}</span>
          <span className="mt-1 block text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
      </button>
      <button type="button" disabled={disabled || Boolean(busy)} onClick={() => void remove(item.id)} aria-label={`Eliminar del historial: ${item.consulta}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
    </div>)}</div>
    {hasMore && <button type="button" disabled={disabled || Boolean(busy)} onClick={() => void more()} className="min-h-11 py-2 text-sm font-semibold text-[#A93226] disabled:opacity-50">{busy === 'more' ? 'Cargando…' : 'Ver respuestas anteriores'}</button>}
  </details>
}
