import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const translatorUi = await readFile(new URL('../../components/hebreo/HebrewTranslator.tsx', import.meta.url), 'utf8')
const route = await readFile(new URL('../../app/api/estudios/hebreo/traducir/route.ts', import.meta.url), 'utf8')
const contract = await readFile(new URL('../../lib/hebreo/translator.ts', import.meta.url), 'utf8')
const page = await readFile(new URL('../../app/(app)/estudios/hebreo/page.tsx', import.meta.url), 'utf8')

test('FASE H integra un traductor puntual sin convertirlo en Estudio Profundo', () => {
  assert.match(page, /<HebrewTranslator\s*\/>/)
  assert.match(translatorUi, /Escribe una palabra o frase/)
  assert.match(translatorUi, /Español ⇄ עברית/)
  assert.match(translatorUi, /Significado/)
  assert.match(translatorUi, /Traducción/)
  assert.match(translatorUi, /Escuchar hebreo/)
  assert.match(translatorUi, /Copiar/)
  assert.doesNotMatch(translatorUi, /Strong|morfolog|transliteraci|ocurrencias/i)
})

test('la dirección se detecta por escritura hebrea y solo admite es/he', () => {
  assert.match(contract, /[\\u0590-\\u05FF]/)
  assert.match(contract, /source: 'he', target: 'es'/)
  assert.match(contract, /source: 'es', target: 'he'/)
  assert.match(contract, /maxLength = 1000/)
})

test('palabras exactas priorizan el diccionario bíblico y las frases usan VIDA AI', () => {
  assert.match(route, /biblical_lexical_entries/)
  assert.match(route, /biblical_hebrew_spanish_glosses/)
  assert.match(route, /FINAL_SPANISH_STATUSES/)
  assert.match(route, /source: 'dictionary'/)
  assert.match(route, /source: 'translator'/)
  assert.match(route, /kind === 'word'/)
  assert.match(route, /vidaAI\(/)
  assert.match(route, /task: 'interpretar_busqueda_biblica'/)
})

test('la traducción exige sesión y nunca expone secretos ni análisis académico', () => {
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /status: 401/)
  assert.match(route, /sin explicaciones, sin transliteración, sin análisis gramatical/)
  assert.doesNotMatch(translatorUi, /GEMINI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY/)
})
