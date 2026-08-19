'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, GalleryHorizontal, Grid2X2 } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'

function chunkLetters(size: number) {
  const rows: AlefBetLetter[][] = []
  for (let index = 0; index < ALEF_BET.length; index += size) {
    rows.push(ALEF_BET.slice(index, index + size) as AlefBetLetter[])
  }
  return rows
}

function LetterTile({ letter, selected, onSelect, carousel = false }: { letter: AlefBetLetter; selected: boolean; onSelect: () => void; carousel?: boolean }) {
  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={selected}
      aria-label={`${letter.nombre}, letra ${letter.orden}, valor ${letter.valor}`}
      onClick={onSelect}
      className={`relative shrink-0 rounded-[22px] border px-2 py-3 text-center transition-all duration-200 active:scale-[0.96] ${carousel ? 'w-[92px] snap-center' : 'min-h-[104px] w-full'} ${
        selected
          ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_28px_rgba(79,70,229,0.24)]'
          : 'border-slate-200 bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-indigo-200'
      }`}
    >
      <span className={`absolute left-2.5 top-2 text-[10px] font-bold tabular-nums ${selected ? 'text-white/65' : 'text-slate-400'}`}>{letter.orden}</span>
      <span className={`absolute right-2.5 top-2 text-[9px] font-black tabular-nums ${selected ? 'text-white/60' : 'text-slate-400'}`}>{letter.valor}</span>
      <span lang="he" dir="rtl" className="block text-[2.55rem] font-medium leading-none" aria-hidden="true">{letter.letra}</span>
      <span className={`mt-2 block truncate text-[11px] font-bold ${selected ? 'text-white' : 'text-slate-700'}`}>{letter.nombre}</span>
      {letter.formaFinal && (
        <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black ${selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>final {letter.formaFinal}</span>
      )}
    </button>
  )
}

function AccordionSection({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-slate-100">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900 marker:content-none sm:px-5">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4 sm:px-5">{children}</div>
    </details>
  )
}

function FactRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="max-w-[62%] text-right text-sm font-bold text-slate-900">{value}</dd>
    </div>
  )
}

