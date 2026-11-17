// Comprobación editorial de solo lectura, exclusiva del Preview del catálogo.
// En main y desarrollo no hace solicitudes ni modifica el catálogo.
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createHash } from 'node:crypto'
if (process.env.VERCEL !== '1' || process.env.VERCEL_GIT_COMMIT_REF !== 'agent/catalogo-canciones-vida-20261117') process.exit(0)
const transcribir = (path, dependencias = {}) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const modulo = { exports: {} }
  vm.runInNewContext(outputText, { module: modulo, exports: modulo.exports, URL, Set, TextDecoder, AbortSignal, fetch, require(name) { if (!(name in dependencias)) throw Error('Dependencia no permitida'); return dependencias[name] } })
  return modulo.exports
}
const util = transcribir('lib/musica/catalogo-vida.ts')
const { verificarReferenciasCancion } = transcribir('lib/musica/verificar-referencias.ts', { 'server-only': {}, './catalogo-vida': util })
const catalogo = JSON.parse(fs.readFileSync('data/canciones-vida-20261117.json', 'utf8'))
const candidatas = catalogo.filter((song) => song.estado === 'identificada' && song.youtube_url && song.spotify_url)
const resultados = []
for (let inicio = 0; inicio < candidatas.length; inicio += 2) {
  const lote = await Promise.all(candidatas.slice(inicio, inicio + 2).map(async (song) => {
    const solicitudes = []
    const fetchObservado = async (url, options) => {
      try {
        const response = await fetch(url, options)
        solicitudes.push({ proveedor: new URL(url).hostname, status: response.status })
        return response
      } catch (error) {
        solicitudes.push({ proveedor: new URL(url).hostname, error: error instanceof Error ? error.name : 'Error de conexión' })
        throw error
      }
    }
    const r = await verificarReferenciasCancion(song, fetchObservado)
    return { id: song.id, titulo: song.titulo, verificada: r.verificada, youtube_url: r.youtubeUrl, spotify_url: r.spotifyUrl, motivo: r.error, solicitudes }
  }))
  resultados.push(...lote)
  for (const item of lote) console.log('[Catálogo VIDA · ficha] ' + JSON.stringify(item))
  console.log(`[Catálogo VIDA] Comprobadas ${resultados.length}/${candidatas.length}; admitidas ${resultados.filter((row) => row.verificada).length}.`)
}
const informe = { fecha: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA || null, alcance: 'Metadatos Spotify e identidad y estado OK del reproductor de YouTube desde el servidor; no reproduce audio ni certifica todas las regiones.', candidatas: candidatas.length, verificadas: resultados.filter((row) => row.verificada).length, resultados }
const certificado = { fecha: informe.fecha, catalogoSha256: createHash('sha256').update(JSON.stringify(catalogo)).digest('hex'), canciones: resultados.filter((item) => item.verificada).map(({ id, youtube_url, spotify_url }) => ({ id, youtube_url, spotify_url })) }
fs.writeFileSync('data/canciones-vida-verificadas.json', JSON.stringify(certificado, null, 2) + '\n')
console.log('[Catálogo VIDA · resumen] ' + JSON.stringify({ fecha: informe.fecha, candidatas: informe.candidatas, verificadas: informe.verificadas, hash: certificado.catalogoSha256 }))
console.log(`[Catálogo VIDA] ${informe.verificadas} referencias comprobadas; ${informe.candidatas - informe.verificadas} pendientes. Sin escrituras en Supabase.`)
