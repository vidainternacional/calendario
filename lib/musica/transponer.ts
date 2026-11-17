const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTAS: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, 'B#': 0, Fb: 4, 'E#': 5 }
const ACORDE = /^([A-G](?:#|b)?)((?:maj|min|m|dim|aug|sus|add|M|ø|°|\d+|[#b+\-]\d*|\((?:add|sus)?[\d#b+,\-]+\))*)(?:\/([A-G](?:#|b)?))?$/
function raiz(nota: string, semitonos: number) {
  const indice = NOTAS[nota]
  return indice === undefined ? nota : (nota.includes('b') ? BEMOLES : SOSTENIDOS)[((indice + semitonos) % 12 + 12) % 12]
}
export function transportarTono(tono: string, semitonos: number) {
  const match = tono.trim().match(/^([A-G](?:#|b)?)(.*)$/)
  return match ? raiz(match[1], semitonos) + match[2] : tono
}
function tokenAcorde(token: string, semitonos: number): string | null {
  const prefijo = token.match(/^[\[(|]+/)?.[0] || ''
  const sufijo = token.match(/[\]),;|]+$/)?.[0] || ''
  // Los paréntesis internos pertenecen a extensiones como D13(b5).
  let core = token.slice(prefijo.length, token.length - sufijo.length)
  let tail = sufijo
  if (!ACORDE.test(core) && tail.startsWith(')')) { core += ')'; tail = tail.slice(1) }
  const match = core.match(ACORDE)
  if (!match) return null
  return prefijo + raiz(match[1], semitonos) + match[2] + (match[3] ? '/' + raiz(match[3], semitonos) : '') + tail
}
export function transportarCifrado(texto: string, semitonos: number) {
  return texto.replace(/\\n/g, '\n').split('\n').map((linea) => {
    const partes = linea.split(/(\s+)/)
    const acordes = partes.filter((token) => tokenAcorde(token, 0) !== null)
    const sinEtiqueta = linea.replace(/^\s*(?:intro|estrofa|verso|coro|pre.?coro|puente|final|interludio|instrumental)\s*:\s*/i, '')
    const esLineaAcordes = sinEtiqueta.split(/\s+/).filter(Boolean).every((token) => tokenAcorde(token, 0) !== null || /^(?:[-/|:*]+|x\d+)$/i.test(token))
    const estructura = acordes.length >= 2 && /\s-\s/.test(linea)
    if (esLineaAcordes || estructura) return partes.map((token) => tokenAcorde(token, semitonos) ?? token).join('')
    // En una línea de letra solo se transporta cifrado marcado, preservando palabras como «A».
    return linea.replace(/\[([^\]\n]+)\]/g, (todo, acorde: string) => tokenAcorde(acorde, semitonos) === null ? todo : '[' + tokenAcorde(acorde, semitonos) + ']')
  }).join('\n')
}
