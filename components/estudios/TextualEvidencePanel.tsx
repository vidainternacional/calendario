'use client'

import { ChevronDown, ExternalLink, Languages, Link2, ShieldCheck } from 'lucide-react'
import type { ResolvedBiblicalTextualStudyBundle } from '@/lib/estudios/resolved-biblical-textual-study'

type Edition = ResolvedBiblicalTextualStudyBundle['editions'][number]
type Word = Edition['words'][number]
type Variant = Edition['variants'][number]
type Modo = 'claro' | 'oscuro' | 'sepia'

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
  return values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(', ')
}

function WordDetails({ word, edition, palette }: {
  word: Word
  edition: Edition
  palette: ReturnType<typeof getPalette>
}) {
  return (
    <details className={`group rounded-2xl border ${palette.card}`}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${palette.badge}`}>
          {word.displayWordIndex}
        </span>
        <span className="min-w-0 flex-1">
          <span
            dir={edition.textDirection}
            className={`block break-words text-xl font-semibold ${edition.textDirection === 'rtl' ? 'text-right' : 'text-left'}`}
          >
            {word.surfaceForm}
          </span>
          {(word.transliteration || word.glossEs) && (
            <span className={`mt-0.5 block break-words text-xs ${palette.muted}`}>
              {[word.transliteration, word.glossEs].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform group-open:rotate-180 ${palette.muted}`} aria-hidden="true" />
      </summary>

      <div className={`border-t px-4 py-4 ${palette.divider}`}>
        <div className="space-y-3">
          {word.morphemes.map(morpheme => {
            const morphology = morpheme.morphologySummary || morpheme.morphologyCode
            return (
              <div key={`${word.displayWordIndex}-${morpheme.morphemeIndex}-${morpheme.lexicalId}`} className={`rounded-xl p-3 ${palette.inner}`}>
                {word.morphemes.length > 1 && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">
                      {morpheme.tokenKind === 'suffix' ? 'Sufijo' : morpheme.tokenKind === 'prefix' ? 'Prefijo' : 'Raíz'}
                    </span>
                    <span dir={edition.textDirection} className="text-lg font-semibold">{morpheme.surfaceForm}</span>
                  </div>
                )}

                <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className={`font-semibold ${palette.muted}`}>Lema</dt>
                    <dd className="mt-0.5 break-words">
                      <span dir={edition.textDirection}>{morpheme.lemma}</span>
                      {morpheme.lemmaTransliteration ? ` · ${morpheme.lemmaTransliteration}` : ''}
                    </dd>
                  </div>
                  {morpheme.strongNumber && (
                    <div>
                      <dt className={`font-semibold ${palette.muted}`}>Strong</dt>
                      <dd className="mt-0.5">{morpheme.strongNumber}</dd>
                    </div>
                  )}
                  {morpheme.glossEs && (
                    <div>
                      <dt className={`font-semibold ${palette.muted}`}>Sentido en esta ocurrencia</dt>
                      <dd className="mt-0.5 break-words">{morpheme.glossEs}</dd>
                    </div>
                  )}
                  {morphology && (
                    <div>
                      <dt className={`font-semibold ${palette.muted}`}>Morfología</dt>
                      <dd className="mt-0.5 break-words">
                        {morphology}
                        {morpheme.morphologySummary && morpheme.morphologyCode ? ` (${morpheme.morphologyCode})` : ''}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )
          })}
        </div>
      </div>
    </details>
  )
}

