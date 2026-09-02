'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Trash2 } from 'lucide-react'
import {
  cambiarPublicacionPlanPastoral,
  eliminarDiaPlanPastoral,
  guardarDiaPlanPastoral,
  guardarPlanPastoral,
} from '@/app/actions/planes-lectura-pastoral'
import { mostrarToast } from '@/lib/ui/toast'

export type PastoralPlanData = {
  id: string
  titulo: string
  descripcion: string
  duracion_dias: number
  publicado: boolean
}

export type PastoralPlanDay = {
  plan_id: string
  numero_dia: number
  titulo: string
  book_code: string
  book_name: string
  chapter: number
  verse_start: number | null
  verse_end: number | null
  referencia: string
  devocional: string
  pregunta_reflexion: string
}

const BOOKS = [
  ['GEN','Génesis'],['EXO','Éxodo'],['LEV','Levítico'],['NUM','Números'],['DEU','Deuteronomio'],['JOS','Josué'],['JDG','Jueces'],['RUT','Rut'],['1SA','1 Samuel'],['2SA','2 Samuel'],['1KI','1 Reyes'],['2KI','2 Reyes'],['1CH','1 Crónicas'],['2CH','2 Crónicas'],['EZR','Esdras'],['NEH','Nehemías'],['EST','Ester'],['JOB','Job'],['PSA','Salmos'],['PRO','Proverbios'],['ECC','Eclesiastés'],['SNG','Cantares'],['ISA','Isaías'],['JER','Jeremías'],['LAM','Lamentaciones'],['EZK','Ezequiel'],['DAN','Daniel'],['HOS','Oseas'],['JOL','Joel'],['AMO','Amós'],['OBA','Abdías'],['JON','Jonás'],['MIC','Miqueas'],['NAM','Nahúm'],['HAB','Habacuc'],['ZEP','Sofonías'],['HAG','Hageo'],['ZEC','Zacarías'],['MAL','Malaquías'],['MAT','Mateo'],['MRK','Marcos'],['LUK','Lucas'],['JHN','Juan'],['ACT','Hechos'],['ROM','Romanos'],['1CO','1 Corintios'],['2CO','2 Corintios'],['GAL','Gálatas'],['EPH','Efesios'],['PHP','Filipenses'],['COL','Colosenses'],['1TH','1 Tesalonicenses'],['2TH','2 Tesalonicenses'],['1TI','1 Timoteo'],['2TI','2 Timoteo'],['TIT','Tito'],['PHM','Filemón'],['HEB','Hebreos'],['JAS','Santiago'],['1PE','1 Pedro'],['2PE','2 Pedro'],['1JN','1 Juan'],['2JN','2 Juan'],['3JN','3 Juan'],['JUD','Judas'],['REV','Apocalipsis'],
] as const

type Props = { plan: PastoralPlanData; days: PastoralPlanDay[] }
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function dayIsComplete(day: PastoralPlanDay) {
  return Boolean(
    day.titulo?.trim() &&
    day.book_code?.trim() &&
    day.book_name?.trim() &&
    Number(day.chapter) >= 1 &&
    day.referencia?.trim() &&
    day.devocional?.trim() &&
    day.pregunta_reflexion?.trim()
  )
}

