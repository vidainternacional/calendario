import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')

test('FASE H bloque 4: el espectro oral responde al nivel real del micrófono', () => {
  assert.match(coach, /getByteTimeDomainData/)
  assert.match(coach, /const rms = Math\.sqrt/)
  assert.match(coach, /const loudness =/)
  assert.match(coach, /setLevels\(IDLE_LEVELS\.map/)
  assert.doesNotMatch(coach, /@keyframes oralPulse/)
  assert.doesNotMatch(coach, /animation: oralPulse/)
})

test('FASE H bloque 4: Safari no duplica error y cierre del mismo intento', () => {
  assert.match(coach, /voiceAttemptFailedRef/)
  assert.match(coach, /voiceSubmittedRef/)
  assert.match(coach, /voiceRetryRef/)
  assert.match(coach, /VOICE_RETRY_DELAY_MS/)
  assert.match(coach, /code === 'aborted' && capturedRef\.current\.trim\(\)/)
  assert.match(coach, /if \(voiceAttemptFailedRef\.current \|\| voiceSubmittedRef\.current\) return/)
  assert.match(coach, /Reiniciando el micrófono…/)
})

test('FASE H bloque 4: la respuesta oral confirma envío y resultado antes de avanzar', () => {
  assert.match(coach, /Respuesta enviada · correcta/)
  assert.match(coach, /Respuesta enviada · necesita repaso/)
  assert.match(coach, /CheckCircle2/)
  assert.match(coach, /XCircle/)
  assert.match(coach, /Enviando y comprobando…/)
  assert.match(coach, /await new Promise\(resolve => window\.setTimeout\(resolve, 760\)\)/)
})

test('FASE H bloque 4: la sesión de audio de iOS se libera entre intentos', () => {
  assert.match(coach, /audioSession/)
  assert.match(coach, /audioSession\.type = 'playback'/)
  assert.match(coach, /audioSession\.type = 'auto'/)
  assert.match(coach, /await releaseMicrophone\(\)/)
})