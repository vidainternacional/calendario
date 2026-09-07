'use client'

import { ExternalLink, MapPinned, Route } from 'lucide-react'

type Precision = 'exact' | 'approximate' | 'regional' | 'unknown'
type Certainty = 'high' | 'medium' | 'low' | 'disputed'

type Place = {
  id: string
  ancient: string
  modern: string | null
  lat: number
  lon: number
  precision: Precision
  certainty: Certainty
}

type Stop = { placeId: string; reference: string }
type Journey = {
  id: string
  name: string
  scripture: string
  dating: string
  note: string
  stops: Stop[]
}

const PLACES: Record<string, Place> = {
  ae41ab4: { id: 'ae41ab4', ancient: 'Antioquía de Siria', modern: 'Antioquía del Orontes', lat: 36.226691, lon: 36.171743, precision: 'approximate', certainty: 'high' },
  a6d306d: { id: 'a6d306d', ancient: 'Seleucia', modern: 'Seleucia Pieria', lat: 36.124, lon: 35.922, precision: 'approximate', certainty: 'high' },
  afa863b: { id: 'afa863b', ancient: 'Salamina', modern: 'Salamina', lat: 35.184944, lon: 33.901944, precision: 'approximate', certainty: 'high' },
  a314765: { id: 'a314765', ancient: 'Pafos', modern: 'Nea Pafos', lat: 34.755667, lon: 32.404167, precision: 'approximate', certainty: 'high' },
  aff04b8: { id: 'aff04b8', ancient: 'Perge', modern: 'Perge', lat: 36.960353, lon: 30.853686, precision: 'approximate', certainty: 'high' },
  a6c704a: { id: 'a6c704a', ancient: 'Antioquía de Pisidia', modern: 'Yalvaç / zona de Antioquía de Pisidia', lat: 38.306111, lon: 31.189167, precision: 'approximate', certainty: 'high' },
  ae425aa: { id: 'ae425aa', ancient: 'Iconio', modern: 'Konya', lat: 37.872202, lon: 32.492331, precision: 'approximate', certainty: 'high' },
  af0719d: { id: 'af0719d', ancient: 'Listra', modern: 'Tel Lystra', lat: 37.6017, lon: 32.3384, precision: 'approximate', certainty: 'high' },
  aa401a9: { id: 'aa401a9', ancient: 'Derbe', modern: 'Kerti Hüyük', lat: 37.348569, lon: 33.361453, precision: 'approximate', certainty: 'high' },
  ac744c1: { id: 'ac744c1', ancient: 'Atalia', modern: 'Antalya', lat: 36.881272, lon: 30.703614, precision: 'approximate', certainty: 'high' },
  a91c509: { id: 'a91c509', ancient: 'Troas', modern: 'Alejandría de Troas', lat: 39.751944, lon: 26.158611, precision: 'approximate', certainty: 'high' },
  a68750d: { id: 'a68750d', ancient: 'Samotracia', modern: 'Samothraki', lat: 40.45, lon: 25.583333, precision: 'regional', certainty: 'high' },
  a6a7150: { id: 'a6a7150', ancient: 'Neápolis', modern: 'Kavala', lat: 40.935, lon: 24.415, precision: 'approximate', certainty: 'high' },
  a49e1d0: { id: 'a49e1d0', ancient: 'Filipos', modern: 'Filipos', lat: 41.012072, lon: 24.284576, precision: 'approximate', certainty: 'high' },
  a4bdea7: { id: 'a4bdea7', ancient: 'Anfípolis', modern: 'Amfípolis', lat: 40.820159, lon: 23.847209, precision: 'approximate', certainty: 'high' },
  ab20df9: { id: 'ab20df9', ancient: 'Apolonia', modern: 'Apolonia', lat: 40.623703, lon: 23.469685, precision: 'approximate', certainty: 'high' },
  afa9d8e: { id: 'afa9d8e', ancient: 'Tesalónica', modern: 'Thessaloniki', lat: 40.637771, lon: 22.945767, precision: 'approximate', certainty: 'high' },
  a62fe31: { id: 'a62fe31', ancient: 'Berea', modern: 'Veria', lat: 40.518333, lon: 22.2, precision: 'approximate', certainty: 'high' },
  a1fe6e7: { id: 'a1fe6e7', ancient: 'Atenas', modern: 'Atenas', lat: 37.971851, lon: 23.726738, precision: 'approximate', certainty: 'high' },
  a6f437a: { id: 'a6f437a', ancient: 'Corinto', modern: 'Corinto', lat: 37.905785, lon: 22.878741, precision: 'approximate', certainty: 'high' },
  aa31dd3: { id: 'aa31dd3', ancient: 'Cencrea', modern: 'Kechries', lat: 37.884335, lon: 22.996816, precision: 'approximate', certainty: 'high' },
  a5feb15: { id: 'a5feb15', ancient: 'Éfeso', modern: 'Éfeso', lat: 37.939125, lon: 27.3407, precision: 'approximate', certainty: 'high' },
  a58735e: { id: 'a58735e', ancient: 'Cesarea', modern: 'Cesarea Marítima', lat: 32.5, lon: 34.891667, precision: 'approximate', certainty: 'high' },
  a0a2ca7: { id: 'a0a2ca7', ancient: 'Asón', modern: 'Assos', lat: 39.490556, lon: 26.336667, precision: 'approximate', certainty: 'high' },
  a33910d: { id: 'a33910d', ancient: 'Mitilene', modern: 'Mitilene', lat: 39.110475, lon: 26.547048, precision: 'approximate', certainty: 'high' },
  a4c2c75: { id: 'a4c2c75', ancient: 'Quíos', modern: 'Quíos', lat: 38.3725, lon: 26.1375, precision: 'regional', certainty: 'high' },
  acf6ec0: { id: 'acf6ec0', ancient: 'Samos', modern: 'Samos', lat: 37.75, lon: 26.8333, precision: 'regional', certainty: 'high' },
  a55027d: { id: 'a55027d', ancient: 'Mileto', modern: 'Mileto', lat: 37.531111, lon: 27.275556, precision: 'approximate', certainty: 'high' },
  a398e5d: { id: 'a398e5d', ancient: 'Cos', modern: 'Kos', lat: 36.815278, lon: 27.110278, precision: 'regional', certainty: 'high' },
  a4218ee: { id: 'a4218ee', ancient: 'Rodas', modern: 'Rodas', lat: 36.4402, lon: 28.2109, precision: 'regional', certainty: 'disputed' },
  ade301b: { id: 'ade301b', ancient: 'Pátara', modern: 'Patara', lat: 36.260278, lon: 29.314167, precision: 'approximate', certainty: 'high' },
  a160272: { id: 'a160272', ancient: 'Tiro', modern: 'Tiro', lat: 33.270833, lon: 35.196111, precision: 'approximate', certainty: 'high' },
  abc2af0: { id: 'abc2af0', ancient: 'Tolemaida', modern: 'Acre', lat: 32.9214, lon: 35.0692, precision: 'approximate', certainty: 'high' },
  a15257a: { id: 'a15257a', ancient: 'Jerusalén', modern: 'Jerusalén', lat: 31.776667, lon: 35.234167, precision: 'approximate', certainty: 'high' },
  a98e4d7: { id: 'a98e4d7', ancient: 'Sidón', modern: 'Sidón', lat: 33.560985, lon: 35.371944, precision: 'approximate', certainty: 'high' },
  aa4b3e2: { id: 'aa4b3e2', ancient: 'Mira', modern: 'Demre / antigua Mira', lat: 36.259167, lon: 29.985278, precision: 'approximate', certainty: 'high' },
  ab793ce: { id: 'ab793ce', ancient: 'Cnido', modern: 'Datça / sitio de Cnido', lat: 36.685833, lon: 27.375, precision: 'approximate', certainty: 'high' },
  aae626a: { id: 'aae626a', ancient: 'Buenos Puertos', modern: 'Kaloi Limenes', lat: 34.929694, lon: 24.800306, precision: 'approximate', certainty: 'high' },
  a57835d: { id: 'a57835d', ancient: 'Malta', modern: 'Malta', lat: 35.933464, lon: 14.411732, precision: 'regional', certainty: 'high' },
  a1e3697: { id: 'a1e3697', ancient: 'Siracusa', modern: 'Siracusa', lat: 37.063889, lon: 15.293056, precision: 'approximate', certainty: 'high' },
  a63bb26: { id: 'a63bb26', ancient: 'Regio', modern: 'Reggio Calabria', lat: 38.1088, lon: 15.64412, precision: 'approximate', certainty: 'high' },
  a4488e9: { id: 'a4488e9', ancient: 'Puteoli', modern: 'Pozzuoli', lat: 40.826111, lon: 14.120556, precision: 'approximate', certainty: 'high' },
  a121d5e: { id: 'a121d5e', ancient: 'Foro de Apio', modern: 'Forum Appii', lat: 41.46639, lon: 12.9975, precision: 'approximate', certainty: 'high' },
  afef438: { id: 'afef438', ancient: 'Tres Tabernas', modern: 'zona de Tres Tabernas', lat: 41.561944, lon: 12.873889, precision: 'approximate', certainty: 'high' },
  afc8e7a: { id: 'afc8e7a', ancient: 'Roma', modern: 'Roma', lat: 41.8922, lon: 12.4852, precision: 'approximate', certainty: 'high' },
  a079b21: { id: 'a079b21', ancient: 'Ramesés', modern: 'zona propuesta de Pelusio', lat: 31.042512, lon: 32.546139, precision: 'approximate', certainty: 'high' },
  aa28709: { id: 'aa28709', ancient: 'Sucot', modern: 'identificación propuesta cerca de Pitón', lat: 30.5475, lon: 31.963611, precision: 'approximate', certainty: 'disputed' },
  a27d0e0: { id: 'a27d0e0', ancient: 'Etam', modern: 'identificación propuesta cerca de Tjaru', lat: 30.9352, lon: 32.3669, precision: 'approximate', certainty: 'disputed' },
  ababfd2: { id: 'ababfd2', ancient: 'Pi-hahirot', modern: 'identificación propuesta cerca de Pelusio', lat: 31.042512, lon: 32.546139, precision: 'approximate', certainty: 'high' },
  a3d18b2: { id: 'a3d18b2', ancient: 'Mar Rojo (cruce propuesto)', modern: 'Golfo de Suez', lat: 28.75, lon: 33, precision: 'regional', certainty: 'disputed' },
  ad3970d: { id: 'ad3970d', ancient: 'Mara', modern: 'Ain Hawarah', lat: 29.34604, lon: 32.94284, precision: 'approximate', certainty: 'disputed' },
  a2410c1: { id: 'a2410c1', ancient: 'Elim', modern: 'zona del Wadi Gharandal', lat: 29.254722, lon: 32.915833, precision: 'regional', certainty: 'high' },
  a0f54e4: { id: 'a0f54e4', ancient: 'Desierto de Sin', modern: 'Debbet er Ramleh', lat: 29.147778, lon: 33.536667, precision: 'regional', certainty: 'disputed' },
  a05ebb7: { id: 'a05ebb7', ancient: 'Refidim', modern: 'zona propuesta del Wadi Rufaiyil', lat: 28.623056, lon: 33.880278, precision: 'regional', certainty: 'disputed' },
  abfba2a: { id: 'abfba2a', ancient: 'Monte Sinaí', modern: 'Jebel Musa (identificación tradicional)', lat: 28.539722, lon: 33.973333, precision: 'approximate', certainty: 'disputed' },
  ae7836a: { id: 'ae7836a', ancient: 'Kibrot-hataava', modern: 'Erweis el Ebeirig', lat: 28.788667, lon: 34.275439, precision: 'approximate', certainty: 'disputed' },
  a1b6474: { id: 'a1b6474', ancient: 'Hazerot', modern: 'Ain el Khadra', lat: 28.896944, lon: 34.421667, precision: 'approximate', certainty: 'disputed' },
  ac2cef0: { id: 'ac2cef0', ancient: 'Cades-barnea', modern: 'Ain el Qudeirat', lat: 30.648333, lon: 34.422222, precision: 'approximate', certainty: 'high' },
  ad8027f: { id: 'ad8027f', ancient: 'Monte Hor', modern: 'Har Zin (identificación propuesta)', lat: 30.832057, lon: 35.056872, precision: 'approximate', certainty: 'disputed' },
  a51d1fa: { id: 'a51d1fa', ancient: 'Abel-sitim', modern: 'zona de Sitim', lat: 31.84018, lon: 35.67368, precision: 'approximate', certainty: 'high' },
}

