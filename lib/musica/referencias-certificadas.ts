import 'server-only'
import { createHash } from 'node:crypto'
import catalogo from '@/data/canciones-vida-20261117.json'
import comprobacion from '@/data/canciones-vida-verificadas.json'
import type { CancionCatalogoVida } from './catalogo-vida'

type Certificado = { fecha: string | null; catalogoSha256: string | null; canciones: { id: string; youtube_url: string; spotify_url: string }[] }
const hashCatalogo = createHash('sha256').update(JSON.stringify(catalogo)).digest('hex')

export function certificadoVigente(certificado: Certificado, hash: string, ahora = Date.now()) {
  const fecha = Date.parse(certificado.fecha || '')
  return certificado.catalogoSha256 === hash && Number.isFinite(fecha) && fecha <= ahora + 300000 && ahora - fecha <= 86400000
}

export function cargaCatalogoDisponible() {
  return certificadoVigente(comprobacion, hashCatalogo) && comprobacion.canciones.length > 0
}

export function obtenerReferenciaCertificada(song: CancionCatalogoVida, certificado: Certificado = comprobacion, hash: string = hashCatalogo, ahora = Date.now()) {
  if (!certificadoVigente(certificado, hash, ahora)) return null
  const entrada = certificado.canciones.find((item) => item.id === song.id)
  if (!entrada || entrada.spotify_url !== song.spotify_url || !/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/.test(entrada.spotify_url)) return null
  if (!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(entrada.youtube_url) || ![song.youtube_url, ...song.fuentes_verificacion].includes(entrada.youtube_url)) return null
  return entrada
}
