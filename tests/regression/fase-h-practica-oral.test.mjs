import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const speech = fs.readFileSync('components/hebreo/HebrewSpeechPractice.tsx', 'utf8')

test('FASE H bloque 4: práctica oral queda visible e independiente del examen', () => {
  assert.match(home, /HebrewSpeechPractice/)
  assert.match(home, /<HebrewProgressCoach \/><HebrewSpeechPractice \/>/)
  assert.match(speech, /Práctica oral/)
  assert.match(speech, />Palabras</)
  assert.match(speech, />Oraciones</)
  assert.doesNotMatch(speech, /saveHebrewProgressAnswer|startHebrewProgressSession/)
})

test('FASE H bloque 4: micrófono pide permiso real, captura y exige envío explícito', () => {
  assert.match(speech, /navigator\.mediaDevices\?\.getUserMedia/)
  assert.match(speech, /SpeechRecognition/)
  assert.match(speech, /webkitSpeechRecognition/)
  assert.match(speech, /interimResults = true/)
  assert.match(speech, /Habla cuando veas moverse el espectro/)
  assert.match(speech, /Enviar resultado/)
  assert.match(speech, /submitResult/)
  assert.match(speech, /micrófono está bloqueado/)
})

test('FASE H bloque 4: práctica oral usa banco amplio derivado de todo lo aprendido', () => {
  assert.match(speech, /HEBREW_PRACTICE_QUESTIONS/)
  assert.match(speech, /HEBREW_USEFUL_PHRASES/)
  assert.match(speech, /buildWordPrompts/)
  assert.match(speech, /buildSentencePrompts/)
  assert.match(speech, /Génesis 1:1/)
  assert.match(speech, /Shemá · Deuteronomio 6:4/)
  assert.match(speech, /Salmo 23:1/)
})

test('FASE H bloque 4: espectro de voz reacciona al micrófono real', () => {
  assert.match(speech, /createAnalyser/)
  assert.match(speech, /getByteFrequencyData/)
  assert.match(speech, /requestAnimationFrame/)
  assert.match(speech, /Espectro de voz/)
  assert.match(speech, /Habla cuando veas moverse el espectro/)
})

test('FASE H bloque 4: feedback explica qué parte reconocida necesita repetirse sin fingir fonética', () => {
  assert.match(speech, /detailedFeedback/)
  assert.match(speech, /Según lo reconocido, revisa:/)
  assert.match(speech, /el navegador entendió/)
  assert.match(speech, /no quedó reconocida/)
  assert.match(speech, /Se escuchó muy bien/)
})

test('FASE H bloque 4: pronunciación ofrece guía y feedback sin guardar nota objetiva', () => {
  assert.match(speech, /speechSynthesis/)
  assert.match(speech, /utterance\.lang = 'he-IL'/)
  assert.match(speech, /result\.score/)
  assert.match(speech, /Intentar otra vez/)
  assert.doesNotMatch(speech, /saveHebrewProgressAnswer|startHebrewProgressSession/)
})
