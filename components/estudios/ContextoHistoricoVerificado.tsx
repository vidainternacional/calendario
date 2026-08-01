import Link from 'next/link'
import {
  BadgeCheck,
  ExternalLink,
  Fingerprint,
  Landmark,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { listarContextoBiblicoParaReferencia } from '@/lib/estudios/biblical-context'
import { parsearReferenciaBiblicaContextual } from '@/lib/estudios/biblical-reference'

const CONTENT_KIND_LABELS = {
  source_excerpt: 'Cita de fuente',
  editorial_summary: 'Resumen editorial',
  inference: 'Inferencia identificada',
} as const

function exampleHref(pasaje: string, from?: string) {
  const params = new URLSearchParams({ pasaje })
  if (from === 'pastoral') params.set('from', 'pastoral')
  return `/estudios/profundo?${params.toString()}`
}

function licenseLabel(url: string | null) {
  if (url?.includes('/by/3.0')) return 'CC BY 3.0'
  if (url?.includes('/by/4.0')) return 'CC BY 4.0'
  return 'Licencia verificada'
}

export default async function ContextoHistoricoVerificado({
  pasaje,
  from,
}: {
  pasaje?: string
  from?: string
}) {
  const reference = parsearReferenciaBiblicaContextual(pasaje)
  const context = reference
    ? await listarContextoBiblicoParaReferencia({
        bookCode: reference.bookCode,
        chapter: reference.chapter,
        verse: reference.verse,
      })
    : null

  if (!reference || !context || context.fragments.length === 0) {
    return (
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="contexto-verificado-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Capa separada de evidencia</p>
            <h2 id="contexto-verificado-title" className="mt-1 text-base font-bold text-slate-900">Contexto histórico verificado</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Los fragmentos aprobados se consultan por separado y todavía no se envían a la IA. La cobertura inicial incluye Roma en Romanos y Hechos 28.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={exampleHref('Romanos 8:28', from)} className="inline-flex min-h-10 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900">
            Ver ejemplo: Romanos 8:28
          </Link>
          <Link href={exampleHref('Hechos 28:16', from)} className="inline-flex min-h-10 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900">
            Ver ejemplo: Hechos 28:16
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-5 rounded-3xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm sm:p-5" aria-labelledby="contexto-verificado-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
          <Landmark className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Evidencia revisada</p>
          <h2 id="contexto-verificado-title" className="mt-1 text-base font-bold text-slate-900">Contexto histórico verificado</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Resultado para {reference.bookLabel} {reference.chapter}{reference.verse ? `:${reference.verse}` : ''}. Esta información se muestra aparte y no forma parte de la respuesta generada por IA.
          </p>
        </div>
        <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Contenido aprobado" />
      </div>

      <div className="mt-4 space-y-3">
        {context.fragments.map((fragment) => (
          <article key={fragment.slug} className="rounded-2xl border border-amber-100 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  {CONTENT_KIND_LABELS[fragment.contentKind]} · {fragment.referenceLabel}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{fragment.title}</h3>
              </div>
              {fragment.locationNames.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {fragment.locationNames.join(', ')}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">{fragment.content}</p>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <div className="min-w-0 text-[11px] leading-5 text-slate-600">
                  <p className="font-semibold text-slate-800">{fragment.source.name}</p>
                  <p>{fragment.source.attribution}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 font-semibold ring-1 ring-slate-200">
                      {licenseLabel(fragment.source.licenseUrl)}
                    </span>
                    <a href={fragment.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 font-semibold text-amber-800 hover:bg-amber-50">
                      Abrir registro de la fuente
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-amber-200 pt-3 text-[10px] font-medium text-slate-500">
        <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
        Versión del paquete: <code className="font-mono">{context.version}</code>
      </div>
    </section>
  )
}
