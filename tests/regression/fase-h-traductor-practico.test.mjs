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

test('el proveedor queda server-only, autenticado y con timeout', () => {
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /status: 401/)
  assert.match(route, /process\.env\.AZURE_TRANSLATOR_KEY/)
  assert.match(route, /Ocp-Apim-Subscription-Key/)
  assert.match(route, /Ocp-Apim-Subscription-Region/)
  assert.match(route, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/)
  assert.doesNotMatch(translatorUi, /AZURE_TRANSLATOR_KEY|Ocp-Apim-Subscription-Key/)
})
