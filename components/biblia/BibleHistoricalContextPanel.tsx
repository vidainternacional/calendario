'use client'

import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  ExternalLink,
  Fingerprint,
  Landmark,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { cargarContextoHistoricoBiblico } from '@/app/actions/contexto-biblico'
import BibleChronologyMapPanel from '@/components/biblia/BibleChronologyMapPanel'
import BibleLexicalPanel from '@/components/biblia/BibleLexicalPanel'

type Modo = 'claro' | 'oscuro' | 'sepia'
type Resultado = Awaited<ReturnType<typeof cargarContextoHistoricoBiblico>>

const CONTENT_KIND_LABELS = {
  source_excerpt: 'Cita de fuente',
  editorial_summary: 'Resumen editorial',
  inference: 'Inferencia identificada',
} as const

function licenseLabel(url: string | null) {
  if (url?.includes('/by/3.0')) return 'CC BY 3.0'
  if (url?.includes('/by/4.0')) return 'CC BY 4.0'
  return 'Licencia verificada'
}

function languageLabel(value: string) {
  if (value === 'hebrew') return 'Hebreo'
  if (value === 'aramaic') return 'Arameo'
  if (value === 'greek') return 'Griego koiné'
  return value
}

export default function BibleHistoricalContextPanel({ pasaje, modo }: { pasaje: string; modo: Modo }) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setResultado(null)

    cargarContextoHistoricoBiblico(pasaje)
      .then((data) => {
        if (activo) setResultado(data)
      })
      .catch(() => {
        if (activo) setResultado(null)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [pasaje])

  const palette = {
    claro: {
      shell: 'border-amber-200 bg-amber-50/70 text-slate-800',
      card: 'border-amber-100 bg-white text-slate-700',
      source: 'border-slate-100 bg-slate-50 text-slate-600',
      muted: 'text-slate-500',
    },
    oscuro: {
      shell: 'border-amber-800/60 bg-amber-950/30 text-slate-100',
      card: 'border-amber-900/50 bg-slate-950/50 text-slate-200',
      source: 'border-slate-700 bg-slate-900 text-slate-300',
      muted: 'text-slate-400',
    },
    sepia: {
      shell: 'border-[#c9ad78] bg-[#f3e3c2] text-[#493c2d]',
      card: 'border-[#d8c298] bg-[#fffaf0] text-[#493c2d]',
      source: 'border-[#dac8a5] bg-[#f7eedc] text-[#6b5943]',
      muted: 'text-[#7d6b54]',
    },
  }[modo]

  let historicalPanel = null

  if (cargando) {
    historicalPanel = (
      <section className={`rounded-3xl border p-5 ${palette.shell}`} aria-label="Cargando contexto histórico">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" aria-hidden="true" />
          <p className="text-sm font-semibold">Buscando contexto histórico aprobado…</p>
        </div>
      </section>
    )
  } else if (resultado?.status === 'available') {
    historicalPanel = (
      <section className={`rounded-3xl border p-4 sm:p-5 ${palette.shell}`} aria-labelledby="biblia-contexto-title">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-700">Evidencia revisada</p>
            <h2 id="biblia-contexto-title" className="mt-1 text-base font-bold">Contexto histórico verificado</h2>
            <p className={`mt-1 text-xs leading-5 ${palette.muted}`}>Resultado para {resultado.referenceLabel}.</p>
          </div>
          <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Contenido aprobado" />
        </div>

        <div className="mt-4 space-y-3">
          {resultado.fragments.map((fragment) => (
            <article key={fragment.slug} className={`rounded-2xl border p-4 ${palette.card}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                    {CONTENT_KIND_LABELS[fragment.contentKind]} · {fragment.referenceLabel}
                  </p>
                  <h3 className="mt-1 text-sm font-bold">{fragment.title}</h3>
                </div>
                {fragment.locationNames.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {fragment.locationNames.join(', ')}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6">{fragment.content}</p>
              <div className={`mt-4 rounded-xl border p-3 ${palette.source}`}>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div className="min-w-0 text-[11px] leading-5">
                    <p className="font-bold">{fragment.source.name}</p>
                    <p>{fragment.source.attribution}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold ring-1 ring-slate-300/60">{licenseLabel(fragment.source.licenseUrl)}</span>
                      <a href={fragment.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-amber-700">
                        Abrir fuente <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={`mt-4 flex items-center gap-2 border-t border-amber-500/25 pt-3 text-[10px] font-medium ${palette.muted}`}>
          <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
          Versión del paquete: <code className="font-mono">{resultado.version}</code>
        </div>
      </section>
    )
  } else if (resultado?.status === 'editorial' && resultado.editorialContext) {
    const context = resultado.editorialContext
    const sections = [
      ['Contexto histórico', context.historicalContext],
      ['Contexto judío', context.jewishContext],
      ['Contexto literario', context.literaryContext],
      ['Intención comunicativa', context.authorialIntent],
      ['Precauciones interpretativas', context.interpretiveCautions],
    ].filter(([, value]) => Boolean(value?.trim()))

    historicalPanel = (
      <section className={`rounded-3xl border p-4 sm:p-5 ${palette.shell}`} aria-labelledby="biblia-contexto-title">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-700">Contexto canónico</p>
            <h2 id="biblia-contexto-title" className="mt-1 text-base font-bold">{context.title}</h2>
            {context.bookLanguages.length > 0 && (
              <p className={`mt-1 text-xs leading-5 ${palette.muted}`}>Idioma(s) original(es): {context.bookLanguages.map(languageLabel).join(' y ')}</p>
            )}
          </div>
        </div>

        {context.summary?.trim() && <p className="mt-4 text-sm leading-6">{context.summary}</p>}
        {sections.length > 0 && (
          <div className="mt-4 space-y-3">
            {sections.map(([label, value]) => (
              <article key={label} className={`rounded-2xl border p-4 ${palette.card}`}>
                <h3 className="text-xs font-black uppercase tracking-wide text-amber-700">{label}</h3>
                <p className="mt-2 text-sm leading-6">{value}</p>
              </article>
            ))}
          </div>
        )}

        {(context.places.length > 0 || context.peopleGroups.length > 0 || context.keyTerms.length > 0) && (
          <div className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${palette.source}`}>
            {context.places.length > 0 && <p><strong>Lugares:</strong> {context.places.join(', ')}</p>}
            {context.peopleGroups.length > 0 && <p><strong>Pueblos:</strong> {context.peopleGroups.join(', ')}</p>}
            {context.keyTerms.length > 0 && <p><strong>Términos clave:</strong> {context.keyTerms.join(', ')}</p>}
          </div>
        )}

        <div className={`mt-4 border-t border-amber-500/25 pt-3 text-[10px] leading-5 ${palette.muted}`}>
          <p className="font-semibold">{context.attribution}</p>
          <p>{context.disclosure}</p>
          <p className="mt-1 font-mono">Paquete {resultado.version}</p>
        </div>
      </section>
    )
  }

  return (
    <>
      {historicalPanel}
      <BibleChronologyMapPanel pasaje={pasaje} modo={modo} />
      <BibleLexicalPanel pasaje={pasaje} modo={modo} />
    </>
  )
}
