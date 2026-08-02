'use client'

import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  BookOpenText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Fingerprint,
  Languages,
  ShieldCheck,
} from 'lucide-react'
import { cargarPalabrasBiblicasVerificadas } from '@/app/actions/lexico-biblico'

type Modo = 'claro' | 'oscuro' | 'sepia'
type Resultado = Awaited<ReturnType<typeof cargarPalabrasBiblicasVerificadas>>

type OcurrenciaDisponible = Extract<Resultado, { status: 'available' }>['occurrences'][number]

const LANGUAGE_LABELS = {
  hebrew: 'Hebreo',
  aramaic: 'Arameo',
  greek: 'Griego',
} as const

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: 'Sustantivo',
  verb: 'Verbo',
  adjective: 'Adjetivo',
  adverb: 'Adverbio',
  pronoun: 'Pronombre',
  preposition: 'Preposición',
  conjunction: 'Conjunción',
  proper_name: 'Nombre propio',
}

const GLOSS_KIND_LABELS = {
  source_translation: 'Traducción publicada por la fuente',
  editorial_translation: 'Traducción editorial al español',
  editorial_summary: 'Resumen editorial',
} as const

function licenseLabel(url: string | null) {
  if (url?.includes('/by/4.0')) return 'CC BY 4.0'
  return 'Licencia verificada'
}

function partOfSpeechLabel(value: string | null) {
  if (!value) return null
  return PART_OF_SPEECH_LABELS[value] ?? value
}

