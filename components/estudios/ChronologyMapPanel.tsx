import { Clock3, ExternalLink, MapPin, ShieldCheck } from 'lucide-react'
import type { PaqueteCronologicoBiblico } from '@/lib/estudios/biblical-chronology-maps'

const precisionLabels = {
  exact: 'Exacta',
  year: 'Año conocido',
  range: 'Rango',
  approximate: 'Aproximada',
  relative: 'Relativa',
  unknown: 'No determinada',
  regional: 'Regional',
} as const

const certaintyLabels = {
  high: 'Certeza alta',
  medium: 'Certeza media',
  low: 'Certeza baja',
  disputed: 'Debatido',
} as const

function bibleRange(event: PaqueteCronologicoBiblico['events'][number]) {
  const start = `${event.startBookCode} ${event.startChapter}${event.startVerse ? `:${event.startVerse}` : ''}`
  const endBook = event.endBookCode ?? event.startBookCode
  const endChapter = event.endChapter ?? event.startChapter
  const endVerse = event.endVerse
  const end = `${endBook} ${endChapter}${endVerse ? `:${endVerse}` : ''}`
  return start === end ? start : `${start}–${end}`
}

export default function ChronologyMapPanel({ bundle }: { bundle: PaqueteCronologicoBiblico }) {
  if (bundle.events.length === 0) return null

  return (
    <section className="border-b border-slate-100 bg-amber-50/40 px-5 py-6 sm:px-7" aria-labelledby="chronology-map-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Fuente histórica verificada</p>
          <h3 id="chronology-map-title" className="mt-1 text-lg font-bold text-slate-950">Cronología y mapa</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Eventos y lugares vinculados a esta referencia. Las coordenadas representan puntos aproximados, no límites históricos exactos.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {bundle.events.map(event => (
          <article key={event.slug} className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-800">{bibleRange(event)}</p>
                <h4 className="mt-1 text-base font-bold text-slate-950">{event.title}</h4>
                {event.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{event.summary}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  {precisionLabels[event.datePrecision]}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {certaintyLabels[event.certainty]}
                </span>
              </div>
            </div>

            {event.period && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span><strong className="text-slate-800">Periodo:</strong> {event.period.title}</span>
              </div>
            )}

            {event.places.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {event.places.map(relation => {
                  const place = relation.place
                  const hasCoordinates = place.latitude !== null && place.longitude !== null
                  const mapHref = hasCoordinates
                    ? `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=10/${place.latitude}/${place.longitude}`
                    : null

                  return (
                    <div key={`${event.slug}-${place.slug}-${relation.relationType}`} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lugar relacionado</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{place.name}</p>
                        </div>
                        <MapPin className="h-4 w-4 shrink-0 text-[#C0392B]" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {hasCoordinates ? `${place.latitude}, ${place.longitude}` : 'Coordenada no disponible'} · {precisionLabels[place.coordinatePrecision]}
                      </p>
                      {mapHref && (
                        <a href={mapHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Abrir ubicación <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <footer className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {event.source.name}</span>
              <a href={event.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:underline">
                Ver fuente y atribución <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}
