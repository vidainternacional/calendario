'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, BookOpen, ChevronRight, Clock3, Loader2, Sparkles } from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import { guardarPreferenciaVersiculoDiario } from '@/app/actions/versiculo-diario'
import { dailyVerseForDate, fetchVerseText } from '@/lib/biblia/vida-daily'
import { mostrarToast } from '@/lib/ui/toast'

export type VidaPlanSummary = {
  id: string
  title: string
  description: string
  total: number
  completed: number
  nextDay: number
  nextLabel: string
  done: boolean
}

type Props = {
  initialActive: boolean
  initialHour: number
  plans: VidaPlanSummary[]
}

export default function VidaHoyClient({ initialActive, initialHour, plans }: Props) {
  const daily = useMemo(() => dailyVerseForDate(), [])
  const [verseText, setVerseText] = useState('')
  const [verseLoading, setVerseLoading] = useState(true)
  const [active, setActive] = useState(initialActive)
  const [hour, setHour] = useState(initialHour)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    fetchVerseText(daily)
      .then(text => { if (!cancelled) setVerseText(text) })
      .catch(() => { if (!cancelled) setVerseText('Abre la Biblia para leer el versículo de hoy.') })
      .finally(() => { if (!cancelled) setVerseLoading(false) })
    return () => { cancelled = true }
  }, [daily])

  const saveReminder = (nextActive: boolean, nextHour = hour) => {
    setActive(nextActive)
    setHour(nextHour)
    startTransition(async () => {
      const result = await guardarPreferenciaVersiculoDiario(nextActive, nextHour)
      if (result?.error) {
        setActive(initialActive)
        mostrarToast(result.error)
        return
      }
      mostrarToast(nextActive ? `Recordatorio guardado para las ${String(nextHour).padStart(2, '0')}:00` : 'Recordatorio desactivado')
    })
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Tu día con la Biblia</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Hoy en VIDA</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">Un versículo para hoy y planes sencillos para avanzar paso a paso.</p>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#C0392B] text-white"><Sparkles className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Versículo del día</p>
            <h2 className="text-lg font-bold text-slate-950">{daily.label}</h2>
          </div>
        </div>
        <div className="mt-5 min-h-[92px] text-[18px] leading-8 text-slate-700">
          {verseLoading ? <Loader2 className="h-5 w-5 animate-spin text-violet-500" /> : <p>“{verseText}”</p>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/biblia?book=${daily.book}&chapter=${daily.chapter}&verse=${daily.verse ?? 1}`} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 text-sm font-bold text-white"><BookOpen className="h-4 w-4" />Abrir Biblia</Link>
          <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(daily.label)}&auto=1`} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-bold text-slate-700"><Sparkles className="h-4 w-4" />Estudiar</Link>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-violet-600" /><div><h2 className="font-bold text-slate-950">Recordatorio diario</h2><p className="text-xs text-slate-500">Recíbelo en la pantalla de bloqueo cuando las notificaciones estén activas.</p></div></div>
        <div className="mt-4 border-t border-slate-100 pt-4"><PushToggle /></div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-violet-500" />Hora</div>
          <select value={hour} disabled={!active || isPending} onChange={e => saveReminder(true, Number(e.target.value))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 disabled:opacity-50">
            {Array.from({ length: 18 }, (_, i) => i + 5).map(value => <option key={value} value={value}>{String(value).padStart(2, '0')}:00</option>)}
          </select>
        </div>
        <button type="button" onClick={() => saveReminder(!active)} disabled={isPending} className={`mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold transition ${active ? 'bg-violet-50 text-violet-700' : 'bg-violet-600 text-white'}`}>
          {isPending ? 'Guardando…' : active ? 'Desactivar recordatorio' : 'Activar recordatorio'}
        </button>
      </section>

      <section className="mt-6" aria-labelledby="planes-lectura">
        <div className="mb-3 px-1"><h2 id="planes-lectura" className="text-xl font-bold tracking-[-0.02em] text-[#171923]">Planes de lectura</h2><p className="mt-1 text-xs text-slate-500">Tu avance se guarda en tu cuenta y continúa en cualquier dispositivo.</p></div>
        <div className="space-y-3">
          {plans.map(plan => (
            <article key={plan.id} className="rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="font-bold text-slate-950">{plan.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{plan.description}</p></div>
                <span className="shrink-0 text-[11px] font-bold text-slate-500">{plan.completed}/{plan.total}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${Math.round((plan.completed / Math.max(plan.total, 1)) * 100)}%` }} /></div>
              <Link href={`/hoy/planes/${plan.id}/${plan.nextDay}`} className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700">
                <span className="min-w-0 truncate">{plan.done ? 'Revisar plan' : `Día ${plan.nextDay}`} · {plan.nextLabel}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
