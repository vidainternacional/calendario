import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { cargarModulo } from './seguridad-real-loader.mjs'
const util = cargarModulo('lib/musica/catalogo-vida.ts')
const source = ts.transpileModule(fs.readFileSync('lib/musica/verificar-referencias.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const modulo = { exports: {} }
vm.runInNewContext(source, { module: modulo, exports: modulo.exports, URL, TextDecoder, AbortSignal, Set, require(name) { if (name === 'server-only') return {}; if (name === './catalogo-vida') return util; throw Error(name) } })
const { extraerEstadoYouTube, verificarReferenciasCancion } = modulo.exports
const song = { titulo: 'Desde mi interior', artista: 'Hillsong en Español', youtube_url: 'https://www.youtube.com/watch?v=DGgrObVS4a0', spotify_url: 'https://open.spotify.com/track/3QM0CGUsH28NaPqGIyXq0a', fuentes_verificacion: [] }
function fetcher({ status = 'OK', author = song.artista, titulo = song.titulo, html = null, error = false, track = song.titulo } = {}) {
  return async (url) => {
    if (error) throw Error('Red bloqueada')
    if (url.includes('open.spotify.com/oembed')) return Response.json({ title: track })
    if (url.includes('/oembed')) return Response.json({ title: titulo, author_name: author })
    return new Response(html ?? `var ytInitialPlayerResponse = ${JSON.stringify({ playabilityStatus: { status }, videoDetails: { videoId: 'DGgrObVS4a0', title: titulo } })};`)
  }
}

test('YouTube confirma identidad, intérprete y estado OK; Spotify confirma la pista antes de admitir enlaces', async () => {
  const r = await verificarReferenciasCancion(song, fetcher())
  assert.equal(r.verificada, true)
  assert.equal(r.youtubeUrl, song.youtube_url)
  assert.equal(r.spotifyUrl, song.spotify_url)
})

test('video no disponible, privado o que requiere login queda pendiente', async () => {
  for (const status of ['ERROR', 'UNPLAYABLE', 'LOGIN_REQUIRED']) assert.equal((await verificarReferenciasCancion(song, fetcher({ status }))).verificada, false)
})

test('error de red, consentimiento o respuesta incompleta no se convierte en verificación positiva', async () => {
  for (const options of [{ error: true }, { html: '<html>Consentimiento</html>' }, { html: 'ytInitialPlayerResponse = {};' }]) assert.equal((await verificarReferenciasCancion(song, fetcher(options))).verificada, false)
})

test('rechaza otro título, otro intérprete o una pista Spotify diferente', async () => {
  for (const options of [{ titulo: 'Otra obra' }, { author: 'Otro intérprete' }, { track: 'Otra pista' }]) assert.equal((await verificarReferenciasCancion(song, fetcher(options))).verificada, false)
})

test('rechaza enlaces faltantes o manipulados sin contactar servidores arbitrarios', async () => {
  let llamadas = 0
  for (const alteracion of [{ youtube_url: null }, { youtube_url: 'http://127.0.0.1/' }, { spotify_url: 'https://example.com/track/x' }]) {
    assert.equal((await verificarReferenciasCancion({ ...song, ...alteracion }, async () => { llamadas++; throw Error() })).verificada, false)
  }
  assert.equal(llamadas, 0)
})

test('lee JSON con llaves en cadenas sin ejecutar scripts del proveedor', () => {
  const result = extraerEstadoYouTube('var ytInitialPlayerResponse = {"playabilityStatus":{"status":"OK"},"texto":"} { \\\""}; throw new Error("No ejecutar");')
  assert.equal(result.playabilityStatus.status, 'OK')
  assert.equal(extraerEstadoYouTube('ytInitialPlayerResponse = {incorrecto};'), null)
})


test('una referencia de video verificada puede incorporarse sin inventar Spotify ausente', async () => {
  const result = await verificarReferenciasCancion({ ...song, spotify_url: null }, fetcher())
  assert.equal(result.verificada, true)
  assert.equal(result.spotifyUrl, null)
})
