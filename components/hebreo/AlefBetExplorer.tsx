'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, GalleryHorizontal, Grid2X2, RotateCcw } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'
type LearningGroup = 'all' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const LEARNING_GROUPS: readonly {
  id: LearningGroup
  label: string
  description: string
}[] = [
  { id: 'all', label: 'Todas', description: 'Las 22 letras del Alef-bet en su orden de lectura.' },
  { id: 'begadkefat', label: 'Dagesh', description: 'La familia בגדכפת: aprende la forma con punto y su contraste de lectura.' },
  { id: 'sofit', label: 'Sofit', description: 'Las cinco formas que cambian gráficamente al final de palabra.' },
  { id: 'gutturals', label: 'Guturales', description: 'א ה ח ע comparten reglas fonológicas que aprenderemos como grupo.' },
  { id: 'matres', label: 'Matres', description: 'א ה ו י pueden ayudar a representar vocales según el contexto.' },
  { id: 'shin-sin', label: 'Shin / Sin', description: 'Una misma letra base, ש, con dos lecturas distinguidas por el punto.' },
]

function matchesGroup(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'all') return true
  if (group === 'begadkefat') return letter.grupo === 'begadkefat'
  if (group === 'sofit') return Boolean(letter.formaFinal)
  if (group === 'gutturals') return GUTTURAL_ORDERS.has(letter.orden)
  if (group === 'matres') return MATRES_ORDERS.has(letter.orden)
  return letter.orden === 21
}

function chunkLetters(letters: readonly AlefBetLetter[], size: number) {
  const rows: AlefBetLetter[][] = []
  for (let index = 0; index < letters.length; index += size) {
    rows.push(letters.slice(index, index + size) as AlefBetLetter[])
  }
  return rows
}

function shortSound(letter: AlefBetLetter) {
  return letter.sonidoPedagogico.split(/[.;]/)[0]?.trim() || letter.sonidoPedagogico
}

function dageshGlyph(letter: AlefBetLetter) {
  return `${letter.letra}ּ`
}

function learningLabels(letter: AlefBetLetter) {
  const labels: string[] = []
  if (letter.grupo === 'begadkefat') labels.push('Dagesh')
  if (letter.formaFinal) labels.push('Sofit')
  if (GUTTURAL_ORDERS.has(letter.orden)) labels.push('Gutural')
  if (MATRES_ORDERS.has(letter.orden)) labels.push('Mater')
  if (letter.orden === 21) labels.push('Shin / Sin')
  return labels
}

function tileGlyph(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'sofit' && letter.formaFinal) return letter.formaFinal
  if (group === 'begadkefat') return dageshGlyph(letter)
  if (group === 'shin-sin') return 'שׁ'
  return letter.letra
}

function tileLabel(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'sofit') return `${letter.nombre} sofit`
  if (group === 'begadkefat') return `${letter.nombre} + dagesh`
  return letter.nombre
}

function LetterTile({
  letter,
  selected,
  onSelect,
  group,
  carousel = false,
}: {
  letter: AlefBetLetter
  selected: boolean
  onSelect: () => void
  group: LearningGroup
  carousel?: boolean
}) {
  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={selected}
      aria-label={`${tileLabel(letter, group)}, letra ${letter.orden}`}
      onClick={onSelect}
      className={`relative shrink-0 rounded-[22px] border px-2 py-3 text-center transition-all duration-200 active:scale-[0.97] ${
        carousel ? 'w-[92px] snap-center' : 'min-h-[100px] w-full'
      } ${
        selected
          ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_28px_rgba(79,70,229,0.22)]'
          : 'border-slate-200 bg-white text-slate-950 shadow-[0_2px_10px_rgba(15,23,42,0.035)] hover:border-indigo-200'
      }`}
    >
      <span className={`absolute left-2.5 top-2 text-[10px] font-bold tabular-nums ${selected ? 'text-white/60' : 'text-slate-400'}`}>
        {letter.orden}
      </span>
      <span lang="he" dir="rtl" className="block text-[2.6rem] font-medium leading-none" aria-hidden="true">
        {tileGlyph(letter, group)}
      </span>
      <span className={`mt-2 block truncate text-[10px] font-bold ${selected ? 'text-white' : 'text-slate-700'}`}>
        {tileLabel(letter, group)}
      </span>
      {group === 'sofit' && letter.formaFinal && (
        <span className={`mt-1 block text-[9px] font-semibold ${selected ? 'text-white/65' : 'text-slate-400'}`}>
          base {letter.letra}
        </span>
      )}
    </button>
  )
}

function StudyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <dt className="text-[11px] font-semibold text-slate-500">{label}</dt>
      <dd className="max-w-[64%] text-right text-sm font-bold text-slate-950">{value}</dd>
    </div>
  )
}

function LearningTags({ letter }: { letter: AlefBetLetter }) {
  const labels = learningLabels(letter)
  if (labels.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {labels.map(label => (
        <span key={label} className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">
          {label}
        </span>
      ))}
    </div>
  )
}

