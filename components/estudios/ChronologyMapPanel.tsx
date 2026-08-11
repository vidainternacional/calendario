import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Route,
  ShieldCheck,
} from 'lucide-react'
import type { PaqueteCronologicoBiblico } from '@/lib/estudios/biblical-chronology-maps'

const precisionLabels = {
  exact: 'Fecha exacta',
  year: 'Año conocido',
  range: 'Rango de fechas',
  approximate: 'Fecha aproximada',
  relative: 'Orden relativo',
  unknown: 'Fecha no determinada',
  regional: 'Ubicación regional',
} as const

const certaintyLabels = {
  high: 'Certeza alta',
  medium: 'Certeza media',
  low: 'Certeza baja',
  disputed: 'Interpretación debatida',
} as const

const relationLabels: Record<string, string> = {
  occurs_at: 'Ocurre aquí',
  destination: 'Destino',
  origin: 'Punto de partida',
  mentioned: 'Lugar mencionado',
  associated: 'Lugar relacionado',
  route: 'Parte del recorrido',
}

function bibleRange(event: PaqueteCronologicoBiblico['events'][number]) {
  const start = `${event.startBookCode} ${event.startChapter}${event.startVerse ? `:${event.startVerse}` : ''}`
  const endBook = event.endBookCode ?? event.startBookCode
  const endChapter = event.endChapter ?? event.startChapter
  const endVerse = event.endVerse
  const end = `${endBook} ${endChapter}${endVerse ? `:${endVerse}` : ''}`
  return start === end ? start : `${start}–${end}`
}

function displayYear(year: number | null, era: string) {
  if (year === null) return null
  const absolute = Math.abs(year)
  const normalizedEra = era.trim().toUpperCase()
  if (normalizedEra.includes('BCE') || normalizedEra.includes('BC') || year < 0) return `${absolute} a. C.`
  if (normalizedEra.includes('CE') || normalizedEra.includes('AD') || year > 0) return `${absolute} d. C.`
  return String(absolute)
}

function periodRange(event: PaqueteCronologicoBiblico['events'][number]) {
  const period = event.period
  if (!period) return null
  const start = displayYear(period.startYear, period.era)
  const end = displayYear(period.endYear, period.era)
  if (start && end && start !== end) return `${start} – ${end}`
  return start || end
}

function osmEmbedHref(latitude: number, longitude: number) {
  const delta = 0.18
  const left = longitude - delta
  const right = longitude + delta
  const bottom = latitude - delta
  const top = latitude + delta
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

function osmPageHref(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=10/${latitude}/${longitude}`
}

export default function ChronologyMapPanel({ bundle }: { bundle: PaqueteCronologicoBiblico }) {
  if (bundle.events.length === 0) return null

  return (
    <section className="border-b border-slate-100 bg-gradient-to-b from-amber-50/70 to-white px-5 py-6 sm:px-7" aria-labelledby="chronology-map-title">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <Route className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Ubique el pasaje en la historia</p>
          <h3 id="chronology-map-title" className="mt-1 text-lg font-bold text-slate-950">Qué ocurrió, cuándo y dónde</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Siga la secuencia de acontecimientos relacionados con esta referencia y vea sus lugares directamente en el mapa. Los datos históricos y geográficos provienen únicamente de fuentes revisadas.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200/70 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            <strong className="text-slate-900">Cómo leer esta sección:</strong> empiece por el número del acontecimiento, lea qué pasó y después abra el lugar para entender geográficamente el relato.
          </p>
        </div>
      </div>

      <div className="relative mt-6 space-y-5 before:absolute before:bottom-7 before:left-[17px] before:top-6 before:w-px before:bg-amber-200 sm:before:left-[19px]">
        {bundle.events.map((event, eventIndex) => {
          const range = periodRange(event)

          return (
            <article key={event.slug} className="relative pl-11 sm:pl-13">
              <div className="absolute left-0 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-amber-50 bg-amber-700 text-xs font-black text-white shadow-sm sm:h-10 sm:w-10">
                {eventIndex + 1}
              </div>

              <div className="overflow-hidden rounded-3xl border border-amber-200/70 bg-white shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-800">{bibleRange(event)}</p>
                      <h4 className="mt-1 text-lg font-bold leading-6 text-slate-950">{event.title}</h4>
                      {event.summary && (
                        <div className="mt-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">Qué ocurrió</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{event.summary}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {event.period && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">Cuándo</p>
                          <p className="mt-0.5 text-sm font-bold text-slate-900">{event.period.title}</p>
                          {range && <p className="mt-0.5 text-xs text-slate-500">{range}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.places.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">Dónde</p>
                      <div className="mt-2 space-y-3">
                        {event.places.map((relation, placeIndex) => {
                          const place = relation.place
                          const hasCoordinates = place.latitude !== null && place.longitude !== null
                          const mapHref = hasCoordinates ? osmPageHref(place.latitude!, place.longitude!) : null
                          const mapEmbedHref = hasCoordinates ? osmEmbedHref(place.latitude!, place.longitude!) : null

                          return (
                            <details key={`${event.slug}-${place.slug}-${relation.relationType}-${placeIndex}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#C0392B]">
                                  <MapPin className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold text-slate-950">{place.name}</span>
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    {relationLabels[relation.relationType] ?? 'Lugar relacionado'}
                                  </span>
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 group-open:bg-amber-100 group-open:text-amber-800">
                                  Ver mapa
                                </span>
                              </summary>

                              <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                                {mapEmbedHref ? (
                                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <iframe
                                      title={`Mapa de ${place.name}`}
                                      src={mapEmbedHref}
                                      loading="lazy"
                                      className="h-56 w-full border-0 sm:h-64"
                                      referrerPolicy="no-referrer-when-downgrade"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 text-center">
                                    <div>
                                      <MapIcon className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                                      <p className="mt-2 text-xs leading-5 text-slate-500">La fuente identifica el lugar, pero no ofrece una coordenada suficientemente precisa para dibujarlo en el mapa.</p>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                                  <span>
                                    {precisionLabels[place.coordinatePrecision]} · {certaintyLabels[place.certainty]}
                                  </span>
                                  {mapHref && (
                                    <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 font-bold text-amber-800 hover:underline">
                                      Abrir mapa completo <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </details>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <details className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-600 [&::-webkit-details-marker]:hidden">
                      <span>Precisión y respaldo histórico</span>
                      <span className="text-[10px] font-semibold text-slate-400">Detalles</span>
                    </summary>
                    <div className="border-t border-slate-100 px-3.5 py-3">
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                          {precisionLabels[event.datePrecision]}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                          {certaintyLabels[event.certainty]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          {event.source.name}
                        </span>
                        <a href={event.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 font-semibold text-amber-800 hover:underline">
                          Ver fuente y atribución <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Los puntos del mapa ayudan a ubicar el relato; no representan fronteras políticas ni extensiones territoriales históricas exactas.
      </p>
    </section>
  )
}