const JOURNEYS: Journey[] = [
  {
    id: 'paul-first', name: 'Primer viaje misionero de Pablo', scripture: 'Hechos 13–14', dating: 'aprox. 46–48 d.C.',
    note: 'Reconstrucción común siguiendo el orden del relato. Las líneas unen lugares mencionados; no representan caminos antiguos exactos.',
    stops: [
      ['ae41ab4','Hch 13:1'],['a6d306d','Hch 13:4'],['afa863b','Hch 13:5'],['a314765','Hch 13:6'],['aff04b8','Hch 13:13'],['a6c704a','Hch 13:14'],['ae425aa','Hch 13:51'],['af0719d','Hch 14:6'],['aa401a9','Hch 14:20'],['af0719d','Hch 14:21'],['ae425aa','Hch 14:21'],['a6c704a','Hch 14:21'],['aff04b8','Hch 14:25'],['ac744c1','Hch 14:25'],['ae41ab4','Hch 14:26'],
    ].map(([placeId, reference]) => ({ placeId, reference })),
  },
  {
    id: 'paul-second', name: 'Segundo viaje misionero de Pablo', scripture: 'Hechos 15:36–18:22', dating: 'aprox. 49–52 d.C.',
    note: 'Reconstrucción común siguiendo el orden del relato. Los tramos terrestres y marítimos se dibujan como líneas directas entre paradas.',
    stops: [
      ['ae41ab4','Hch 15:35'],['aa401a9','Hch 16:1'],['af0719d','Hch 16:1'],['a91c509','Hch 16:8'],['a68750d','Hch 16:11'],['a6a7150','Hch 16:11'],['a49e1d0','Hch 16:12'],['a4bdea7','Hch 17:1'],['ab20df9','Hch 17:1'],['afa9d8e','Hch 17:1'],['a62fe31','Hch 17:10'],['a1fe6e7','Hch 17:15'],['a6f437a','Hch 18:1'],['aa31dd3','Hch 18:18'],['a5feb15','Hch 18:19'],['a58735e','Hch 18:22'],['ae41ab4','Hch 18:22'],
    ].map(([placeId, reference]) => ({ placeId, reference })),
  },
  {
    id: 'paul-third', name: 'Tercer viaje misionero de Pablo', scripture: 'Hechos 18:23–21:17', dating: 'aprox. 53–57 d.C.',
    note: 'Reconstrucción común del recorrido narrado en Hechos. Las líneas son esquemáticas y no pretenden reconstruir cada camino histórico.',
    stops: [
      ['ae41ab4','Hch 18:23'],['a5feb15','Hch 19:1'],['a49e1d0','Hch 20:6'],['a91c509','Hch 20:6'],['a0a2ca7','Hch 20:13'],['a33910d','Hch 20:14'],['a4c2c75','Hch 20:15'],['acf6ec0','Hch 20:15'],['a55027d','Hch 20:17'],['a398e5d','Hch 21:1'],['a4218ee','Hch 21:1'],['ade301b','Hch 21:1'],['a160272','Hch 21:3'],['abc2af0','Hch 21:7'],['a58735e','Hch 21:8'],['a15257a','Hch 21:17'],
    ].map(([placeId, reference]) => ({ placeId, reference })),
  },
  {
    id: 'paul-rome', name: 'Viaje de Pablo a Roma', scripture: 'Hechos 27–28', dating: 'aprox. 59–60 d.C.',
    note: 'Reconstrucción común del viaje. El tramo de la tormenta se representa de forma esquemática; no afirma una trayectoria marítima exacta.',
    stops: [
      ['a58735e','Hch 27:1'],['a98e4d7','Hch 27:3'],['aa4b3e2','Hch 27:5'],['ab793ce','Hch 27:7'],['aae626a','Hch 27:8'],['a57835d','Hch 28:1'],['a1e3697','Hch 28:12'],['a63bb26','Hch 28:13'],['a4488e9','Hch 28:13'],['a121d5e','Hch 28:15'],['afef438','Hch 28:15'],['afc8e7a','Hch 28:16'],
    ].map(([placeId, reference]) => ({ placeId, reference })),
  },
  {
    id: 'exodus', name: 'Recorrido del Éxodo', scripture: 'Éxodo 12 – Números 33', dating: 'siglos XV–XIII a.C. (fecha debatida)',
    note: 'Reconstrucción propuesta. El cruce del mar y varias estaciones del desierto son debatidos; VIDA los marca como tales y no los presenta como certezas.',
    stops: [
      ['a079b21','Ex 12:37'],['aa28709','Ex 12:37'],['a27d0e0','Ex 13:20'],['ababfd2','Ex 14:2'],['a3d18b2','Ex 14:22'],['ad3970d','Ex 15:23'],['a2410c1','Ex 15:27'],['a0f54e4','Ex 16:1'],['a05ebb7','Ex 17:1'],['abfba2a','Ex 19:1'],['ae7836a','Nm 11:34'],['a1b6474','Nm 11:35'],['ac2cef0','Nm 13:26'],['ad8027f','Nm 20:22'],['a51d1fa','Nm 33:49'],
    ].map(([placeId, reference]) => ({ placeId, reference })),
  },
]

