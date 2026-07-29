import { BadgeCheck, Database, Fingerprint } from 'lucide-react'
import { listarFuentesBiblicasAprobadas, type FuenteBiblicaAprobada } from '@/lib/estudios/biblical-sources'

const sourceLabels: Record<FuenteBiblicaAprobada['sourceType'], string> = {
  provider_catalog: 'Catálogo de proveedor',
  translation: 'Traducción bíblica',
  commentary: 'Comentario',
  cross_reference: 'Referencias cruzadas',
  profile: 'Perfil bíblico',
  historical: 'Fuente histórica',
}

function licenseLabel(source: FuenteBiblicaAprobada) {
  if (source.licenseStatus === 'varies_by_item') return 'Licencia propia por recurso'
  if (source.licenseUrl?.includes('/by/4.0')) return 'CC BY 4.0'
  if (source.licenseUrl?.includes('/by-sa/4.0')) return 'CC BY-SA 4.0'
  if (source.licenseUrl?.includes('publicdomain')) return 'Dominio público'
  return 'Licencia verificada'
}

export default async function FuentesBiblicasAprobadas() {
  const catalog = await listarFuentesBiblicasAprobadas()
  if (catalog.sources.length === 0) return null

  return (
    <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="fuentes-biblicas-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Database className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Registro verificable</p>
          <h2 id="fuentes-biblicas-title" className="mt-1 text-base font-bold text-slate-900">Fuentes aprobadas</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Solo estas fuentes están habilitadas para la capa de evidencia. Registrar una fuente no significa que su contenido ya esté siendo enviado a la IA.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {catalog.sources.map((source) => (
          <article key={source.slug} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{sourceLabels[source.sourceType]}</p>
                <h3 className="mt-1 text-sm font-bold text-slate-800">{source.name}</h3>
              </div>
              <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Fuente aprobada" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{source.attribution}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{source.provider}</span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{licenseLabel(source)}</span>
              {source.language && <span className="rounded-full bg-white px-2.5 py-1 uppercase ring-1 ring-slate-200">{source.language}</span>}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] font-medium text-slate-400">
        <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
        Versión del catálogo: <code className="font-mono">{catalog.version}</code>
      </div>
    </section>
  )
}