export default function BibleLexicalPanel({
  pasaje,
  modo,
}: {
  pasaje: string
  modo: Modo
}) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)

  useEffect(() => {
    let activo = true
    setResultado(null)
    setSeleccionada(null)

    cargarPalabrasBiblicasVerificadas(pasaje)
      .then((data) => {
        if (!activo) return
        setResultado(data)
        if (data.status === 'available') {
          setSeleccionada(data.occurrences[0]?.wordIndex ?? null)
        }
      })
      .catch(() => {
        if (activo) setResultado(null)
      })

    return () => {
      activo = false
    }
  }, [pasaje])

  if (!resultado || resultado.status !== 'available') return null

  const palette = {
    claro: {
      shell: 'border-indigo-200 bg-indigo-50/70 text-slate-800',
      button: 'border-indigo-100 bg-white text-slate-700',
      buttonActive: 'border-indigo-500 bg-indigo-600 text-white',
      detail: 'border-indigo-100 bg-white text-slate-700',
      source: 'border-slate-100 bg-slate-50 text-slate-600',
      muted: 'text-slate-500',
    },
    oscuro: {
      shell: 'border-indigo-800/60 bg-indigo-950/30 text-slate-100',
      button: 'border-slate-700 bg-slate-900 text-slate-200',
      buttonActive: 'border-indigo-500 bg-indigo-600 text-white',
      detail: 'border-indigo-900/50 bg-slate-950/50 text-slate-200',
      source: 'border-slate-700 bg-slate-900 text-slate-300',
      muted: 'text-slate-400',
    },
    sepia: {
      shell: 'border-[#b5a1cb] bg-[#eee5f4] text-[#493c2d]',
      button: 'border-[#d2c2df] bg-[#fffaf0] text-[#493c2d]',
      buttonActive: 'border-[#73528f] bg-[#73528f] text-white',
      detail: 'border-[#d2c2df] bg-[#fffaf0] text-[#493c2d]',
      source: 'border-[#dac8a5] bg-[#f7eedc] text-[#6b5943]',
      muted: 'text-[#7d6b54]',
    },
  }[modo]

  const occurrence = resultado.occurrences.find((item) => item.wordIndex === seleccionada)
    ?? resultado.occurrences[0]

  return (
    <section className={`rounded-3xl border p-4 font-sans sm:p-5 ${palette.shell}`} aria-labelledby="biblia-lexico-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-700">
          <Languages className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-700">Datos lingüísticos verificados</p>
          <h2 id="biblia-lexico-title" className="mt-1 text-base font-bold">Palabras clave del texto original</h2>
          <p className={`mt-1 text-xs leading-5 ${palette.muted}`}>
            Selección piloto para {resultado.referenceLabel}. Estos datos provienen de una fuente aprobada y no fueron generados por IA.
          </p>
        </div>
        <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Datos aprobados" />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {resultado.occurrences.map((item) => {
          const active = item.wordIndex === occurrence.wordIndex
          return (
            <button
              key={`${item.entry.lexicalId}-${item.wordIndex}`}
              type="button"
              onClick={() => setSeleccionada(active ? null : item.wordIndex)}
              aria-expanded={active}
              className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${active ? palette.buttonActive : palette.button}`}
            >
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-none" dir="auto">{item.surfaceForm}</span>
                <span className="mt-1 block truncate text-xs font-semibold opacity-75">
                  {item.entry.displayGlossEs || item.entry.sourceGloss || item.entry.transliteration || item.entry.lexicalId}
                </span>
              </span>
              {active ? <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      {seleccionada !== null && occurrence && (
        <article className={`mt-3 rounded-2xl border p-4 ${palette.detail}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-indigo-700">
                {LANGUAGE_LABELS[occurrence.entry.language]} · palabra {occurrence.wordIndex}
              </p>
              <p className="mt-2 text-3xl font-bold leading-none" dir="auto">{occurrence.surfaceForm}</p>
              {occurrence.entry.transliteration && (
                <p className={`mt-2 text-sm font-semibold ${palette.muted}`}>{occurrence.entry.transliteration}</p>
              )}
            </div>
            {occurrence.entry.strongNumber && (
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-700">
                Strong {occurrence.entry.strongNumber}
              </span>
            )}
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className={`text-[10px] font-black uppercase tracking-wide ${palette.muted}`}>Lema</dt>
              <dd className="mt-1 font-bold" dir="auto">{occurrence.entry.lemma}</dd>
            </div>
            {partOfSpeechLabel(occurrence.entry.partOfSpeech) && (
              <div>
                <dt className={`text-[10px] font-black uppercase tracking-wide ${palette.muted}`}>Categoría</dt>
                <dd className="mt-1 font-bold">{partOfSpeechLabel(occurrence.entry.partOfSpeech)}</dd>
              </div>
            )}
            {occurrence.entry.sourceGloss && (
              <div>
                <dt className={`text-[10px] font-black uppercase tracking-wide ${palette.muted}`}>Glosa de la fuente</dt>
                <dd className="mt-1 font-bold">{occurrence.entry.sourceGloss}</dd>
              </div>
            )}
            {occurrence.entry.displayGlossEs && (
              <div>
                <dt className={`text-[10px] font-black uppercase tracking-wide ${palette.muted}`}>Sentido breve en español</dt>
                <dd className="mt-1 font-bold">{occurrence.entry.displayGlossEs}</dd>
                <p className={`mt-1 text-[10px] leading-4 ${palette.muted}`}>
                  {GLOSS_KIND_LABELS[occurrence.entry.displayGlossKind]}
                </p>
              </div>
            )}
          </dl>

          {(occurrence.morphologySummary || occurrence.morphologyCode) && (
            <div className="mt-4 rounded-xl bg-indigo-500/10 p-3">
              <div className="flex items-start gap-2">
                <BookOpenText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-indigo-700">Morfología</p>
                  {occurrence.morphologySummary && <p className="mt-1 text-xs leading-5">{occurrence.morphologySummary}</p>}
                  {occurrence.morphologyCode && <code className="mt-1 block text-[10px] font-semibold opacity-65">{occurrence.morphologyCode}</code>}
                </div>
              </div>
            </div>
          )}

          <div className={`mt-4 rounded-xl border p-3 ${palette.source}`}>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <div className="min-w-0 flex-1 text-[11px] leading-5">
                <p className="font-bold">{occurrence.source.name}</p>
                <p>{occurrence.source.attribution}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold ring-1 ring-slate-300/60">
                    {licenseLabel(occurrence.source.licenseUrl)}
                  </span>
                  <a
                    href={occurrence.entry.sourceLocator || occurrence.sourceLocator}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-bold leading-none text-indigo-700 sm:w-auto"
                  >
                    Abrir fuente
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      <div className={`mt-4 flex items-center gap-2 border-t border-indigo-500/25 pt-3 text-[10px] font-medium ${palette.muted}`}>
        <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
        Versión del paquete: <code className="font-mono">{resultado.version}</code>
      </div>
    </section>
  )
}
