import 'server-only'
import { claveCancionVida, type CancionCatalogoVida } from './catalogo-vida'

type Objeto = Record<string, unknown>
type Fetcher = typeof fetch
const esObjeto = (value: unknown): value is Objeto => Boolean(value && typeof value === 'object' && !Array.isArray(value))

// Solo metadatos públicos. Nunca descarga audio, video ni letras.
async function leer(url: string, maximo: number, fetcher: Fetcher) {
  const response = await fetcher(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('Referencia no comprobada')
  if (!response.body) throw new Error('Respuesta vacía')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let texto = ''; let bytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return texto + decoder.decode()
      bytes += value.byteLength
      if (bytes > maximo) throw new Error('Respuesta demasiado grande')
      texto += decoder.decode(value, { stream: true })
    }
  } finally { await reader.cancel().catch(() => {}) }
}

// Extrae únicamente el JSON del estado del reproductor, sin ejecutar scripts.
export function extraerEstadoYouTube(html: string): Objeto | null {
  const marker = /(?:var\s+)?ytInitialPlayerResponse\s*=\s*/g.exec(html)
  if (!marker) return null
  const start = html.indexOf('{', marker.index + marker[0].length)
  if (start < 0) return null
  let profundidad = 0; let cadena = false; let escape = false
  for (let i = start; i < html.length; i++) {
    const char = html[i]
    if (cadena) {
      if (escape) escape = false
      else if (char === '\\') escape = true
      else if (char === '"') cadena = false
    } else if (char === '"') cadena = true
    else if (char === '{') profundidad++
    else if (char === '}' && --profundidad === 0) {
      try { const data: unknown = JSON.parse(html.slice(start, i + 1)); return esObjeto(data) ? data : null } catch { return null }
    }
  }
  return null
}

function coincideTitulo(actual: unknown, esperado: string) {
  if (typeof actual !== 'string') return false
  const base = claveCancionVida(esperado.replace(/\s*\(.*?\)/g, ''))
  return Boolean(base && (` ${claveCancionVida(actual)} `).includes(` ${base} `))
}

function coincideInterprete(actual: unknown, esperado: string | null) {
  if (typeof actual !== 'string' || !esperado) return false
  const canal = claveCancionVida(actual).replace(/\s/g, '')
  const artista = claveCancionVida(esperado).replace(/\s/g, '')
  return canal.includes(artista) || artista.includes(canal)
}

export async function verificarReferenciasCancion(song: CancionCatalogoVida, fetcher: Fetcher = fetch) {
  const sinComprobar = { verificada: false as const, youtubeUrl: null, spotifyUrl: null, error: 'No se pudo comprobar la referencia de video o alguno de los enlaces aportados. La ficha queda pendiente.' }
  if (!song.youtube_url || (song.spotify_url !== null && !/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/.test(song.spotify_url))) return sinComprobar
  const candidatas = [song.youtube_url, ...song.fuentes_verificacion.filter((url) => /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(url))]
  const videos = [...new Set(candidatas)].filter((url) => /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(url)).slice(0, 2)
  if (!videos.length) return sinComprobar
  try {
    if (song.spotify_url) {
      const spotify: unknown = JSON.parse(await leer(`https://open.spotify.com/oembed?url=${encodeURIComponent(song.spotify_url)}`, 65536, fetcher))
      if (!esObjeto(spotify) || !coincideTitulo(spotify.title, song.titulo)) return sinComprobar
    }
    for (const url of videos) {
      try {
        const metadata: unknown = JSON.parse(await leer(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, 65536, fetcher))
        if (!esObjeto(metadata) || !coincideTitulo(metadata.title, song.titulo) || !coincideInterprete(metadata.author_name, song.artista)) continue
        const estado = extraerEstadoYouTube(await leer(url, 2000000, fetcher))
        const disponibilidad = estado?.playabilityStatus
        const detalle = estado?.videoDetails
        if (!esObjeto(disponibilidad) || disponibilidad.status !== 'OK' || !esObjeto(detalle) || detalle.videoId !== new URL(url).searchParams.get('v') || !coincideTitulo(detalle.title, song.titulo)) continue
        return { verificada: true as const, youtubeUrl: url, spotifyUrl: song.spotify_url, error: null }
      } catch { /* Bloqueos, consentimiento o errores no certifican disponibilidad. */ }
    }
  } catch { /* Un error de red deja la ficha pendiente; no se convierte en enlace válido. */ }
  return sinComprobar
}
