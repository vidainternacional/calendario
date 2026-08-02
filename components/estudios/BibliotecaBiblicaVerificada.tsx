import Link from 'next/link'
import {
  BadgeCheck,
  BookMarked,
  ChevronDown,
  ExternalLink,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react'
import { listarBibliotecaParaReferencia } from '@/lib/estudios/biblical-library'
import { parsearReferenciaBiblicaContextual } from '@/lib/estudios/biblical-reference'

const CONTENT_KIND_LABELS = {
  source_excerpt: 'Cita de fuente',
  editorial_summary: 'Resumen editorial revisado',
  inference: 'Inferencia identificada',
} as const

function exampleHref(pasaje: string, from?: string) {
  const params = new URLSearchParams({ pasaje })
  if (from === 'pastoral') params.set('from', 'pastoral')
  return `/estudios/profundo?${params.toString()}`
}

function licenseLabel(url: string | null) {
  if (url?.includes('/by/4.0')) return 'CC BY 4.0'
  if (url?.includes('/by-sa/4.0')) return 'CC BY-SA 4.0'
  return 'Licencia verificada'
}

export default async function BibliotecaBiblicaVerificada({
  pasaje,
  from,
}: {
  pasaje?: string
  from?: string
}) {
  const reference = parsearReferenciaBiblicaContextual(pasaje)
  const library = reference
    ? await listarBibliotecaParaReferencia({
        bookCode: reference.bookCode,
        chapter: reference.chapter,
        verse: reference.verse,
      })
    : null

  if (!reference || !library || library.fragments.length === 0) {
    return (
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="biblioteca-verificada-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <BookMarked className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">Biblioteca interna</p>
            <h2 id="biblioteca-verificada-title" className="mt-1 text-base font-bold text-slate-900">Evidencia documental por pasaje</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              La cobertura inicial es deliberadamente pequeña. Incluye resúmenes editoriales revisados para Salmos 23:1 y Juan 3:16, sin enviar estos datos a la IA.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href={exampleHref('Salmos 23:1', from)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-900">
            Ver Salmos 23:1
          </Link>
          <Link href={exampleHref('Juan 3:16', from)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-900">
            Ver Juan 3:16
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-5 rounded-3xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm sm:p-5" aria-labelledby="biblioteca-verificada-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
          <BookMarked className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">Biblioteca interna verificada</p>
          <h2 id="biblioteca-verificada-title" className="mt-1 text-base font-bold text-slate-900">Evidencia documental para {reference.bookLabel} {reference.chapter}{reference.verse ? `:${reference.verse}` : ''}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Los detalles permanecen contraídos para mantener una lectura limpia. Cada ficha conserva fuente, licencia, localizador y huella de integridad.
          </p>
        </div>
        <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Contenido aprobado" />
      </div>

      <div className="mt-4 space-y-3">
        {library.fragments.map((fragment) => (
          <details key={fragment.slug} className="group overflow-hidden rounded-2xl border border-indigo-100 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                  {CONTENT_KIND_LABELS[fragment.contentKind]} · {fragment.referenceLabel}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{fragment.title}</h3>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>

            <div className="border-t border-indigo-50 px-4 py-4">
              <p className="text-sm leading-6 text-slate-700">{fragment.content}</p>

              {fragment.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {fragment.topics.map((topic) => (
                    <span key={topic} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-800">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-[11px] leading-5 text-slate-600">
                    <p className="font-semibold text-slate-800">{fragment.item.title}</p>
                    <p>{fragment.item.source.attribution}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 font-semibold ring-1 ring-slate-200">
                        {licenseLabel(fragment.item.source.licenseUrl)}
                      </span>
                      <a
                        href={fragment.sourceLocator}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-bold text-indigo-800 hover:bg-indigo-50 sm:w-auto"
                      >
                        Abrir fuente
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-indigo-200 pt-3 text-[10px] font-medium text-slate-500">
        <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
        Versión del paquete: <code className="font-mono">{library.version}</code>
      </div>
    </section>
  )
}
