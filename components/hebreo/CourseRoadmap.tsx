'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const COURSE_STEPS = [
  { number: 1, title: 'Alef-Bet y Sofit', detail: '22 consonantes, dirección RTL y cinco formas finales.' },
  { number: 2, title: 'Dagesh y sonidos', detail: 'Bet/Vet, Kaf/Jaf, Pe/Fe y Shin/Sin dentro de palabras.' },
  { number: 3, title: 'Vocales A · E · I', detail: 'Consonante + signo vocálico → sílaba.' },
  { number: 4, title: 'Vocales O · U + Sheva', detail: 'Holam, Qubuts, Shuruq y Sheva Na/Naj.' },
  { number: 5, title: 'Lectura · Shemá', detail: 'Deuteronomio 6:4–5 con niqqud y después sin ayudas.' },
  { number: 6, title: 'Prefijos inseparables', detail: 'B · M · K · L, Vav conjuntiva y He artículo.' },
  { number: 7, title: 'Raíces y repaso', detail: 'Reconocer la estructura cuando la fuente la respalde y consolidar lo aprendido.' },
] as const

export default function CourseRoadmap() {
  const [open, setOpen] = useState(false)
  return (
    <section aria-labelledby="hebrew-course-roadmap-title" className="mx-auto mt-4 w-full max-w-5xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 text-left">
          <span className="min-w-0"><span id="hebrew-course-roadmap-title" className="block text-[13px] font-black text-slate-900">Ruta del curso</span><span className="mt-0.5 block text-[10px] font-semibold text-slate-500">7 pasos · práctica de 5–10 minutos al día</span></span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <ol className="divide-y divide-slate-100 border-t border-slate-100 px-4">{COURSE_STEPS.map(step => <li key={step.number} className="grid grid-cols-[30px_minmax(0,1fr)] items-center gap-3 py-3 text-left"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-[11px] font-black text-indigo-700">{step.number}</span><span><span className="block text-[12px] font-black text-slate-900">{step.title}</span><span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{step.detail}</span></span></li>)}</ol>}
      </div>
    </section>
  )
}
