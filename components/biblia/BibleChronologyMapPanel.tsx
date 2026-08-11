'use client'

import { useEffect, useState } from 'react'
import { Clock3, ExternalLink, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { cargarCronologiaBiblica } from '@/app/actions/cronologia-biblica'

type Modo = 'claro' | 'oscuro' | 'sepia'
type Resultado = Awaited<ReturnType<typeof cargarCronologiaBiblica>>

const precisionLabels: Record<string, string> = {
  exact: 'Exacta',
  year: 'Año conocido',
  range: 'Rango',
  approximate: 'Aproximada',
  relative: 'Relativa',
  unknown: 'No determinada',
  regional: 'Regional',
}

const certaintyLabels: Record<string, string> = {
  high: 'Certeza alta',
  medium: 'Certeza media',
  low: 'Certeza baja',
  disputed: 'Debatido',
}

function bibleRange(event: Resultado extends { status: 'available'; events: infer E } ? E extends Array<infer T> ? T : never : never) {
  const start = `${event.startBookCode} ${event.startChapter}${event.startVerse ? `:${event.startVerse}` : ''}`
  const endBook = event.endBookCode ?? event.startBookCode
  const endChapter = event.endChapter ?? event.startChapter
  const end = `${endBook} ${endChapter}${event.endVerse ? `:${event.endVerse}` : ''}`
  return start === end ? start : `${start}–${end}`
}

export default function BibleChronologyMapPanel({ pasaje, modo }: { pasaje: string; modo: Modo }) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setResultado(null)

    cargarCronologiaBiblica(pasaje)
      .then(data => {
        if (activo) setResultado(data)
      })
      .catch(() => {
        if (activo) setResultado(null)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [pasaje])

  const palette = {
    claro: {
      shell: 'border-sky-200 bg-sky-50/70 text-slate-800',
      card: 'border-sky-100 bg-white text-slate-700',
      soft: 'bg-slate-50 text-slate-600',
      muted: 'text-slate-500',
    },
    oscuro: {
      shell: 'border-sky-800/60 bg-sky-950/30 text-slate-100',
      card: 'border-sky-900/50 bg-slate-950/50 text-slate-200',
      soft: 'bg-slate-900 text-slate-300',
      muted: 'text-slate-400',
    },
    sepia: {
      shell: 'border-[#b8b28d] bg-[#e8ead7] text-[#493c2d]',
      card: 'border-[#d1c9a8] bg-[#fffaf0] text-[#493c2d]',
      soft: 'bg-[#f2ead9] text-[#6b5943]',
      muted: 'text-[#7d6b54]',
    },
  }[modo]

  if (cargando) {
    return (
      <section className={`rounded-3xl border p-5 ${palette.shell}`} aria-label="Cargando cronología y mapa">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden="true" />
          <p className="text-sm font-semibold">Buscando cronología y lugares aprobados…</p>
        </div>
      </section>
    )
  }

  if (!resultado || resultado.status !== 'available') return null

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 ${palette.shell}`} aria-labelledby="biblia-cronologia-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-700">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-sky-700">Piloto geográfico verificado</p>
          <h2 id="biblia-cronologia-title" className="mt-1 text-base font-bold">Cronología y mapa</h2>
          <p className={`mt-1 text-xs leading-5 ${palette.muted}`}>
            Datos aprobados para {resultado.referenceLabel}. Las coordenadas ubican puntos aproximados y no representan límites históricos exactos.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Contenido aprobado" />
      </div>

      <div className="mt-4 space-y-3">
        {resultado.events.map(event => (
          <article key={event.slug} className={`rounded-2xl border p-4 ${palette.card}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-700">{bibleRange(event)}</p>
                <h3 className="mt-1 text-sm font-bold">{event.title}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                <span className={`rounded-full px-2.5 py-1 ${palette.soft}`}>{precisionLabels[event.datePrecision] || event.datePrecision}</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700">{certaintyLabels[event.certainty] || event.certainty}</span>
              </div>
            </div>

            {event.summary && <p className="mt-3 text-sm leading-6">{event.summary}</p>}

            {event.period && (
              <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${palette.soft}`}>
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span><strong>Periodo:</strong> {event.period.title}</span>
              </div>
            )}

            {event.places.map(relation => {
              const place = relation.place
              const hasCoordinates = place.latitude !== null && place.longitude !== null
              const mapHref = hasCoordinates
                ? `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=10/${place.latitude}/${place.longitude}`
                : null

              return (
                <div key={`${event.slug}-${place.slug}-${relation.relationType}`} className={`mt-3 rounded-xl p-3 ${palette.soft}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">Lugar relacionado</p>
                      <p className="mt-1 text-sm font-bold">{place.name}</p>
                      <p className={`mt-1 text-[11px] leading-5 ${palette.muted}`}>
                        {hasCoordinates ? `${place.latitude}, ${place.longitude}` : 'Coordenada no disponible'} · {precisionLabels[place.coordinatePrecision] || place.coordinatePrecision}
                      </p>
                    </div>
                    <MapPin className="h-4 w-4 shrink-0 text-[#C0392B]" aria-hidden="true" />
                  </div>
                  {mapHref && (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-sky-700 ring-1 ring-current/15">
                      Ver ubicación <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )
            })}

            <footer className={`mt-3 flex flex-col gap-2 border-t border-current/10 pt-3 text-[11px] leading-5 ${palette.muted}`}>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {event.source.name}</span>
              <a href={event.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 font-bold text-sky-700">
                Fuente y atribución <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </footer>
          </article>
        ))}
      </div>

      <p className={`mt-4 border-t border-current/10 pt-3 font-mono text-[9px] ${palette.muted}`}>
        Paquete {resultado.version}
      </p>
    </section>
  )
}