function RuleSummary({ letter }: { letter: AlefBetLetter }) {
  return (
    <div className="space-y-3">
      {letter.grupo === 'begadkefat' && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Dagesh</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Aprende primero a reconocer el contraste con y sin punto.</p>
          </div>
          <div className="shrink-0 text-right">
            <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">{dageshGlyph(letter)}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">{letter.letra}</span>
          </div>
        </div>
      )}
      {letter.formaFinal && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Sofit</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Al final de palabra usa su forma final.</p>
          </div>
          <div className="shrink-0 text-right">
            <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">{letter.letra}</span>
            <span className="mx-2 text-slate-300">→</span>
            <span lang="he" dir="rtl" className="text-3xl font-medium text-indigo-600">{letter.formaFinal}</span>
          </div>
        </div>
      )}
      {letter.orden === 21 && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Punto distintivo</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Derecha = Shin · izquierda = Sin.</p>
          </div>
          <div className="shrink-0 text-right">
            <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">שׁ</span>
            <span className="mx-2 text-slate-300">/</span>
            <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">שׂ</span>
          </div>
        </div>
      )}
    </div>
  )
}

function CompactLetterCard({ letter }: { letter: AlefBetLetter }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <section className="my-3 [perspective:1200px]" aria-live="polite" aria-label={`Ficha de aprendizaje de ${letter.nombre}`}>
      <div
        className={`relative min-h-[340px] transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.07)] [backface-visibility:hidden] ${
            flipped ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex h-full flex-col px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Letra {letter.orden} de 22</p>
                <p className="mt-1 text-xl font-black text-slate-950">{letter.nombre}</p>
              </div>
              <LearningTags letter={letter} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-5 border-b border-slate-100 pb-4">
              <span lang="he" dir="rtl" className="text-[5.6rem] font-medium leading-none text-slate-950">{letter.letra}</span>
              <div className="min-w-0 pb-1 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Cómo suena</p>
                <p className="mt-1 text-sm font-bold leading-snug text-slate-800">{shortSound(letter)}</p>
              </div>
            </div>

            <div className="flex-1 pt-4">
              <RuleSummary letter={letter} />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Ejemplo</p>
                  <p lang="he" dir="rtl" className="mt-1 text-2xl font-medium text-slate-950">{letter.ejemplo.palabra}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{letter.ejemplo.significado}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                  aria-label={`Voltear ficha de ${letter.nombre}`}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Más datos
                </button>
              </div>
            </div>
          </div>
        </article>

        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.07)] [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            flipped ? '' : 'pointer-events-none'
          }`}
        >
          <div className="flex h-full flex-col px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">Datos de referencia</p>
                <p className="mt-1 text-xl font-black text-slate-950">{letter.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setFlipped(false)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                aria-label={`Volver al aprendizaje de ${letter.nombre}`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Volver
              </button>
            </div>

            <dl className="mt-3">
              <StudyRow label="Transliteración" value={<span className="text-indigo-600">{letter.transliteracion}</span>} />
              <StudyRow label="Gematría" value={letter.valor} />
              <StudyRow label="Unicode" value={letter.unicode} />
              <StudyRow label="Signo histórico" value={<span dir="rtl" className="text-2xl font-medium">{letter.fenicio}</span>} />
              <StudyRow label="Certeza histórica" value={letter.certezaHistorica} />
            </dl>

            <div className="mt-auto border-t border-slate-100 pt-3">
              <p className="text-xs leading-relaxed text-slate-600">{letter.origenNombre}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">Historia, gematría y transliteración son datos de referencia. No son significados secretos de la letra dentro de una palabra bíblica.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function AdvancedStudyDetails({ letter }: { letter: AlefBetLetter }) {
  const certaintyClass = letter.certezaHistorica === 'bien atestiguado'
    ? 'text-emerald-700'
    : letter.certezaHistorica === 'probable'
      ? 'text-amber-700'
      : 'text-slate-600'

  return (
    <details className="group border-t border-slate-100">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-bold text-slate-900 marker:content-none">
        Datos técnicos e historia
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-1">
        <dl>
          <StudyRow label="Transliteración" value={<span className="text-indigo-600">{letter.transliteracion}</span>} />
          <StudyRow label="Gematría" value={letter.valor} />
          <StudyRow label="Unicode" value={letter.unicode} />
          <StudyRow label="Fenicio comparativo" value={<span dir="rtl" className="text-2xl font-medium">{letter.fenicio}</span>} />
          <StudyRow label="Certeza histórica" value={<span className={certaintyClass}>{letter.certezaHistorica}</span>} />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">{letter.origenNombre}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{letter.evolucion}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">El signo histórico es una referencia comparativa. Estas asociaciones describen historia del nombre o del signo y no el significado léxico de una palabra bíblica.</p>
      </div>
    </details>
  )
}

function CarouselLetterDetail({ letter }: { letter: AlefBetLetter }) {
  return (
    <section aria-live="polite" aria-label={`Estudio completo de ${letter.nombre}`} className="my-3 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_34px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Letra {letter.orden} de 22</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{letter.nombre}</p>
          <div className="mt-2"><LearningTags letter={letter} /></div>
        </div>
        <span lang="he" dir="rtl" className="shrink-0 text-[6.2rem] font-medium leading-none text-slate-950">{letter.letra}</span>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">Aprender a leerla</p>
        <p className="mt-2 text-base font-bold leading-snug text-slate-900">{letter.sonidoPedagogico}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{letter.pronunciacion}</p>
        {letter.nota && <p className="mt-2 text-xs leading-relaxed text-slate-500">{letter.nota}</p>}
      </div>

      {(letter.grupo === 'begadkefat' || letter.formaFinal || letter.orden === 21) && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Formas y reglas</p>
          <RuleSummary letter={letter} />
        </div>
      )}

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Ejemplo bíblico</p>
          <p lang="he" dir="rtl" className="mt-1 text-4xl font-medium text-slate-950">{letter.ejemplo.palabra}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-slate-900">{letter.ejemplo.significado}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{letter.ejemplo.transliteracion}</p>
        </div>
      </div>

      <AdvancedStudyDetails letter={letter} />
    </section>
  )
}

function GridRows({
  rows,
  selected,
  onSelect,
  columnsClass,
  group,
}: {
  rows: AlefBetLetter[][]
  selected: AlefBetLetter
  onSelect: (order: number) => void
  columnsClass: string
  group: LearningGroup
}) {
  return (
    <div className="space-y-2.5">
      {rows.map(row => {
        const selectedInRow = row.some(letter => letter.orden === selected.orden)
        return (
          <div key={row[0]?.orden}>
            <div dir="rtl" className={`grid gap-2.5 ${columnsClass}`}>
              {row.map(letter => (
                <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => onSelect(letter.orden)} group={group} />
              ))}
            </div>
            {selectedInRow && <CompactLetterCard key={`${selected.orden}-${group}`} letter={selected} />}
          </div>
        )
      })}
    </div>
  )
}