function journeysForReference(bookCode: string, chapter: number, verse: number | null) {
  const code = bookCode.toUpperCase()
  return JOURNEYS.filter(journey => {
    if (journey.id === 'paul-first') return code === 'ACT' && chapter >= 13 && chapter <= 14
    if (journey.id === 'paul-second') {
      if (code !== 'ACT' || chapter < 15 || chapter > 18) return false
      if (chapter === 18 && verse !== null) return verse <= 22
      return true
    }
    if (journey.id === 'paul-third') {
      if (code !== 'ACT' || chapter < 18 || chapter > 21) return false
      if (chapter === 18 && verse !== null) return verse >= 23
      return true
    }
    if (journey.id === 'paul-rome') return code === 'ACT' && chapter >= 27 && chapter <= 28
    if (journey.id === 'exodus') {
      if (code === 'EXO') return chapter >= 12
      if (code === 'LEV') return true
      if (code === 'NUM') return chapter <= 33
    }
    return false
  })
}

function precisionLabel(place: Place) {
  if (place.certainty === 'disputed') return 'Ubicación debatida'
  if (place.certainty === 'low') return 'Certeza baja'
  if (place.precision === 'regional') return 'Zona aproximada'
  return 'Ubicación aproximada'
}

const MAP_WIDTH = 700
const MAP_HEIGHT = 360
const TILE_SIZE = 256
const MAP_PADDING = 34

