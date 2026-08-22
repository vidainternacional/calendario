'use client'

import { useMemo, useState } from 'react'
import { HEBREW_USEFUL_PHRASES, type HebrewUsefulPhraseGroup } from '@/lib/hebreo/useful-phrases'

type Filter = 'all' | HebrewUsefulPhraseGroup

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'greetings', label: 'Saludos' },
  { id: 'courtesy', label: 'Cortesía' },
]

export default function HebrewUsefulPhrases() {
  const [filter, setFilter] = useState<Filter>('all')
  const phrases = useMemo(() => filter === 'all' ? HEBREW_USEFUL_PHRASES : HEBREW_USEFUL_PHRASES.filter(item => item.group === filter), [filter])

  return (
    <section aria-labelledby="hebrew-useful-phrases-title" className="text-center">
      <div>
        <p lang="he" dir="rtl" className="text-[1.15rem] font-black text-indigo-700">בִּטּוּיִים שִׁמּוּשִׁיִּים</p>
        <h3 id="hebrew-useful-phrases-title" className="mt-0.5 text-[1.35rem] font-black text-slate-950">Frases para memorizar</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Hebreo moderno · uso cotidiano. Se mantiene separado del vocabulario bíblico para no mezclar registros.</p>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-1 rounded-[16px] bg-slate-100 p-1">
        {FILTERS.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-10 rounded-[13px] px-2 text-[11px] font-black ${filter === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
        {phrases.map((phrase, index) => (
          <article key={phrase.id} className={`grid min-h-[96px] grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] items-center gap-3 px-3 py-3 ${index ? 'border-t border-slate-100' : ''}`}>
            <div className="min-w-0 text-center">
              <p lang="he" dir="rtl" className="break-words text-[2.25rem] font-black leading-tight text-slate-950">{phrase.hebrew}</p>
              <p className="mt-1 text-[13px] font-black text-indigo-700">{phrase.pronunciation}</p>
            </div>
            <p className="min-w-0 break-words text-[14px] font-black leading-snug text-slate-800">{phrase.spanish}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
