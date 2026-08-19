'use client'

import { useState } from 'react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

function LetterTile({ letter, selected, onSelect }: { letter: AlefBetLetter; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={selected}
      aria-label={`${letter.nombre}, letra ${letter.orden}`}
      onClick={onSelect}
      className={`relative min-h-[104px] rounded-[22px] border px-2 py-3 text-center transition-all duration-200 active:scale-[0.96] ${
        selected
          ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_28px_rgba(79,70,229,0.24)]'
          : 'border-slate-200 bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-indigo-200'
      }`}
    >
      <span className={`absolute left-2.5 top-2 text-[10px] font-bold tabular-nums ${selected ? 'text-white/65' : 'text-slate-400'}`}>
        {letter.orden}
      </span>
      <span lang="he" dir="rtl" className="block text-[2.55rem] font-medium leading-none" aria-hidden="true">
        {letter.letra}
      </span>
      <span className={`mt-2 block truncate text-[11px] font-bold ${selected ? 'text-white' : 'text-slate-700'}`}>
        {letter.nombre}
      </span>
      {letter.formaFinal && (
        <span className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-black ${selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
          final {letter.formaFinal}
        </span>
      )}
    </button>
  )
}

export default function AlefBetExplorer() {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const selected = ALEF_BET.find((letter) => letter.orden === selectedOrder) ?? ALEF_BET[0]

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-slate-500">
          Empieza arriba a la derecha y sigue hacia la izquierda.
        </p>
        <span className="shrink-0 rounded-full bg-slate-200/80 px-2.5 py-1 text-[10px] font-bold text-slate-600">
          22 letras · 5 finales
        </span>
      </div>

      <div dir="rtl" className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 sm:gap-3" aria-label="Alef-bet hebreo">
        {ALEF_BET.map((letter) => (
          <LetterTile
            key={letter.orden}
            letter={letter}
            selected={selected.orden === letter.orden}
            onSelect={() => setSelectedOrder(letter.orden)}
          />
        ))}
      </div>

      <section
        aria-live="polite"
        aria-label={`Detalle de ${selected.nombre}`}
        className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      >
        <div className="flex items-stretch">
          <div className="flex w-[38%] min-w-[126px] flex-col items-center justify-center bg-slate-950 px-4 py-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Letra {selected.orden}</span>
            <span lang="he" dir="rtl" className="mt-2 text-[5rem] font-medium leading-none">
              {selected.letra}
            </span>
            {selected.formaFinal && (
              <span className="mt-2 text-xs font-semibold text-white/65">
                final <span lang="he" dir="rtl" className="text-xl text-white">{selected.formaFinal}</span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 px-4 py-5 sm:px-5">
            <p className="text-lg font-bold text-slate-950">{selected.nombre}</p>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2.5">
                <dt className="text-xs font-semibold text-slate-500">Transliteración</dt>
                <dd className="text-base font-bold text-indigo-600">{selected.transliteracion}</dd>
              </div>
              {selected.formaFinal && (
                <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Forma final</dt>
                  <dd lang="he" dir="rtl" className="text-2xl font-semibold text-slate-900">{selected.formaFinal}</dd>
                </div>
              )}
              {selected.grupo === 'begadkefat' && (
                <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <dt className="text-xs font-semibold text-slate-500">Familia</dt>
                  <dd className="text-xs font-bold text-slate-700">Begadkefat</dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {selected.nota ?? 'Primero reconoce su forma y posición; las vocales y reglas de sonido se añaden progresivamente.'}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        La transliteración es una ayuda de lectura. La pronunciación pedagógica y el niqqud se enseñarán en pasos separados para no mezclar reglas desde el inicio.
      </p>
    </div>
  )
}