function mercatorWorldPoint(place: Place, zoom: number) {
  const size = TILE_SIZE * (2 ** zoom)
  const lat = Math.max(-85.05112878, Math.min(85.05112878, place.lat))
  const sinLat = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((place.lon + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * size,
  }
}

function buildMap(stops: Place[]) {
  let zoom = 2
  for (let candidate = 7; candidate >= 2; candidate -= 1) {
    const candidatePoints = stops.map(stop => mercatorWorldPoint(stop, candidate))
    const minX = Math.min(...candidatePoints.map(point => point.x))
    const maxX = Math.max(...candidatePoints.map(point => point.x))
    const minY = Math.min(...candidatePoints.map(point => point.y))
    const maxY = Math.max(...candidatePoints.map(point => point.y))
    if (maxX - minX <= MAP_WIDTH - MAP_PADDING * 2 && maxY - minY <= MAP_HEIGHT - MAP_PADDING * 2) {
      zoom = candidate
      break
    }
  }

  const worldPoints = stops.map(stop => mercatorWorldPoint(stop, zoom))
  const minX = Math.min(...worldPoints.map(point => point.x))
  const maxX = Math.max(...worldPoints.map(point => point.x))
  const minY = Math.min(...worldPoints.map(point => point.y))
  const maxY = Math.max(...worldPoints.map(point => point.y))
  const originX = (minX + maxX) / 2 - MAP_WIDTH / 2
  const originY = (minY + maxY) / 2 - MAP_HEIGHT / 2
  const tileMinX = Math.floor(originX / TILE_SIZE)
  const tileMaxX = Math.floor((originX + MAP_WIDTH) / TILE_SIZE)
  const tileMinY = Math.floor(originY / TILE_SIZE)
  const tileMaxY = Math.floor((originY + MAP_HEIGHT) / TILE_SIZE)
  const tileCount = 2 ** zoom

  const tiles: Array<{ key: string; x: number; y: number; left: number; top: number }> = []
  for (let tileY = tileMinY; tileY <= tileMaxY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue
    for (let tileX = tileMinX; tileX <= tileMaxX; tileX += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount
      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        x: wrappedX,
        y: tileY,
        left: tileX * TILE_SIZE - originX,
        top: tileY * TILE_SIZE - originY,
      })
    }
  }

  return {
    zoom,
    tiles,
    points: worldPoints.map((point, index) => ({
      place: stops[index],
      x: point.x - originX,
      y: point.y - originY,
    })),
  }
}