export default function PastoralPlanEditor({ plan, days }: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(plan.titulo)
  const [descripcion, setDescripcion] = useState(plan.descripcion)
  const [duracion, setDuracion] = useState<number | ''>(plan.duracion_dias)
  const [selectedDay, setSelectedDay] = useState(1)
  const [published, setPublished] = useState(plan.publicado)
  const [pendingPlan, startPlan] = useTransition()
  const [pendingPublish, startPublish] = useTransition()
  const [planSaveState, setPlanSaveState] = useState<SaveState>('idle')
  const planAutosaveReadyRef = useRef(false)
  const planAutosaveSerialRef = useRef(0)
  const completeDays = useMemo(() => new Set(days.filter(dayIsComplete).map(day => day.numero_dia)), [days])
  const draftDays = useMemo(() => new Set(days.map(day => day.numero_dia)), [days])
  const duracionNumero = duracion === '' ? 0 : duracion

  function savePlan(showToast = true) {
    startPlan(async () => {
      const result = await guardarPlanPastoral(plan.id, { titulo, descripcion, duracionDias: Number(duracion) })
      if (result.error) {
        setPlanSaveState('error')
        if (showToast) mostrarToast(result.error)
        return
      }
      setPlanSaveState('saved')
      if (showToast) mostrarToast('Datos del plan guardados')
      router.refresh()
    })
  }

  useEffect(() => {
    if (!planAutosaveReadyRef.current) {
      planAutosaveReadyRef.current = true
      return
    }
    const duracionActual = Number(duracion)
    if (!titulo.trim() || !descripcion.trim() || !Number.isInteger(duracionActual) || duracionActual < 1 || duracionActual > 90) return
    const serial = ++planAutosaveSerialRef.current
    setPlanSaveState('saving')
    const timer = window.setTimeout(async () => {
      const result = await guardarPlanPastoral(plan.id, { titulo, descripcion, duracionDias: duracionActual })
      if (serial !== planAutosaveSerialRef.current) return
      if (result.error) {
        setPlanSaveState('error')
        return
      }
      setPlanSaveState('saved')
      router.refresh()
    }, 650)
    return () => window.clearTimeout(timer)
  }, [descripcion, duracion, plan.id, router, titulo])

  function togglePublish() {
    startPublish(async () => {
      const result = await cambiarPublicacionPlanPastoral(plan.id, !published)
      if (result.error) return mostrarToast(result.error)
      setPublished(!published)
      mostrarToast(!published ? 'Plan publicado' : 'Plan vuelto a borrador')
      router.refresh()
    })
  }

  const selectedData = days.find(day => day.numero_dia === selectedDay)

  return (
    <>
      <section className="border-y border-slate-100 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Estado</p>
            <p className={`mt-1 text-sm font-bold ${published ? 'text-emerald-700' : 'text-amber-700'}`}>{published ? 'Publicado' : 'Borrador'}</p>
          </div>
          <button
            type="button"
            onClick={togglePublish}
            disabled={pendingPublish}
            className={`min-h-11 rounded-2xl px-4 text-sm font-bold disabled:opacity-60 ${published ? 'border border-slate-200 text-slate-700' : 'bg-[#C0392B] text-white'}`}
          >
            {pendingPublish ? 'Guardando…' : published ? 'Volver a borrador' : 'Publicar plan'}
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="text-sm font-bold text-slate-800">Tema / título
            <input value={titulo} onChange={e => setTitulo(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-medium outline-none focus:border-[#C0392B]" />
          </label>
          <label className="text-sm font-bold text-slate-800">Objetivo
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal leading-6 outline-none focus:border-[#C0392B]" />
          </label>
          <label className="text-sm font-bold text-slate-800">Duración
            <div className="mt-2 flex items-center gap-2"><input type="number" min={1} max={90} value={duracion} onChange={e => setDuracion(e.target.value === '' ? '' : Number(e.target.value))} className="h-11 w-24 rounded-xl border border-slate-200 px-3 font-bold outline-none focus:border-[#C0392B]" /><span className="text-sm text-slate-500">días</span></div>
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={() => savePlan(true)} disabled={pendingPlan} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60">
            {pendingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Guardar ahora
          </button>
          <span className={`text-xs font-bold ${planSaveState === 'error' ? 'text-rose-600' : 'text-slate-400'}`}>
            {planSaveState === 'saving' ? 'Guardando…' : planSaveState === 'saved' ? 'Guardado automático' : planSaveState === 'error' ? 'No se pudo guardar' : 'Autoguardado activo'}
          </span>
        </div>
      </section>

      <section className="pt-6">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C0392B]">Contenido diario</p><h2 className="mt-1 text-xl font-bold text-slate-950">Prepara cada día</h2></div>
          <span className="text-xs font-bold text-slate-400">{completeDays.size}/{duracionNumero} completos</span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: Math.max(1, duracionNumero) }, (_, index) => index + 1).map(day => (
            <button key={day} type="button" onClick={() => setSelectedDay(day)} className={`h-9 shrink-0 rounded-full border px-3 text-xs font-bold ${selectedDay === day ? 'border-[#C0392B] bg-[#C0392B] text-white' : completeDays.has(day) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : draftDays.has(day) ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}>Día {day}</button>
          ))}
        </div>

        <DayEditor key={`${selectedDay}:${selectedData?.titulo ?? 'nuevo'}:${published}`} planId={plan.id} numeroDia={selectedDay} initial={selectedData} published={published} onSaved={() => router.refresh()} />
      </section>
    </>
  )
}

function DayEditor({ planId, numeroDia, initial, published, onSaved }: { planId: string; numeroDia: number; initial?: PastoralPlanDay; published: boolean; onSaved: () => void }) {
  const initialBook = BOOKS.find(([code]) => code === initial?.book_code) ?? BOOKS[0]
  const [titulo, setTitulo] = useState(initial?.titulo ?? '')
  const [bookCode, setBookCode] = useState(initialBook[0])
  const [bookName, setBookName] = useState(initial?.book_name ?? initialBook[1])
  const [chapter, setChapter] = useState(initial?.chapter ?? 1)
  const [verseStart, setVerseStart] = useState<number | ''>(initial?.verse_start ?? '')
  const [verseEnd, setVerseEnd] = useState<number | ''>(initial?.verse_end ?? '')
  const [referencia, setReferencia] = useState(initial?.referencia ?? '')
  const [devocional, setDevocional] = useState(initial?.devocional ?? '')
  const [pregunta, setPregunta] = useState(initial?.pregunta_reflexion ?? '')
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const autosaveReadyRef = useRef(false)
  const autosaveSerialRef = useRef(0)
  const latestDraftRef = useRef<any>(null)
  const lastSavedSignatureRef = useRef('')

  function changeBook(code: string) {
    const found = BOOKS.find(([value]) => value === code) ?? BOOKS[0]
    setBookCode(found[0])
    setBookName(found[1])
  }

  const draft = {
    numeroDia,
    titulo,
    bookCode,
    bookName,
    chapter,
    verseStart: verseStart === '' ? null : verseStart,
    verseEnd: verseEnd === '' ? null : verseEnd,
    referencia,
    devocional,
    preguntaReflexion: pregunta,
  }
  latestDraftRef.current = draft
  const signature = JSON.stringify(draft)

  if (!lastSavedSignatureRef.current) {
    lastSavedSignatureRef.current = JSON.stringify({
      numeroDia,
      titulo: initial?.titulo ?? '',
      bookCode: initial?.book_code ?? initialBook[0],
      bookName: initial?.book_name ?? initialBook[1],
      chapter: initial?.chapter ?? 1,
      verseStart: initial?.verse_start ?? null,
      verseEnd: initial?.verse_end ?? null,
      referencia: initial?.referencia ?? '',
      devocional: initial?.devocional ?? '',
      preguntaReflexion: initial?.pregunta_reflexion ?? '',
    })
  }

  async function persistDraft(showToast = false, refresh = true) {
    const current = latestDraftRef.current
    const currentSignature = JSON.stringify(current)
    if (currentSignature === lastSavedSignatureRef.current) {
      if (showToast) mostrarToast(`Día ${numeroDia} ya está guardado`)
      return
    }
    const serial = ++autosaveSerialRef.current
    setSaveState('saving')
    const result = await guardarDiaPlanPastoral(planId, current)
    if (serial !== autosaveSerialRef.current) return
    if (result.error) {
      setSaveState('error')
      if (showToast) mostrarToast(result.error)
      return
    }
    lastSavedSignatureRef.current = currentSignature
    setSaveState('saved')
    if (showToast) mostrarToast(`Día ${numeroDia} guardado`)
    if (refresh) onSaved()
  }

  useEffect(() => {
    if (!autosaveReadyRef.current) {
      autosaveReadyRef.current = true
      return
    }
    if (signature === lastSavedSignatureRef.current) return
    setSaveState('saving')
    const timer = window.setTimeout(() => { void persistDraft(false, true) }, 650)
    return () => window.clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  useEffect(() => {
    return () => {
      const current = latestDraftRef.current
      if (!current) return
      const currentSignature = JSON.stringify(current)
      if (currentSignature === lastSavedSignatureRef.current) return
      void guardarDiaPlanPastoral(planId, current)
    }
  }, [numeroDia, planId])

  function save() {
    startTransition(async () => { await persistDraft(true, true) })
  }

  function remove() {
    if (!initial) return
    if (!window.confirm(`¿Eliminar el contenido del día ${numeroDia}?`)) return
    startDelete(async () => {
      const result = await eliminarDiaPlanPastoral(planId, numeroDia)
      if (result.error) return mostrarToast(result.error)
      mostrarToast(`Día ${numeroDia} eliminado`)
      onSaved()
    })
  }

  return (
    <div className="mt-4 border-y border-slate-100 py-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-950">Día {numeroDia}</h3>
        <span className={`text-xs font-bold ${saveState === 'error' ? 'text-rose-600' : 'text-slate-400'}`}>
          {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado automático' : saveState === 'error' ? 'No se pudo guardar' : 'Autoguardado activo'}
        </span>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Título del día"><input value={titulo} onChange={e => setTitulo(e.target.value)} className="input-plan" placeholder="Ej. Cuando la preocupación pesa" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Libro"><select value={bookCode} onChange={e => changeBook(e.target.value)} className="input-plan">{BOOKS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></Field>
          <Field label="Capítulo"><input type="number" min={1} value={chapter} onChange={e => setChapter(Number(e.target.value))} className="input-plan" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Versículo inicial"><input type="number" min={1} value={verseStart} onChange={e => setVerseStart(e.target.value ? Number(e.target.value) : '')} className="input-plan" placeholder="Opcional" /></Field>
          <Field label="Versículo final"><input type="number" min={1} value={verseEnd} onChange={e => setVerseEnd(e.target.value ? Number(e.target.value) : '')} className="input-plan" placeholder="Opcional" /></Field>
        </div>
        <Field label="Referencia visible"><input value={referencia} onChange={e => setReferencia(e.target.value)} className="input-plan" placeholder="Ej. Filipenses 4:6-7" /></Field>
        <Field label="Devocional"><textarea value={devocional} onChange={e => setDevocional(e.target.value)} rows={7} className="input-plan py-3 leading-6" placeholder="Escribe el devocional del día en dos o tres párrafos breves." /></Field>
        <Field label="Pregunta para reflexionar"><textarea value={pregunta} onChange={e => setPregunta(e.target.value)} rows={3} className="input-plan py-3 leading-6" placeholder="Una pregunta clara para llevar la lectura a la vida diaria." /></Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#C0392B] px-4 text-sm font-bold text-white disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Guardar ahora</button>
        {initial ? <button type="button" onClick={remove} disabled={deleting || published} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:opacity-40"><Trash2 className="h-4 w-4" />Eliminar día</button> : null}
      </div>
      {published ? <p className="mt-3 text-xs text-slate-400">Para eliminar días, vuelve primero el plan a borrador.</p> : null}

      <style jsx>{`.input-plan{min-height:44px;width:100%;border:1px solid rgb(226 232 240);border-radius:12px;background:white;padding-left:12px;padding-right:12px;font-size:14px;color:rgb(15 23 42);outline:none}.input-plan:focus{border-color:#C0392B}`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-800">{label}<div className="mt-2">{children}</div></label>
}
