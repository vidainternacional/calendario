'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'
import { deriveProgressMetrics, SKILL_LABELS, type HebrewDifficulty, type HebrewProgressAnswer, type HebrewProgressSession } from '@/lib/hebreo/progress'
import { deriveSessionGrades, deriveStrictAdaptiveLevel } from '@/lib/hebreo/progress-mastery'
import { loadHebrewProgress } from '@/lib/hebreo/progress-store'

function levelName(difficulty: HebrewDifficulty | null) {
  if (difficulty === 'initial') return 'Nivel 1 · Básico'
  if (difficulty === 'intermediate') return 'Nivel 2 · Intermedio'
  if (difficulty === 'advanced') return 'Nivel 3 · Avanzado'
  return 'Según mi progreso'
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function ProgressRing({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className="relative grid h-[118px] w-[118px] place-items-center rounded-full" style={{ background: `conic-gradient(rgb(99 102 241) ${safe * 3.6}deg, rgb(224 231 255) 0deg)` }}>
      <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-[#f9f9fb] text-center shadow-[inset_0_0_0_1px_rgba(99,102,241,0.06)]">
        <div><p className="text-[24px] font-black leading-none text-slate-950">{label}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">{sublabel}</p></div>
      </div>
    </div>
  )
}

export default function HebrewProgressSummary() {
  const [sessions, setSessions] = useState<HebrewProgressSession[]>([])
  const [answers, setAnswers] = useState<HebrewProgressAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadHebrewProgress()
      setSessions(data.sessions)
      setAnswers(data.answers)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu progreso.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const metrics = useMemo(() => deriveProgressMetrics(sessions, answers), [sessions, answers])
  const gradebook = useMemo(() => deriveSessionGrades(sessions, answers), [sessions, answers])
  const adaptive = useMemo(() => deriveStrictAdaptiveLevel(answers), [answers])
  const practicedAreas = metrics.areas.filter(area => area.attempts > 0)

  if (loading) return <div className="py-8 text-center text-[11px] font-bold text-slate-400">Cargando tu progreso…</div>

  const accuracy = metrics.accuracy ?? 0
  const retention = metrics.retention ?? 0
  const trendDown = metrics.trend.toLowerCase().includes('baj')

  return (
    <div className="pb-4 pt-1 text-center">
      <section className="mx-auto max-w-md">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Tu avance</p>
        <h2 className="mt-1 text-[21px] font-black tracking-[-0.03em] text-slate-950">Nivel {adaptive.level} · {adaptive.label}</h2>

        <div className="mt-5 flex items-center justify-center gap-7">
          <ProgressRing value={adaptive.progress} label={`${adaptive.progress}%`} sublabel="del nivel" />
          <div className="max-w-[150px] text-left">
            <p className="text-[28px] font-black leading-none text-indigo-600">{adaptive.mastery.mastered}<span className="text-[15px] text-slate-400">/{adaptive.mastery.total}</span></p>
            <p className="mt-1 text-[11px] font-bold leading-snug text-slate-600">objetivos dominados</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all" style={{ width: `${adaptive.progress}%` }} /></div>
          </div>
        </div>
      </section>

      <section aria-label="Indicadores de progreso" className="mx-auto mt-6 grid max-w-md grid-cols-3 border-y border-slate-200/70 py-4">
        <div className="flex flex-col items-center"><div className="grid h-[62px] w-[62px] place-items-center rounded-full" style={{ background: `conic-gradient(rgb(14 165 233) ${accuracy * 3.6}deg, rgb(224 242 254) 0deg)` }}><div className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#f9f9fb]"><span className="text-[14px] font-black text-slate-950">{accuracy}%</span></div></div><p className="mt-2 text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">Precisión</p></div>
        <div className="flex flex-col items-center"><div className="grid h-[62px] w-[62px] place-items-center rounded-full" style={{ background: `conic-gradient(rgb(16 185 129) ${retention * 3.6}deg, rgb(209 250 229) 0deg)` }}><div className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#f9f9fb]"><span className="text-[14px] font-black text-slate-950">{metrics.retention === null ? '—' : `${retention}%`}</span></div></div><p className="mt-2 text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">Retención</p></div>
        <div className="flex flex-col items-center justify-center">{trendDown ? <TrendingDown className="h-7 w-7 text-rose-500" /> : <TrendingUp className="h-7 w-7 text-emerald-600" />}<p className="mt-2 max-w-[74px] text-[10px] font-black leading-tight text-slate-600">{metrics.trend}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">Tendencia</p></div>
      </section>

      {practicedAreas.length > 0 && (
        <section className="mx-auto mt-6 max-w-md text-left">
          <h3 className="text-center text-[12px] font-black text-slate-900">Dominio por área</h3>
          <div className="mt-4 space-y-3">
            {practicedAreas.map(area => {
              const value = area.accuracy ?? 0
              return <div key={area.skill}><div className="mb-1.5 flex items-end justify-between gap-3"><div><p className="text-[11px] font-black text-slate-700">{SKILL_LABELS[area.skill]}</p><p className={`text-[9px] font-bold ${area.state === 'Dominado' ? 'text-emerald-600' : area.state === 'Reforzar' ? 'text-rose-500' : 'text-amber-600'}`}>{area.state}</p></div><span className="text-[12px] font-black text-slate-700">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200/70"><div className={`h-full rounded-full transition-all ${area.state === 'Dominado' ? 'bg-emerald-500' : area.state === 'Reforzar' ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${value}%` }} /></div></div>
            })}
          </div>
        </section>
      )}

      <section className="mx-auto mt-7 max-w-md">
        <div className="flex items-center justify-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" /><h3 className="text-[13px] font-black text-slate-900">Evaluaciones registradas</h3></div>
        {gradebook.length === 0 ? (
          <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-slate-500">Todavía no hay pruebas terminadas en esta cuenta. Cuando completes una evaluación aparecerá aquí con su nota y evolución.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[16px] bg-slate-100/65 text-left shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"><span>Evaluación</span><span>Aciertos</span><span>Nota</span></div>
            {gradebook.slice(0, 12).map(row => <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-white/75 px-3 py-3 text-[10px]"><div><p className="font-black text-slate-800">{levelName(row.difficulty)}</p><p className="mt-0.5 text-[9px] text-slate-400">{dateLabel(row.startedAt)}</p></div><span className="font-bold text-slate-600">{row.correct}/{row.answers}</span><span className={`min-w-11 rounded-full px-2 py-1 text-center font-black ${row.score >= 85 ? 'bg-emerald-100/80 text-emerald-700' : row.score >= 65 ? 'bg-amber-100/80 text-amber-700' : 'bg-rose-100/80 text-rose-700'}`}>{row.score}%</span></div>)}
          </div>
        )}
      </section>

      <section className="mx-auto mt-6 max-w-sm border-t border-slate-200/70 pt-5">
        <div className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600" /><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué estudiar después</p></div>
        <p className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p>
        {metrics.evolution !== null && <p className="mt-2 text-[10px] text-slate-500">Cambio frente a tu evaluación anterior: <span className="font-black text-slate-800">{metrics.evolution > 0 ? '+' : ''}{metrics.evolution} puntos</span>.</p>}
      </section>

      {error && <p role="alert" className="mt-3 text-[10px] font-bold text-rose-600">{error}</p>}
    </div>
  )
}