function VariantCard({ variant, edition, palette }: {
  variant: Variant
  edition: Edition
  palette: ReturnType<typeof getPalette>
}) {
  const editions = listText(variant.editions)
  const witnesses = listText(variant.witnesses)

  return (
    <article className={`rounded-2xl border p-4 ${palette.variant}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">
          {VARIANT_LABELS[variant.readingType]}
        </span>
        {variant.anchorWordIndex && (
          <span className={`text-[11px] font-semibold ${palette.muted}`}>Posición {variant.anchorWordIndex}</span>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Lectura base</p>
          <p dir={edition.textDirection} className="mt-1 break-words text-base font-semibold">
            {variant.baseReading || 'La lectura base omite esta palabra'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Otra lectura</p>
          <p dir={edition.textDirection} className="mt-1 break-words text-base font-semibold">
            {variant.variantReading || 'Omisión'}
          </p>
        </div>
      </div>

      {variant.significanceEs && <p className="mt-3 text-sm leading-6">{variant.significanceEs}</p>}
      {variant.witnessSummary && <p className={`mt-2 text-xs leading-5 ${palette.muted}`}>{variant.witnessSummary}</p>}
      {(editions || witnesses) && (
        <p className={`mt-2 text-[11px] leading-5 ${palette.muted}`}>
          {editions ? `Ediciones: ${editions}.` : ''} {witnesses ? `Testigos: ${witnesses}.` : ''}
        </p>
      )}
    </article>
  )
}

function getPalette(modo: Modo) {
  return {
    claro: {
      shell: 'border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white text-slate-900',
      card: 'border-slate-200 bg-white text-slate-900',
      inner: 'bg-slate-50 text-slate-800',
      badge: 'bg-slate-100 text-slate-500',
      muted: 'text-slate-500',
      divider: 'border-slate-100',
      variant: 'border-amber-200 bg-amber-50/70 text-slate-900',
      source: 'border-slate-200 bg-slate-50 text-slate-600',
      textBox: 'bg-slate-950 text-white',
    },
    oscuro: {
      shell: 'border-indigo-800/60 bg-indigo-950/20 text-slate-100',
      card: 'border-slate-700 bg-slate-950/55 text-slate-100',
      inner: 'bg-slate-900 text-slate-200',
      badge: 'bg-slate-800 text-slate-300',
      muted: 'text-slate-400',
      divider: 'border-slate-700',
      variant: 'border-amber-800/60 bg-amber-950/25 text-slate-100',
      source: 'border-slate-700 bg-slate-900 text-slate-300',
      textBox: 'bg-black/45 text-white',
    },
    sepia: {
      shell: 'border-[#c9ad78] bg-[#f3e3c2] text-[#493c2d]',
      card: 'border-[#d8c298] bg-[#fffaf0] text-[#493c2d]',
      inner: 'bg-[#f7eedc] text-[#493c2d]',
      badge: 'bg-[#e8d8b8] text-[#6b5943]',
      muted: 'text-[#7d6b54]',
      divider: 'border-[#dac8a5]',
      variant: 'border-[#d8b873] bg-[#f7e7bd] text-[#493c2d]',
      source: 'border-[#dac8a5] bg-[#f7eedc] text-[#6b5943]',
      textBox: 'bg-[#493c2d] text-[#fffaf0]',
    },
  }[modo]
}

export default function TextualEvidencePanel({
  evidence,
  modo = 'claro',
}: {
  evidence: ResolvedBiblicalTextualStudyBundle
  modo?: Modo
}) {
  const palette = getPalette(modo)

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 ${palette.shell}`} aria-labelledby="textual-evidence-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-500">
          <Languages className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-500">Fuente lingüística aprobada</p>
          <h3 id="textual-evidence-title" className="mt-1 text-base font-bold">Texto original y análisis palabra por palabra</h3>
          <p className={`mt-1 text-xs leading-5 ${palette.muted}`}>
            Evidencia para {evidence.reference.canonicalReference}. No se generó mediante IA durante esta consulta.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Contenido aprobado" />
      </div>

      {evidence.versification && (
        <div className={`mt-4 rounded-2xl border p-3 text-xs leading-5 ${palette.source}`}>
          <p className="flex items-center gap-2 font-bold">
            <Link2 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            Correspondencia de versificación aplicada
          </p>
          <p className={`mt-1 ${palette.muted}`}>
            La traducción {evidence.versification.translationId} reúne esta referencia desde {evidence.versification.sourceReferences.join(' + ')}.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-7">
        {evidence.editions.map(edition => (
          <section key={`${edition.language}-${edition.contentHash}`} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1.5 text-[11px] font-bold text-indigo-500">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {LANGUAGE_LABELS[edition.language]}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-600">
                {edition.analysisStatus === 'verified' ? 'Fuente verificada' : 'Análisis parcial'}
              </span>
              {edition.baseEdition && (
                <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${edition.usesFallbackEdition ? 'bg-amber-500/15 text-amber-600' : palette.badge}`}>
                  Edición base: {edition.baseEdition}{edition.usesFallbackEdition ? ' · respaldo' : ''}
                </span>
              )}
              {edition.tokenCount !== null && (
                <span className={`text-[11px] font-semibold ${palette.muted}`}>{edition.tokenCount} palabras base</span>
              )}
            </div>

            <div className={`rounded-2xl p-5 ${palette.textBox}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">Texto original</p>
              <p
                dir={edition.textDirection}
                className={`mt-3 break-words text-2xl leading-[1.75] ${edition.textDirection === 'rtl' ? 'text-right font-serif' : 'text-left'}`}
              >
                {edition.originalText}
              </p>
            </div>

            {(edition.transliteration || edition.literalTranslationEs) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {edition.transliteration && (
                  <div className={`rounded-2xl border p-4 ${palette.card}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${palette.muted}`}>Transliteración</p>
                    <p className="mt-2 break-words text-sm leading-6">{edition.transliteration}</p>
                  </div>
                )}
                {edition.literalTranslationEs && (
                  <div className={`rounded-2xl border p-4 ${palette.card}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${palette.muted}`}>Secuencia literal de glosas</p>
                    <p className="mt-2 break-words text-sm leading-6">{edition.literalTranslationEs}</p>
                    <p className={`mt-2 text-[10px] leading-4 ${palette.muted}`}>Ayuda a observar el orden de las palabras; no es una traducción española pulida.</p>
                  </div>
                )}
              </div>
            )}

            {edition.words.length > 0 && (
              <details className={`group rounded-2xl border ${palette.card}`}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span>Palabra por palabra ({edition.words.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform group-open:rotate-180 ${palette.muted}`} aria-hidden="true" />
                </summary>
                <div className={`space-y-2 border-t p-3 ${palette.divider}`}>
                  {edition.words.map(word => (
                    <WordDetails key={`${edition.language}-${word.displayWordIndex}`} word={word} edition={edition} palette={palette} />
                  ))}
                </div>
              </details>
            )}

            {(edition.variantOccurrences.length > 0 || edition.variants.length > 0) && (
              <details className={`group rounded-2xl border ${palette.variant}`}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span>Variantes textuales ({edition.variants.length})</span>
                  <ChevronDown className="h-4 w-4 text-amber-600 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="space-y-3 border-t border-amber-500/25 p-3">
                  {edition.variantOccurrences.length > 0 && (
                    <div className={`rounded-2xl border p-4 ${palette.card}`}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">Ocurrencias adicionales</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {edition.variantOccurrences.map((word, index) => (
                          <span key={`variant-${index}-${word.displayWordIndex}-${word.surfaceForm}`} className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm">
                            <strong dir={edition.textDirection}>{word.surfaceForm}</strong>
                            {word.transliteration ? ` · ${word.transliteration}` : ''}
                            {word.glossEs ? ` · ${word.glossEs}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {edition.variants.map(variant => (
                    <VariantCard key={variant.key} variant={variant} edition={edition} palette={palette} />
                  ))}
                </div>
              </details>
            )}

            <footer className={`rounded-2xl border p-4 text-xs leading-5 ${palette.source}`}>
              <p><strong>Fuente:</strong> {edition.source.name}</p>
              <p className="mt-1">{edition.source.attribution}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a href={edition.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 font-semibold text-indigo-500 hover:underline">
                  Ver registro fuente <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                {edition.source.licenseUrl && (
                  <a href={edition.source.licenseUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center font-semibold hover:underline">
                    Licencia
                  </a>
                )}
              </div>
            </footer>
          </section>
        ))}
      </div>

      <p className={`mt-4 text-right text-[10px] font-semibold ${palette.muted}`}>Paquete {evidence.version}</p>
    </section>
  )
}
