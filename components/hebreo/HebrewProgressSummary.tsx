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

  return (
    <div className="pb-4 pt-2 text-center">
      <div className="mx-auto max-w-sm">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Nivel actual</p>
        <p className="mt-1 text-[20px] font-black text-slate-950">Nivel {adaptive.level} · {adaptive.label}</p>
        <p className="mt-1 text-[10px] font-bold text-emerald-700">{adaptive.mastery.mastered} de {adaptive.mastery.total} objetivos dominados</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${adaptive.progress}%` }} /></div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3">
        <div><p className="text-[20px] font-black text-slate-950">{metrics.accuracy ?? 0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div>
        <div><p className="text-[20px] font-black text-slate-950">{metrics.retention === null ? '—' : `${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div>
        <div className="flex flex-col items-center justify-center">{metrics.trend.toLowerCase().includes('baj') ? <TrendingDown className="h-4 w-4 text-rose-500" /> : <TrendingUp className="h-4 w-4 text-emerald-600" />}<p className="mt-1 text-[9px] font-black text-slate-500">{metrics.trend}</p></div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" /><h3 className="text-[13px] font-black text-slate-900">Evaluaciones registradas</h3></div>
        {gradebook.length === 0 ? (
          <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-slate-500">Todavía no hay pruebas terminadas en esta cuenta. Cuando completes una evaluación aparecerá aquí con su nota y evolución.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200 bg-white text-left">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"><span>Evaluación</span><span>Aciertos</span><span>Nota</span></div>
            {gradebook.slice(0, 12).map(row => <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-slate-100 px-3 py-3 text-[10px]"><div><p className="font-black text-slate-800">{levelName(row.difficulty)}</p><p className="mt-0.5 text-[9px] text-slate-400">{dateLabel(row.startedAt)}</p></div><span className="font-bold text-slate-600">{row.correct}/{row.answers}</span><span className={`min-w-11 rounded-full px-2 py-1 text-center font-black ${row.score >= 85 ? 'bg-emerald-50 text-emerald-700' : row.score >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{row.score}%</span></div>)}
          </div>
        )}
      </div>

      {practicedAreas.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[12px] font-black text-slate-900">Dominio por área</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {practicedAreas.map(area => <div key={area.skill} className="rounded-[16px] border border-slate-200 bg-white px-3 py-3"><p className="text-[10px] font-bold text-slate-500">{SKILL_LABELS[area.skill]}</p><p className="mt-1 text-[16px] font-black text-slate-950">{area.accuracy ?? 0}%</p><p className={`mt-0.5 text-[9px] font-black ${area.state === 'Dominado' ? 'text-emerald-700' : area.state === 'Reforzar' ? 'text-rose-600' : 'text-amber-700'}`}>{area.state}</p></div>)}
          </div>
        </div>
      )}

      <div className="mx-auto mt-5 max-w-sm border-t border-slate-100 pt-4">
        <div className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-600" /><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué estudiar después</p></div>
        <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p>
        {metrics.evolution !== null && <p className="mt-2 text-[10px] text-slate-500">Cambio frente a tu evaluación anterior: <span className="font-black text-slate-800">{metrics.evolution > 0 ? '+' : ''}{metrics.evolution} puntos</span>.</p>}
      </div>

      {error && <p role="alert" className="mt-3 text-[10px] font-bold text-rose-600">{error}</p>}
    </div>
  )
}
