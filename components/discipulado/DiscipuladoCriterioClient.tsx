'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Settings2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string
  titulo: string
  estado: 'borrador' | 'publicado' | 'archivado'
  nota_minima_aprobacion: number
}

export default function DiscipuladoCriterioClient() {
  const supabase = useMemo(() => createClient() as any, [])
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('discipulado_cursos')
      .select('id,titulo,estado,nota_minima_aprobacion')
      .order('updated_at', { ascending: false })
    setLoading(false)
    if (queryError) {
      setError(queryError.message)
      return
    }
    const rows = (data || []) as Course[]
    setCourses(rows)
    setSelectedId(current => current && rows.some(course => course.id === current) ? current : rows[0]?.id || '')
  }

  useEffect(() => {
    if (open) void load()
  }, [open])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedId) return
    const form = new FormData(event.currentTarget)
    const value = Number(form.get('nota_minima'))
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError('La nota mínima debe estar entre 0 y 100.')
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)
    const { error: updateError } = await supabase
      .from('discipulado_cursos')
      .update({ nota_minima_aprobacion: value, updated_at: new Date().toISOString() })
      .eq('id', selectedId)
    setBusy(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setNotice('Nota mínima actualizada.')
    await load()
  }

  const selected = courses.find(course => course.id === selectedId) || null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] right-4 z-[65] inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 text-xs font-bold text-violet-700 shadow-lg shadow-slate-900/10"
        aria-label="Configurar nota mínima del discipulado"
      >
        <Settings2 className="h-4 w-4" /> Nota mínima
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-end bg-slate-950/40 sm:items-center sm:justify-center">
          <section className="w-full rounded-t-[28px] bg-[#f4f5f9] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-violet-600">Criterio pastoral</p>
                <h2 className="mt-1 text-xl font-bold text-[#171923]">Nota mínima de aprobación</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">El pastor no podrá aprobar un resultado menor al porcentaje definido para ese curso.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-100" aria-label="Cerrar"><X className="h-4 w-4" /></button>
            </div>

            {(error || notice) && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>{error || notice}</div>}

            {loading ? (
              <div className="grid min-h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>
            ) : courses.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">Crea primero un curso de discipulado.</div>
            ) : (
              <form onSubmit={save} className="mt-5 space-y-4 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div>
                  <label htmlFor="criterio-curso" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.08em] text-slate-500">Curso</label>
                  <select id="criterio-curso" value={selectedId} onChange={event => setSelectedId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                    {courses.map(course => <option key={course.id} value={course.id}>{course.titulo}{course.estado === 'publicado' ? ' · Activo' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="criterio-nota" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.08em] text-slate-500">Porcentaje mínimo</label>
                  <div className="relative">
                    <input key={selected?.id} id="criterio-nota" name="nota_minima" type="number" min="0" max="100" step="1" defaultValue={Math.round(Number(selected?.nota_minima_aprobacion ?? 80))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                  </div>
                </div>
                <button disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-violet-50 disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar criterio
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}
