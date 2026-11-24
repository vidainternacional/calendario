'use client'

import { useState, useSyncExternalStore } from 'react'
const EVENT = 'vida:congregacion-review'
const OPTIONS = [ ['santa-ana', 'VIDA Santa Ana'], ['chalchuapa', 'VIDA Chalchuapa'], ['ambas', 'Ambas congregaciones'], ['ninguna', 'Todavía no pertenezco a una sede'] ] as const
const normalize = (v: string | null) => OPTIONS.some(o => o[0] === v) ? v || '' : ''
function subscribe(fn: () => void) {
  window.addEventListener('storage', fn); window.addEventListener(EVENT, fn)
  return () => { window.removeEventListener('storage', fn); window.removeEventListener(EVENT, fn) }
}
export default function MiCongregacionReview({ userId }: { userId: string }) {
  const key = `vida:congregacion:review:v1:${userId}`
  const saved = useSyncExternalStore(subscribe, () => { try { return normalize(localStorage.getItem(key)) } catch { return '' } }, () => '')
  const [draft, setDraft] = useState<{ owner: string; value: string } | null>(null)
  const [message, setMessage] = useState('')
  const selected = draft?.owner === userId ? draft.value : saved
  return <section aria-label="Mi congregación" className="mt-5 border-t border-slate-200 pt-5 text-slate-800">
    <h4 className="text-base font-bold">Mi congregación</h4>
    <p className="mt-2 text-sm leading-6">Elige dónde te congregas. Es independiente de dónde vives y de las sedes que quieres ver en Inicio.</p>
    <fieldset className="mt-3"><legend className="sr-only">Congregación a la que pertenezco</legend>
      {OPTIONS.map(([id, label]) => <label key={id} className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-sm"><input type="radio" name={`congregacion-${userId}`} value={id} checked={selected === id} onChange={() => { setDraft({ owner: userId, value: id }); setMessage('') }} className="h-5 w-5 accent-red-700" />{label}</label>)}
    </fieldset>
    <p className="mt-3 text-xs leading-5 text-slate-600">Para servir en un ministerio de otra sede solicitarás ingreso y su liderazgo lo aprobará. Puedes servir en ambas sedes; cambiar esta selección no te retira de tus equipos.</p>


    <button type="button" disabled={!selected} className="mt-4 min-h-11 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40" onClick={() => {
      try { localStorage.setItem(key, selected); window.dispatchEvent(new Event(EVENT)); setMessage('Selección de prueba guardada en este dispositivo.') }
      catch { setMessage('No se pudo guardar en este dispositivo. La selección sigue visible mientras estás aquí.') }
    }}>Guardar selección de prueba</button>
    <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{message}</p>
    <p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-900">En revisión: esta selección todavía no se guarda en tu cuenta ni cambia permisos, ministerios o inscripciones. El botón Guardar ficha conserva su funcionamiento habitual.</p>
  </section>
}
