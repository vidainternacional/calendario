'use client'

import { ChevronDown, Languages } from 'lucide-react'
import type { TraduccionEspanolaEstudio } from '@/app/actions/traduccion-espanola-estudio'

type Modo = 'claro' | 'oscuro' | 'sepia'

function palette(modo: Modo) {
  return {
    claro: {
      shell: 'border-emerald-200 bg-emerald-50/70 text-slate-900',
      muted: 'text-slate-500',
      divider: 'border-emerald-100',
      verse: 'text-slate-800',
    },
    oscuro: {
      shell: 'border-emerald-800/60 bg-emerald-950/20 text-slate-100',
      muted: 'text-slate-400',
      divider: 'border-emerald-800/40',
      verse: 'text-slate-100',
    },
    sepia: {
      shell: 'border-[#b8a06d] bg-[#f5e8ca] text-[#493c2d]',
      muted: 'text-[#7d6b54]',
      divider: 'border-[#d8c298]',
      verse: 'text-[#493c2d]',
    },
  }[modo]
}

export default function SpanishPassagePanel({
  translation,
  modo = 'claro',
}: {
  translation: TraduccionEspanolaEstudio
  modo?: Modo
}) {
  const colors = palette(modo)
  const esVersiculo = translation.verses.length === 1 && /:\d+\b/.test(translation.canonicalReference)

  return (
    <details open={esVersiculo} className={`group rounded-2xl border ${colors.shell}`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
          <Languages className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Traducción en español</span>
          <span className="mt-0.5 block text-sm font-bold">{translation.sourceName} · {translation.canonicalReference}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-open:rotate-180 ${colors.muted}`} aria-hidden="true" />
      </summary>

      <div className={`border-t px-4 py-4 ${colors.divider}`}>
        <div className="space-y-3">
          {translation.verses.map(item => (
            <p key={`${translation.canonicalReference}-${item.verse}`} className={`text-sm leading-7 ${colors.verse}`}>
              <sup className="mr-1.5 text-[10px] font-black text-[#C0392B]">{item.verse}</sup>
              {item.text}
            </p>
          ))}
        </div>
        <p className={`mt-4 text-[10px] leading-4 ${colors.muted}`}>
          Traducción bíblica aprobada para lectura en español. Se mantiene separada de la secuencia literal palabra por palabra del texto original.
        </p>
      </div>
    </details>
  )
}
