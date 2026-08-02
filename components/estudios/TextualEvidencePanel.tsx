'use client'

import { ChevronDown, ExternalLink, Languages } from 'lucide-react'
import type { EstudioState } from '@/app/actions/estudio-interno'

type StudySuccessState = Extract<EstudioState, { status: 'success'; kind: 'study' }>
type TextualEvidence = NonNullable<StudySuccessState['textualEvidence']>
type Edition = TextualEvidence['editions'][number]
type Word = Edition['words'][number]
type Variant = Edition['variants'][number]

const LANGUAGE_LABELS = {
  hebrew: 'Hebreo bíblico',
  aramaic: 'Arameo bíblico',
  greek: 'Griego koiné',
} as const

const VARIANT_LABELS = {
  substitution: 'Sustitución',
  addition: 'Adición',
  omission: 'Omisión',
  transposition: 'Cambio de orden',
  orthographic: 'Diferencia ortográfica',
} as const

function listText(values: unknown[]) {
  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(', ')
}

function WordDetails({ word, direction }: { word: Word; direction: Edition['textDirection'] }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
          {word.displayWordIndex}
        </span>
        <span className="min-w-0 flex-1">
          <span
            dir={direction}
            className={`block break-words text-xl font-semibold text-slate-950 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
          >
            {word.surfaceForm}
          </span>
          <span className="mt-0.5 block break-words text-xs text-slate-500">
            {[word.transliteration, word.glossEs].filter(Boolean).join(' · ')}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="border-t border-slate-100 px-4 py-4">
        <div className="space-y-3">
          {word.morphemes.map(morpheme => (
            <div key={`${word.displayWordIndex}-${morpheme.morphemeIndex}-${morpheme.lexicalId}`} className="rounded-xl bg-slate-50 p-3">
              {word.morphemes.length > 1 && (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                    {morpheme.tokenKind === 'suffix' ? 'Sufijo' : morpheme.tokenKind === 'prefix' ? 'Prefijo' : 'Raíz'}
                  </span>
                  <span dir={direction} className="text-lg font-semibold text-slate-950">{morpheme.surfaceForm}</span>
                </div>
              )}

              <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-500">Lema</dt>
                  <dd className="mt-0.5 break-words text-slate-800">
                    <span dir={direction}>{morpheme.lemma}</span>
                    {morpheme.lemmaTransliteration ? ` · ${morpheme.lemmaTransliteration}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Strong</dt>
                  <dd className="mt-0.5 text-slate-800">{morpheme.strongNumber || 'No indicado'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Sentido en esta ocurrencia</dt>
                  <dd className="mt-0.5 break-words text-slate-800">{morpheme.glossEs || 'Pendiente'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Morfología</dt>
                  <dd className="mt-0.5 break-words text-slate-800">
                    {morpheme.morphologySummary || morpheme.morphologyCode || 'No indicada'}
                    {morpheme.morphologySummary && morpheme.morphologyCode ? ` (${morpheme.morphologyCode})` : ''}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </details>
  )
}

function VariantCard({ variant, direction }: { variant: Variant; direction: Edition['textDirection'] }) {
  const editions = listText(variant.editions)
  const witnesses = listText(variant.witnesses)

  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">
          {VARIANT_LABELS[variant.readingType]}
        </span>
        {variant.anchorWordIndex && (
          <span className="text-[11px] font-semibold text-amber-700">Posición fuente {variant.anchorWordIndex}</span>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Lectura base</p>
          <p dir={direction} className="mt-1 break-words text-base font-semibold text-slate-950">
            {variant.baseReading || 'La lectura base omite esta palabra'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Otra lectura</p>
          <p dir={direction} className="mt-1 break-words text-base font-semibold text-slate-950">
            {variant.variantReading || 'Omisión'}
          </p>
        </div>
      </div>

      {variant.significanceEs && <p className="mt-3 text-sm leading-6 text-slate-700">{variant.significanceEs}</p>}
      {variant.witnessSummary && <p className="mt-2 text-xs leading-5 text-slate-600">{variant.witnessSummary}</p>}
      {(editions || witnesses) && (
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {editions ? `Ediciones: ${editions}.` : ''} {witnesses ? `Testigos: ${witnesses}.` : ''}
        </p>
      )}
    </article>
  )
}

function EditionPanel({ edition }: { edition: Edition }) {
  const languageLabel = LANGUAGE_LABELS[edition.language]

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700">
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          {languageLabel}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          {edition.analysisStatus === 'verified' ? 'Fuente verificada' : 'Análisis parcial'}
        </span>
        {edition.tokenCount !== null && (
          <span className="text-[11px] font-semibold text-slate-400">{edition.tokenCount} palabras base</span>
        )}
      </div>

      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Texto original</p>
        <p
          dir={edition.textDirection}
          className={`mt-3 break-words text-2xl leading-[1.75] ${edition.textDirection === 'rtl' ? 'text-right font-serif' : 'text-left'}`}
        >
          {edition.originalText}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Transliteración</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-800">{edition.transliteration || 'No disponible'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Traducción literal</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-800">{edition.literalTranslationEs || 'No disponible'}</p>
        </div>
      </div>

      <details className="group rounded-2xl border border-slate-200 bg-slate-50/70">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
          <span>Palabra por palabra ({edition.words.length})</span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-2 border-t border-slate-200 p-3">
          {edition.words.map(word => (
            <WordDetails key={`${edition.language}-${word.displayWordIndex}`} word={word} direction={edition.textDirection} />
          ))}
        </div>
      </details>

      {(edition.variantOccurrences.length > 0 || edition.variants.length > 0) && (
        <details className="group rounded-2xl border border-amber-200 bg-amber-50/40">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-amber-900 [&::-webkit-details-marker]:hidden">
            <span>Variantes textuales ({edition.variants.length})</span>
            <ChevronDown className="h-4 w-4 text-amber-600 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-3 border-t border-amber-200 p-3">
            {edition.variantOccurrences.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Ocurrencias adicionales</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {edition.variantOccurrences.map(word => (
                    <span key={`variant-${word.displayWordIndex}-${word.surfaceForm}`} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-slate-800">
                      <strong dir={edition.textDirection}>{word.surfaceForm}</strong>
                      {word.transliteration ? ` · ${word.transliteration}` : ''}
                      {word.glossEs ? ` · ${word.glossEs}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {edition.variants.map(variant => (
              <VariantCard key={variant.key} variant={variant} direction={edition.textDirection} />
            ))}
          </div>
        </details>
      )}

      <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
        <p><strong className="text-slate-700">Fuente:</strong> {edition.source.name}</p>
        <p className="mt-1">{edition.source.attribution}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href={edition.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline">
            Ver registro fuente <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {edition.source.licenseUrl && (
            <a href={edition.source.licenseUrl} target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:underline">
              Licencia
            </a>
          )}
        </div>
      </footer>
    </section>
  )
}

export default function TextualEvidencePanel({ evidence }: { evidence: TextualEvidence }) {
  return (
    <section className="border-b border-slate-100 bg-gradient-to-b from-indigo-50/60 to-white px-5 py-6 sm:px-7" aria-labelledby="textual-evidence-title">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Herramienta lingüística piloto</p>
        <h3 id="textual-evidence-title" className="mt-1 text-lg font-bold text-slate-950">Texto original y análisis verificable</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Datos internos aprobados para {evidence.reference.canonicalReference}. No se generaron mediante IA durante esta consulta.
        </p>
      </div>

      <div className="space-y-7">
        {evidence.editions.map(edition => (
          <EditionPanel key={`${edition.language}-${edition.contentHash}`} edition={edition} />
        ))}
      </div>

      <p className="mt-4 text-right text-[10px] font-semibold text-slate-400">Paquete {evidence.version}</p>
    </section>
  )
}