export default function AlefBetExplorer() {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [learningGroup, setLearningGroup] = useState<LearningGroup>('all')

  const filteredLetters = useMemo(() => ALEF_BET.filter(letter => matchesGroup(letter, learningGroup)), [learningGroup])
  const selected = filteredLetters.find(letter => letter.orden === selectedOrder) ?? filteredLetters[0] ?? ALEF_BET[0]
  const mobileRows = useMemo(() => chunkLetters(filteredLetters, 4), [filteredLetters])
  const desktopRows = useMemo(() => chunkLetters(filteredLetters, 6), [filteredLetters])
  const activeGroup = LEARNING_GROUPS.find(group => group.id === learningGroup) ?? LEARNING_GROUPS[0]
  const selectedIndex = Math.max(0, filteredLetters.findIndex(letter => letter.orden === selected.orden))

  function changeGroup(group: LearningGroup) {
    setLearningGroup(group)
    const first = ALEF_BET.find(letter => matchesGroup(letter, group))
    if (first) setSelectedOrder(first.orden)
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="max-w-[15rem] text-xs leading-relaxed text-slate-500">Aprende primero a reconocer la forma, el nombre y el sonido.</p>
        <span className="shrink-0 text-[10px] font-bold text-slate-400">22 letras · 5 Sofit</span>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-slate-200/80 p-1" aria-label="Vista del Alef-bet">
        <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Fichas
        </button>
        <button type="button" aria-pressed={viewMode === 'carousel'} onClick={() => setViewMode('carousel')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'carousel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <GalleryHorizontal className="h-4 w-4" aria-hidden="true" /> Carrusel
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Aprender por grupo</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {LEARNING_GROUPS.map(group => {
            const active = learningGroup === group.id
            const count = ALEF_BET.filter(letter => matchesGroup(letter, group.id)).length
            return (
              <button key={group.id} type="button" aria-pressed={active} onClick={() => changeGroup(group.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {group.label}
                {group.id !== 'all' && <span className={active ? 'text-white/55' : 'text-slate-400'}> · {count}</span>}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{activeGroup.description}</p>
      </div>

      {viewMode === 'grid' ? (
        <>
          <div className="sm:hidden" aria-label="Alef-bet hebreo en fichas">
            <GridRows rows={mobileRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-4" group={learningGroup} />
          </div>
          <div className="hidden sm:block" aria-label="Alef-bet hebreo en fichas">
            <GridRows rows={desktopRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-6" group={learningGroup} />
          </div>
        </>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-slate-500">Desliza siguiendo el orden hebreo y toca la letra que quieras estudiar.</p>
            <span className="shrink-0 text-[10px] font-bold text-indigo-600">{selectedIndex + 1} / {filteredLetters.length}</span>
          </div>
          <div dir="rtl" className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-1 sm:px-1" aria-label="Alef-bet hebreo en carrusel">
            {filteredLetters.map(letter => (
              <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => setSelectedOrder(letter.orden)} group={learningGroup} carousel />
            ))}
          </div>
          <CarouselLetterDetail key={`${selected.orden}-${learningGroup}`} letter={selected} />
        </div>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-slate-400">Primero aprenderás a leer. La transliteración académica, gematría, Unicode e historia quedan separadas como datos de referencia para no sobrecargar la memorización.</p>
    </div>
  )
}
