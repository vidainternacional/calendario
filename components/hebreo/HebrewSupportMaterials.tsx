'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronDown, ExternalLink, PlayCircle } from 'lucide-react'
import { HEBREW_SUPPORT_COURSE } from '@/lib/hebreo/material-apoyo'

const GROUPS = [
  { title: 'Fundamentos', range: [1, 5] },
  { title: 'Vocales y lectura', range: [6, 8] },
  { title: 'Lectura bíblica y reglas', range: [9, 11] },
] as const

function MaterialGroups() {
  return (
    <section aria-label="Materiales del curso" className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
      {GROUPS.map(group => (
        <details key={group.title}>
          <summary className="flex min-h-[62px] cursor-pointer list-none items-center justify-between gap-3 px-2 text-left">
            <span><span className="block text-[13px] font-black text-slate-950">{group.title}</span><span className="block text-[10px] text-slate-400">Clases {group.range[0]}–{group.range[1]}</span></span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </summary>
          <div className="space-y-3 border-t border-slate-100 bg-[#fdfdfe] px-2 py-4">
            {HEBREW_SUPPORT_COURSE.filter(item => item.orden >= group.range[0] && item.orden <= group.range[1]).map(item => (
              <article key={item.orden} className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-slate-200/80">
                <div className="flex gap-3 p-3 text-left">
                  <div className="relative h-[68px] w-[106px] shrink-0 overflow-hidden rounded-[11px] bg-slate-100">
                    <img src={item.miniatura} alt={`Miniatura de la clase ${item.orden}`} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute inset-0 grid place-items-center bg-slate-950/10"><PlayCircle className="h-7 w-7 text-white" /></span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.08em] text-amber-700">Clase {item.orden}</p>
                    <h2 className="mt-1 text-[13px] font-black leading-snug text-slate-900">{item.titulo}</h2>
                    <p className="mt-1 text-[11px] text-slate-500">{item.tema}</p>
                  </div>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 text-[12px] font-black text-indigo-700">Abrir video <ExternalLink className="h-3.5 w-3.5" /></a>
              </article>
            ))}
          </div>
        </details>
      ))}
    </section>
  )
}

export default function HebrewSupportMaterials({ embedded = false }: { embedded?: boolean }) {
  if (embedded) return <MaterialGroups />

  return (
    <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-3 sm:px-6">
        <header>
          <Link href="/estudios/hebreo" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Hebreo Bíblico</Link>
          <div className="mt-1 text-center">
            <p lang="he" dir="rtl" className="text-[1.8rem] font-black leading-none text-indigo-700">חֹמֶר לִמּוּד</p>
            <h1 className="mt-1.5 text-[1.5rem] font-black">Materiales y curso</h1>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">Recursos complementarios organizados por la progresión del curso. Los enlaces externos permanecen separados del contenido propio de VIDA.</p>
          </div>
        </header>

        <div className="mt-5"><MaterialGroups /></div>
      </div>
    </main>
  )
}
