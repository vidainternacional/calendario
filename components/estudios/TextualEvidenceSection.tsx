'use client'

import { ChevronDown, ExternalLink, Languages, ShieldCheck } from 'lucide-react'
import type { ResolvedBiblicalTextualStudyBundle } from '@/lib/estudios/resolved-biblical-textual-study'

type Edition = ResolvedBiblicalTextualStudyBundle['editions'][number]
type Word = Edition['words'][number]
type Variant = Edition['variants'][number]

export type TextualEvidenceSectionKind = 'original' | 'transliteration' | 'literal' | 'words' | 'variants'

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

export function hasTextualEvidenceSection(
  evidence: ResolvedBiblicalTextualStudyBundle,
  section: TextualEvidenceSectionKind
) {
  if (section === 'original') return evidence.editions.some(edition => Boolean(edition.originalText?.trim()))
  if (section === 'transliteration') return evidence.editions.some(edition => Boolean(edition.transliteration?.trim()))
  if (section === 'literal') return evidence.editions.some(edition => Boolean(edition.literalTranslationEs?.trim()))
  if (section === 'words') return evidence.editions.some(edition => edition.words.length > 0)
  return evidence.editions.some(edition => edition.variants.length > 0 || edition.variantOccurrences.length > 0)
}

function EditionHeader({ edition }: { edition: Edition }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700">
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        {LANGUAGE_LABELS[edition.language]}
      </span>
      {edition.baseEdition && (
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
          {edition.baseEdition}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Fuente verificada
      </span>
    </div>
  )
}

function SourceFooter({ edition }: { edition: Edition }) {
  return (
    <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
      <span>{edition.source.name}</span>
      {edition.source.website && (
        <a href={edition.source.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline">
          Ver fuente <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </footer>
  )
}

function WordCard({ word, edition }: { word: Word; edition: Edition }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{word.displayWordIndex}</span>
        <span className="min-w-0 flex-1">
          <span dir={edition.textDirection} className={`block break-words text-lg font-semibold text-slate-900 ${edition.textDirection === 'rtl' ? 'text-right' : 'text-left'}`}>{word.surfaceForm}</span>
          {(word.transliteration || word.glossEs) && (
            <span className="mt-0.5 block break-words text-xs text-slate-500">{[word.transliteration, word.glossEs].filter(Boolean).join(' · ')}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-2 border-t border-slate-100 p-3">
        {word.morphemes.map(morpheme => {
          const morphology = morpheme.morphologySummary || morpheme.morphologyCode
          return (
            <div key={`${word.displayWordIndex}-${morpheme.morphemeIndex}-${morpheme.lexicalId}`} className="rounded-xl bg-slate-50 p-3">
              {word.morphemes.length > 1 && <p dir={edition.textDirection} className="mb-2 text-base font-semibold text-slate-900">{morpheme.surfaceForm}</p>}
              <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-500">Lema</dt>
                  <dd className="mt-0.5 break-words text-slate-800"><span dir={edition.textDirection}>{morpheme.lemma}</span>{morpheme.lemmaTransliteration ? ` · ${morpheme.lemmaTransliteration}` : ''}</dd>
                </div>
                {morpheme.strongNumber && <div><dt className="font-semibold text-slate-500">Strong</dt><dd className="mt-0.5 text-slate-800">{morpheme.strongNumber}</dd></div>}
                {morpheme.glossEs && <div><dt className="font-semibold text-slate-500">Sentido en esta ocurrencia</dt><dd className="mt-0.5 break-words text-slate-800">{morpheme.glossEs}</dd></div>}
                {morphology && <div><dt className="font-semibold text-slate-500">Morfología</dt><dd className="mt-0.5 break-words text-slate-800">{morphology}{morpheme.morphologySummary && morpheme.morphologyCode ? ` (${morpheme.morphologyCode})` : ''}</dd></div>}
              </dl>
            </div>
          )
        })}
      </div>
    </details>
  )
}

function VariantCard({ variant, edition }: { variant: Variant; edition: Edition }) {
  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">{VARIANT_LABELS[variant.readingType]}</span>
        {variant.anchorWordIndex && <span className="text-[11px] font-semibold text-slate-500">Posición {variant.anchorWordIndex}</span>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {variant.baseReading && <div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Lectura base</p><p dir={edition.textDirection} className="mt-1 break-words font-semibold text-slate-900">{variant.baseReading}</p></div>}
        {variant.variantReading && <div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Otra lectura</p><p dir={edition.textDirection} className="mt-1 break-words font-semibold text-slate-900">{variant.variantReading}</p></div>}
      </div>
      {variant.significanceEs && <p className="mt-3 text-sm leading-6 text-slate-700">{variant.significanceEs}</p>}
      {variant.witnessSummary && <p className="mt-2 text-xs leading-5 text-slate-500">{variant.witnessSummary}</p>}
    </article>
  )
}

export default function TextualEvidenceSection({
  evidence,
  section,
}: {
  evidence: ResolvedBiblicalTextualStudyBundle
  section: TextualEvidenceSectionKind
}) {
  const editions = evidence.editions.filter(edition => {
    if (section === 'original') return Boolean(edition.originalText?.trim())
    if (section === 'transliteration') return Boolean(edition.transliteration?.trim())
    if (section === 'literal') return Boolean(edition.literalTranslationEs?.trim())
    if (section === 'words') return edition.words.length > 0
    return edition.variants.length > 0 || edition.variantOccurrences.length > 0
  })

  if (editions.length === 0) return null

  return (
    <div className="space-y-5">
      {editions.map(edition => (
        <section key={`${section}-${edition.language}-${edition.contentHash}`} className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-4 sm:p-5">
          <EditionHeader edition={edition} />

          {section === 'original' && (
            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">Texto original</p>
              <p dir={edition.textDirection} className={`mt-3 break-words text-2xl leading-[1.75] ${edition.textDirection === 'rtl' ? 'text-right font-serif' : 'text-left'}`}>{edition.originalText}</p>
            </div>
          )}

          {section === 'transliteration' && edition.transliteration && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Transliteración</p>
              <p className="mt-2 break-words text-base leading-7 text-slate-800">{edition.transliteration}</p>
            </div>
          )}

          {section === 'literal' && edition.literalTranslationEs && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Secuencia literal de estudio</p>
              <p className="mt-2 break-words text-base leading-7 text-slate-800">{edition.literalTranslationEs}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">Conserva el orden de las palabras como ayuda de estudio; no sustituye la traducción bíblica española.</p>
            </div>
          )}

          {section === 'words' && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Palabra por palabra · {edition.words.length}</p>
              {edition.words.map(word => <WordCard key={`${edition.language}-${word.displayWordIndex}`} word={word} edition={edition} />)}
            </div>
          )}

          {section === 'variants' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Variantes textuales · {edition.variants.length}</p>
              {edition.variants.map(variant => <VariantCard key={variant.key} variant={variant} edition={edition} />)}
            </div>
          )}

          <SourceFooter edition={edition} />
        </section>
      ))}
    </div>
  )
}
