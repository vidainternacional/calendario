'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, BookOpen, ChevronDown, ChevronRight, Clock3, Loader2, Sparkles } from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import { guardarPreferenciaVersiculoDiario } from '@/app/actions/versiculo-diario'
import { dailyVerseForDate, fetchVerseText } from '@/lib/biblia/vida-daily'
import { mostrarToast } from '@/lib/ui/toast'

type Props = {
  initialActive: boolean
  initialHour: number
}

export default function VidaHoyClient({ initialActive, initialHour }: Props) {
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
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="pb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Tu día con la Biblia</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] text-[#171923]">Hoy en VIDA</h1>
      </header>

      <section className="border-y border-slate-100 py-6" aria-labelledby="versiculo-del-dia-title">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C0392B]" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Versículo del día</p>
        </div>
        <h2 id="versiculo-del-dia-title" className="mt-2 text-xl font-bold text-slate-950">{daily.label}</h2>
        <div className="mt-4 min-h-[92px] text-[18px] leading-8 text-slate-700">
          {verseLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <p>“{verseText}”</p>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link href={`/biblia?book=${daily.book}&chapter=${daily.chapter}&verse=${daily.verse ?? 1}`} className="inline-flex min-h-11 items-center gap-2 bg-[#C0392B] px-4 text-sm font-bold text-white">
            <BookOpen className="h-4 w-4" />Abrir Biblia
          </Link>
          <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(daily.label)}&auto=1`} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600">
            <Sparkles className="h-4 w-4" />Estudiar
          </Link>
        </div>
      </section>

      <details className="group border-b border-slate-100">
        <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Bell className="h-4 w-4 shrink-0 text-slate-500" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Recordatorio diario</p>
              <p className="mt-0.5 text-xs text-slate-500">{active ? `Activo · ${String(hour).padStart(2, '0')}:00` : 'Desactivado'}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="pb-5 pl-7">
          <div className="border-t border-slate-100 pt-4"><PushToggle /></div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-slate-400" />Hora</div>
            <select value={hour} disabled={!active || isPending} onChange={e => saveReminder(true, Number(e.target.value))} className="h-10 border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 disabled:opacity-50">
              {Array.from({ length: 18 }, (_, i) => i + 5).map(value => <option key={value} value={value}>{String(value).padStart(2, '0')}:00</option>)}
            </select>
          </div>
          <button type="button" onClick={() => saveReminder(!active)} disabled={isPending} className={`mt-4 min-h-10 px-4 text-sm font-bold transition ${active ? 'border border-slate-200 text-slate-700' : 'bg-[#C0392B] text-white'}`}>
            {isPending ? 'Guardando…' : active ? 'Desactivar recordatorio' : 'Activar recordatorio'}
          </button>
        </div>
      </details>

      <section className="mt-10" aria-labelledby="seguir-creciendo-title">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Para seguir creciendo</p>
        <Link href="/hoy/planes" className="mt-2 flex min-h-[86px] items-center justify-between gap-4 border-y border-slate-100 py-4">
          <div className="min-w-0">
            <h2 id="seguir-creciendo-title" className="font-bold text-slate-950">Planes de lectura</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">Elige un objetivo y avanza con una lectura guiada a tu ritmo.</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </Link>
      </section>
    </main>
  )
}