function JourneyGraphic({ journey }: { journey: Journey }) {
  const stops = journey.stops.flatMap((stop, index) => {
    const place = PLACES[stop.placeId]
    return place ? [{ ...stop, place, index: index + 1 }] : []
  })
  if (stops.length < 2) return null

  const map = buildMap(stops.map(stop => stop.place))
  const polyline = map.points.map(point => `${point.x},${point.y}`).join(' ')

  return (
    <article className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
      <header className="border-b border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Route className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">Recorrido gráfico</p>
            <h4 className="mt-1 text-lg font-bold text-slate-950">{journey.name}</h4>
            <p className="mt-1 text-sm text-slate-500">{journey.scripture} · {journey.dating}</p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <div className="relative aspect-[35/18] overflow-hidden rounded-2xl border border-sky-100 bg-slate-100">
          {map.tiles.map(tile => (
            <img
              key={tile.key}
              src={`https://tile.openstreetmap.org/${map.zoom}/${tile.x}/${tile.y}.png`}
              alt=""
              loading="lazy"
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                left: `${(tile.left / MAP_WIDTH) * 100}%`,
                top: `${(tile.top / MAP_HEIGHT) * 100}%`,
                width: `${(TILE_SIZE / MAP_WIDTH) * 100}%`,
                height: `${(TILE_SIZE / MAP_HEIGHT) * 100}%`,
              }}
            />
          ))}
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={`Mapa geográfico del ${journey.name}`} className="absolute inset-0 h-full w-full">
            <polyline points={polyline} fill="none" stroke="white" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            <polyline points={polyline} fill="none" className="stroke-sky-700" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            {map.points.map((point, index) => (
              <g key={`${journey.id}-${index}`}>
                <circle cx={point.x} cy={point.y} r="14" fill="white" className="stroke-sky-800" strokeWidth="4" />
                <text x={point.x} y={point.y + 4} textAnchor="middle" className="fill-sky-900 text-[11px] font-black">{index + 1}</text>
              </g>
            ))}
          </svg>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute bottom-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 shadow-sm">
            © OpenStreetMap
          </a>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">{journey.note}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {stops.map(stop => {
            const href = `https://www.openstreetmap.org/?mlat=${stop.place.lat}&mlon=${stop.place.lon}#map=10/${stop.place.lat}/${stop.place.lon}`
            return (
              <div key={`${journey.id}-${stop.index}-${stop.place.id}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-black text-sky-800">{stop.index}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{stop.place.ancient}</p>
                      <span className="text-[11px] font-semibold text-sky-700">{stop.reference}</span>
                    </div>
                    {stop.place.modern && <p className="mt-1 text-xs leading-5 text-slate-600"><strong>Hoy:</strong> {stop.place.modern}</p>}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${stop.place.certainty === 'disputed' ? 'text-amber-700' : 'text-slate-400'}`}>{precisionLabel(stop.place)}</span>
                      <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-sky-700 hover:bg-sky-50">Ver lugar actual <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <footer className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Itinerario basado en el orden del relato bíblico. Identificaciones y coordenadas geográficas: OpenBible.info; mapa base: OpenStreetMap. Las líneas muestran el orden de las paradas, no una trayectoria histórica exacta.</span>
        </footer>
      </div>
    </article>
  )
}

export default function BiblicalJourneyMap({ bookCode, chapter, verse }: { bookCode: string; chapter: number; verse: number | null }) {
  const journeys = journeysForReference(bookCode, chapter, verse)
  if (journeys.length === 0) return null

  return (
    <section className="space-y-3 border-b border-slate-100 bg-sky-50/30 px-5 py-6 sm:px-7" aria-label="Recorridos bíblicos relacionados">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Geografía bíblica</p>
        <h3 className="mt-1 text-lg font-bold text-slate-950">Recorridos y lugares</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">Muestra el recorrido sobre un mapa geográfico y, cuando existe una identificación confiable, indica qué lugar corresponde hoy.</p>
      </div>
      {journeys.map(journey => <JourneyGraphic key={journey.id} journey={journey} />)}
    </section>
  )
}