function LetterDetail({ letter }: { letter: AlefBetLetter }) {
  const certaintyClass = letter.certezaHistorica === 'bien atestiguado'
    ? 'bg-emerald-100 text-emerald-700'
    : letter.certezaHistorica === 'probable'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-200 text-slate-600'

  return (
    <section aria-live="polite" aria-label={`Ficha completa de ${letter.nombre}`} className="my-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
      <div className="flex items-stretch">
        <div className="flex w-[35%] min-w-[118px] flex-col items-center justify-center bg-slate-950 px-3 py-5 text-white">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Letra {letter.orden}</span>
          <span lang="he" dir="rtl" className="mt-2 text-[4.75rem] font-medium leading-none">{letter.letra}</span>
          {letter.formaFinal && (
            <span className="mt-2 text-[10px] font-semibold text-white/60">final <span lang="he" dir="rtl" className="ml-1 text-xl text-white">{letter.formaFinal}</span></span>
          )}
        </div>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-950">{letter.nombre}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{letter.unicode}</p>
            </div>
            <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-700">valor {letter.valor}</span>
          </div>
          <dl className="mt-2">
            <FactRow label="Transliteración" value={<span className="text-indigo-600">{letter.transliteracion}</span>} />
            <FactRow label="Sonido" value={letter.sonidoPedagogico} />
          </dl>
        </div>
      </div>

      <AccordionSection title="Pronunciación y lectura" open>
        <p className="text-sm leading-relaxed text-slate-600">{letter.pronunciacion}</p>
        {letter.grupo === 'begadkefat' && (
          <p className="mt-2 rounded-[14px] bg-indigo-50 px-3 py-2.5 text-xs leading-relaxed text-indigo-800">
            Pertenece a <strong>Begadkefat</strong>. El dagesh y la variante fricativa se estudian como regla, no como una letra diferente.
          </p>
        )}
        {letter.nota && <p className="mt-2 text-xs leading-relaxed text-slate-500">{letter.nota}</p>}
      </AccordionSection>

      <AccordionSection title="Escritura y variantes">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[16px] bg-slate-50 px-2 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Actual</p>
            <p lang="he" dir="rtl" className="mt-1 text-4xl font-medium text-slate-950">{letter.letra}</p>
            <p className="mt-1 text-[9px] font-semibold text-slate-400">{letter.unicode}</p>
          </div>
          <div className="rounded-[16px] bg-slate-50 px-2 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Final</p>
            <p lang="he" dir="rtl" className={`mt-1 text-4xl font-medium ${letter.formaFinal ? 'text-slate-950' : 'text-slate-300'}`}>{letter.formaFinal ?? '—'}</p>
            <p className="mt-1 text-[9px] font-semibold text-slate-400">{letter.unicodeFinal ?? 'no aplica'}</p>
          </div>
          <div className="rounded-[16px] bg-slate-50 px-2 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Fenicio</p>
            <p dir="rtl" className="mt-1 text-4xl font-medium text-slate-950">{letter.fenicio}</p>
            <p className="mt-1 text-[9px] font-semibold text-slate-400">{letter.unicodeFenicio}</p>
          </div>
        </div>
        {letter.variantes && letter.variantes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {letter.variantes.map(variant => <span key={variant} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{variant}</span>)}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          El signo fenicio se muestra como referencia histórica comparativa. La escritura hebrea cuadrada se desarrolló a través de la tradición aramea, por lo que no debe leerse como una transformación gráfica directa de un solo paso.
        </p>
      </AccordionSection>

      <AccordionSection title="Historia del nombre y del signo">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Certeza de la identificación</p>
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${certaintyClass}`}>{letter.certezaHistorica}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{letter.origenNombre}</p>
        <div className="mt-3 rounded-[16px] bg-amber-50 px-3.5 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">Idea histórica asociada</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">{letter.ideaHistorica}</p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{letter.evolucion}</p>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Esta asociación describe el origen del nombre o del signo. No significa que la letra tenga por sí sola ese significado dentro de una palabra bíblica.</p>
      </AccordionSection>

      <AccordionSection title="Ejemplo bíblico">
        <div className="rounded-[18px] bg-slate-950 px-4 py-4 text-white">
          <p lang="he" dir="rtl" className="text-right text-3xl font-medium">{letter.ejemplo.palabra}</p>
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Transliteración</p>
              <p className="mt-0.5 text-sm font-bold">{letter.ejemplo.transliteracion}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Sentido del ejemplo</p>
              <p className="mt-0.5 text-sm font-bold">{letter.ejemplo.significado}</p>
            </div>
          </div>
        </div>
      </AccordionSection>
    </section>
  )
}

function GridRows({ rows, selected, onSelect, columnsClass }: { rows: AlefBetLetter[][]; selected: AlefBetLetter; onSelect: (order: number) => void; columnsClass: string }) {
  return (
    <div className="space-y-2.5">
      {rows.map(row => {
        const selectedInRow = row.some(letter => letter.orden === selected.orden)
        return (
          <div key={row[0]?.orden}>
            <div dir="rtl" className={`grid gap-2.5 ${columnsClass}`}>
              {row.map(letter => (
                <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => onSelect(letter.orden)} />
              ))}
            </div>
            {selectedInRow && <LetterDetail key={selected.orden} letter={selected} />}
          </div>
        )
      })}
    </div>
  )
}

export default function AlefBetExplorer() {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const selected = ALEF_BET.find(letter => letter.orden === selectedOrder) ?? ALEF_BET[0]
  const mobileRows = useMemo(() => chunkLetters(4), [])
  const desktopRows = useMemo(() => chunkLetters(6), [])

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="max-w-[15rem] text-xs leading-relaxed text-slate-500">Empieza arriba a la derecha y sigue hacia la izquierda.</p>
        <span className="shrink-0 rounded-full bg-slate-200/80 px-2.5 py-1 text-[10px] font-bold text-slate-600">22 letras · 5 finales</span>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-slate-200/80 p-1" aria-label="Vista del Alef-bet">
        <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Cuadrícula
        </button>
        <button type="button" aria-pressed={viewMode === 'carousel'} onClick={() => setViewMode('carousel')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'carousel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <GalleryHorizontal className="h-4 w-4" aria-hidden="true" /> Carrusel
        </button>
      </div>

      {viewMode === 'grid' ? (
        <>
          <div className="sm:hidden" aria-label="Alef-bet hebreo en cuadrícula">
            <GridRows rows={mobileRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-4" />
          </div>
          <div className="hidden sm:block" aria-label="Alef-bet hebreo en cuadrícula">
            <GridRows rows={desktopRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-6" />
          </div>
        </>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-slate-500">Desliza hacia la izquierda para avanzar en el orden hebreo.</p>
            <span className="shrink-0 text-[10px] font-bold text-indigo-600">{selected.orden} / 22</span>
          </div>
          <div dir="rtl" className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-1 sm:px-1" aria-label="Alef-bet hebreo en carrusel">
            {ALEF_BET.map(letter => (
              <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => setSelectedOrder(letter.orden)} carousel />
            ))}
          </div>
          <LetterDetail key={selected.orden} letter={selected} />
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">La transliteración y la pronunciación son ayudas pedagógicas. Las reconstrucciones históricas y los orígenes pictográficos se muestran con cautela y no sustituyen el análisis lingüístico de las palabras.</p>
    </div>
  )
}
