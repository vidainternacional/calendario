'use client'

import { useState } from 'react'
import ReadingWordsExplorer from '@/components/hebreo/ReadingWordsExplorer'
import HebrewUsefulPhrases from '@/components/hebreo/HebrewUsefulPhrases'

type Mode = 'words' | 'phrases'

export default function HebrewWordsStudy() {
  const [mode, setMode] = useState<Mode>('words')

  return (
    <section aria-labelledby="hebrew-words-study-title">
      <div className="text-center">
        <h2 id="hebrew-words-study-title" className="text-[1.35rem] font-black text-slate-950">Palabras y frases</h2>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Memoriza primero; profundiza solo cuando abras una entrada.</p>
      </div>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-1 rounded-[17px] bg-slate-100 p-1">
        <button type="button" aria-pressed={mode === 'words'} onClick={() => setMode('words')} className={`min-h-11 rounded-[14px] text-[12px] font-black ${mode === 'words' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Palabras bíblicas</button>
        <button type="button" aria-pressed={mode === 'phrases'} onClick={() => setMode('phrases')} className={`min-h-11 rounded-[14px] text-[12px] font-black ${mode === 'phrases' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Frases útiles</button>
      </div>
      <div className="mt-4">{mode === 'words' ? <ReadingWordsExplorer /> : <HebrewUsefulPhrases />}</div>
    </section>
  )
}
