'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ChevronDown, CircleCheck, Eye, Plus, Save, Trash2, X } from 'lucide-react'

export type OpcionEditable = { id?: string; texto: string; es_correcta: boolean }
export type PreguntaPayload = { enunciado: string; opciones: OpcionEditable[] }

type Props = {
  titulo: string
  enunciado?: string
  opciones?: OpcionEditable[]
  busy: boolean
  inicialmenteAbierto?: boolean
  onGuardar: (input: PreguntaPayload) => Promise<boolean>
  onEliminar?: () => void
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

export default function PreguntaEditor({ titulo, enunciado = '', opciones = [], busy, inicialmenteAbierto = false, onGuardar, onEliminar }: Props) {
  const [abierto, setAbierto] = useState(inicialmenteAbierto)
  const [pregunta, setPregunta] = useState(enunciado)
  const [respuestas, setRespuestas] = useState<OpcionEditable[]>(opciones.length >= 2 ? opciones.map(opcion => ({ ...opcion })) : [
    { texto: '', es_correcta: true },
    { texto: '', es_correcta: false },
  ])
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  useEffect(() => {
    setPregunta(enunciado)
    setRespuestas(opciones.length >= 2 ? opciones.map(opcion => ({ ...opcion })) : [{ texto: '', es_correcta: true }, { texto: '', es_correcta: false }])
  }, [enunciado, opciones.map(o => `${o.id || ''}:${o.texto}:${o.es_correcta}`).join('|')])

  function elegirCorrecta(index: number) {
    setRespuestas(actual => actual.map((item, i) => ({ ...item, es_correcta: i === index })))
    setGuardado(false)
  }

  function quitarOpcion(index: number) {
    setRespuestas(actual => {
      if (actual.length <= 2) return actual
      const resto = actual.filter((_, i) => i !== index)
      if (!resto.some(item => item.es_correcta)) resto[0] = { ...resto[0], es_correcta: true }
      return resto
    })
    setGuardado(false)
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = pregunta.trim()
    const filas = respuestas.map(opcion => ({ ...opcion, texto: opcion.texto.trim() }))
    if (!title || filas.length < 2 || filas.some(opcion => !opcion.texto) || filas.filter(opcion => opcion.es_correcta).length !== 1) {
      setError('Escribí la pregunta, al menos dos respuestas y seleccioná una respuesta correcta.')
      return
    }
    setError('')
    if (await onGuardar({ enunciado: title, opciones: filas })) {
      setGuardado(true)
      if (enunciado) setAbierto(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setAbierto(actual => !actual)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={abierto}>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{titulo}</span>{!abierto && enunciado && <span className="mt-1 block truncate text-xs text-slate-500">{enunciado}</span>}</span>
        {guardado && <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <form onSubmit={guardar} className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4">
          <label className="block text-xs font-semibold text-slate-700">Pregunta
            <textarea value={pregunta} onChange={e => { setPregunta(e.target.value); setGuardado(false) }} rows={2} required className={`${input} mt-2 resize-y`} placeholder="Escribí la pregunta…" />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Opciones de respuesta</p><p className="text-[11px] text-slate-500">Marcá la correcta</p></div>
            {respuestas.map((item, index) => (
              <div key={item.id || `nueva-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                <input type="radio" aria-label={`Opción ${index+1} correcta`} name="respuesta_correcta" checked={item.es_correcta} onChange={() => elegirCorrecta(index)} className="h-4 w-4 shrink-0 accent-violet-600" />
                <input value={item.texto} onChange={e => { setRespuestas(actual => actual.map((row, i) => i === index ? { ...row, texto: e.target.value } : row)); setGuardado(false) }} className="min-w-0 flex-1 bg-transparent py-1 text-sm text-slate-900 outline-none" placeholder={`Respuesta ${index+1}`} />
                <button type="button" disabled={respuestas.length <= 2} onClick={() => quitarOpcion(index)} aria-label={`Quitar opción ${index+1}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 disabled:opacity-25"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" disabled={respuestas.length >= 6} onClick={() => { setRespuestas(actual => [...actual, { texto: '', es_correcta: false }]); setGuardado(false) }} className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-violet-700 disabled:opacity-30"><Plus className="h-4 w-4" /> Agregar opción (máximo 6)</button>
          </div>
          <button type="button" onClick={() => setVistaPrevia(v => !v)} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-600"><Eye className="h-4 w-4" /> {vistaPrevia ? 'Ocultar vista previa' : 'Vista previa para alumnos'}</button>
          {vistaPrevia && <div className="space-y-2 rounded-2xl border border-violet-100 bg-white p-4"><p className="text-sm font-bold text-slate-900">{pregunta || 'Escribí una pregunta'}</p>{respuestas.map((opcion,index) => <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-600"><span className="h-4 w-4 rounded-full border border-slate-300" />{opcion.texto || `Opción ${index+1}`}</div>)}</div>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Guardar pregunta</button>
            {onEliminar && <button type="button" disabled={busy} onClick={onEliminar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700"><Trash2 className="h-4 w-4" /> Eliminar</button>}
          </div>
        </form>
      )}
    </section>
  )
}
