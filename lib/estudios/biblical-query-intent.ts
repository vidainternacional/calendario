import { normalizeBiblicalSearchQuery, tokenizeBiblicalSearchQuery } from './biblical-search-ranking'

const QUESTION_WORDS = new Set(['dime', 'hablame', 'explicame', 'quiero', 'saber', 'tema', 'acerca'])

/** La afinidad de palabras sirve para sugerir, no para certificar una respuesta directa. */
export function esTemaDirecto(rawQuery: string, values: string[]) {
  const query = normalizeBiblicalSearchQuery(rawQuery)
  if (!query) return false
  const normalized = values.map(normalizeBiblicalSearchQuery).filter(Boolean)
  if (normalized.includes(query)) return true

  // No quitar una negación para resolver otra pregunta. Sus alternativas siguen disponibles.
  if (/\b(no|nunca|jamas|sin)\b/.test(query)) return false
  const meaningful = (value: string) => [...new Set([
    ...tokenizeBiblicalSearchQuery(value).filter(token => !QUESTION_WORDS.has(token)),
    ...(/\bfe\b/.test(value) ? ['fe'] : []),
  ])]
  const tokens = meaningful(query)
  if (!tokens.length) return false
  return normalized.some(value => {
    const valueTokens = new Set(meaningful(value))
    return tokens.length === valueTokens.size && tokens.every(token => valueTokens.has(token))
  })
}
