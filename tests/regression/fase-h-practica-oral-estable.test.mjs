import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const speech = fs.readFileSync('components/hebreo/HebrewSpeechPractice.tsx', 'utf8')
const feedback = fs.readFileSync('lib/ui/interaction-feedback.ts', 'utf8')

test('FASE H bloque 4: práctica oral reinicia micrófono y AudioContext en cada intento', () => {
  assert.match(speech, /async function openMicrophone/)
  assert.match(speech, /await releaseMicrophone\(\)/)
  assert.match(speech, /context\.state === 'suspended'/)
  assert.match(speech, /await context\.resume\(\)/)
  assert.match(speech, /getUserMedia/)
  assert.match(speech, /echoCancellation: true/)
  assert.match(speech, /noiseSuppression: true/)
  assert.match(speech, /autoGainControl: true/)
  assert.match(speech, /drawSpectrum/)
  assert.match(speech, /recognitionRef/)
})

test('FASE H bloque 4: práctica oral tiene feedback háptico y sonoro reutilizable', () => {
  assert.match(speech, /interactionFeedback\('listen-start'\)/)
  assert.match(speech, /interactionFeedback\('listen-end'\)/)
  assert.match(speech, /interactionFeedback\(next\.score >= 75 \? 'success' : 'warning'\)/)
  assert.match(feedback, /navigator\.vibrate/)
  assert.match(feedback, /AudioContext/)
})

test('FASE H bloque 4: espectro permanece celeste y controles orales son compactos', () => {
  assert.match(speech, /voice-spectrum-active/)
  assert.match(speech, /bg-sky-500/)
  assert.match(speech, /aria-label="Escuchar pronunciación"/)
  assert.match(speech, /aria-label=\{status === 'listening' \? 'Terminar escucha' : 'Hablar'\}/)
  assert.match(speech, /aria-label="Enviar resultado"/)
})
