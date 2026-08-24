'use client'

import { useState } from 'react'
import ReadingWordsExplorer from '@/components/hebreo/ReadingWordsExplorer'
import HebrewUsefulPhrases from '@/components/hebreo/HebrewUsefulPhrases'

type Mode = 'words' | 'phrases'

export default function HebrewWordsStudy() {
  const [mode, setMode] = useState<Mode>('words')

  return (
    <section aria-label="Palabras y frases para memorizar">
      <div className="mx-auto flex max-w-sm justify-center gap-2">
        <button type="button" aria-pressed={mode === 'words'} onClick={() => setMode('words')} className={`min-h-10 rounded-full border px-4 text-[12px] font-black ${mode === 'words' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Palabras bíblicas</button>
        <button type="button" aria-pressed={mode === 'phrases'} onClick={() => setMode('phrases')} className={`min-h-10 rounded-full border px-4 text-[12px] font-black ${mode === 'phrases' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Frases útiles</button>
      </div>
      <div className="mt-4">{mode === 'words' ? <ReadingWordsExplorer /> : <HebrewUsefulPhrases />}</div>
    </section>
  )
}
