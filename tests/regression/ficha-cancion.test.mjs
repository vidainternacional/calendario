import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { cargarModulo } from './seguridad-real-loader.mjs'
const catalogo = JSON.parse(fs.readFileSync('data/canciones-vida-20261117.json', 'utf8'))
const hash = createHash('sha256').update(JSON.stringify(catalogo)).digest('hex')
const modulo = cargarModulo('lib/musica/referencias-certificadas.ts', {
  'server-only': {}, 'node:crypto': { createHash },
  '@/data/canciones-vida-20261117.json': catalogo,
  '@/data/canciones-vida-verificadas.json': { fecha: null, catalogoSha256: null, canciones: [] },
})
const song = catalogo.find((item) => item.estado === 'identificada' && item.youtube_url && item.spotify_url)
const ahora = Date.parse('2026-11-17T17:00:00Z')
const certificado = { fecha: '2026-11-17T16:00:00Z', catalogoSha256: hash, canciones: [{ id: song.id, youtube_url: song.youtube_url, spotify_url: song.spotify_url }] }

test('usa la comprobación editorial reciente para el catálogo exacto sin depender de llamadas externas del guardado', () => {
  const r = modulo.obtenerReferenciaCertificada(song, certificado, hash, ahora)
  assert.equal(r.youtube_url, song.youtube_url)
  assert.equal(r.spotify_url, song.spotify_url)
})

test('certificado vencido, ausente, futuro o de otro catálogo no autoriza fichas', () => {
  for (const changes of [{ fecha: null }, { fecha: '2026-11-15T00:00:00Z' }, { fecha: '2026-11-18T00:00:00Z' }, { catalogoSha256: 'otro' }, { canciones: [] }]) assert.equal(modulo.obtenerReferenciaCertificada(song, { ...certificado, ...changes }, hash, ahora), null)
})

test('un ID, URL o pista fuera del manifiesto no se acepta aunque se inyecte en el certificado', () => {
  for (const changes of [{ id: 'ajeno' }, { youtube_url: 'https://example.com/video' }, { spotify_url: 'https://open.spotify.com/track/1111111111111111111111' }]) {
    const c = { ...certificado, canciones: [{ ...certificado.canciones[0], ...changes }] }
    assert.equal(modulo.obtenerReferenciaCertificada(song, c, hash, ahora), null)
  }
})
