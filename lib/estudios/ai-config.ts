export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash'
export const ESTUDIO_PROMPT_VERSION = 'fase-d-2026-07-29-v1'
export const ESTUDIO_SOURCE_VERSION = 'sin-recuperacion-v1'

const MODELOS_RETIRADOS = new Set([
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
])

export const ESTUDIO_RESULTADO_KEYS = [
  'texto_original',
  'transliteracion',
  'traduccion_literal',
  'traduccion_interpretativa',
  'comparacion_versiones',
  'contexto_historico',
  'analisis_linguistico',
  'que_quiso_comunicar',
  'que_no_quiso_decir',
  'explicacion',
  'reflexion',
] as const

export type EstudioResultadoKey = typeof ESTUDIO_RESULTADO_KEYS[number]
export type EstudioResultadoValidado = Record<EstudioResultadoKey, string>

export const ESTUDIO_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...ESTUDIO_RESULTADO_KEYS],
  properties: Object.fromEntries(
    ESTUDIO_RESULTADO_KEYS.map((key) => [key, {
      type: 'string',
      description: 'Contenido claro, responsable y sin citas ni datos inventados.',
    }])
  ),
} as const

export function obtenerModeloEstudio() {
  const model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim()
  return {
    model,
    retirado: MODELOS_RETIRADOS.has(model),
  }
}

export function validarResultadoEstudio(value: unknown): EstudioResultadoValidado | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const resultado = {} as EstudioResultadoValidado

  for (const key of ESTUDIO_RESULTADO_KEYS) {
    const contenido = record[key]
    if (typeof contenido !== 'string' || !contenido.trim()) return null
    resultado[key] = contenido.trim()
  }

  return resultado
}
