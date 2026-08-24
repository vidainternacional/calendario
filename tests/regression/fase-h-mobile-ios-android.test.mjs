import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const store = fs.readFileSync('lib/hebreo/progress-store.ts', 'utf8')

test('FASE H bloque 4: reconocimiento oral admite Safari iOS y Chrome Android sin deteccion por plataforma', () => {
  assert.match(coach, /SpeechRecognition\?: SpeechRecognitionCtor/)
  assert.match(coach, /webkitSpeechRecognition\?: SpeechRecognitionCtor/)
  assert.match(coach, /speechWindow\.SpeechRecognition \?\? speechWindow\.webkitSpeechRecognition/)
  assert.match(coach, /navigator\.mediaDevices\?\.getUserMedia/)
  assert.match(coach, /window\.AudioContext \?\? .*webkitAudioContext/)
  assert.match(coach, /instance\.lang = 'he-IL'/)
  assert.doesNotMatch(coach, /navigator\.userAgent|iPhone|Android.*userAgent|userAgent.*Android/)
})

test('FASE H bloque 4: espectro usa señal real y no una animacion decorativa independiente del microfono', () => {
  assert.match(coach, /getByteTimeDomainData/)
  assert.match(coach, /Math\.sqrt\(sumSquares \/ data\.length\)/)
  assert.doesNotMatch(coach, /@keyframes oralPulse|animation: oralPulse/)
})

test('FASE H bloque 4: cierre de evaluacion persiste sesion, respuestas y vuelve a cargar progreso', () => {
  assert.match(coach, /saveHebrewProgressAnswer/)
  assert.match(coach, /finishHebrewProgressSession\(sessionId\)/)
  assert.match(coach, /setFinished\(true\)/)
  assert.match(coach, /await refresh\(\)/)
  assert.match(store, /biblical_hebrew_progress_sessions/)
  assert.match(store, /biblical_hebrew_progress_answers/)
  assert.match(store, /status, ended_at: now, updated_at: now/)
  assert.match(store, /order\('started_at', \{ ascending: false \}\)/)
  assert.match(store, /order\('answered_at', \{ ascending: false \}\)/)
})

test('FASE H bloque 4: resultado oral se guarda antes de avanzar y conserva correcto o repaso', () => {
  assert.match(coach, /const isCorrect = score >= 85/)
  assert.match(coach, /reviewRequested: !isCorrect/)
  assert.match(coach, /await saveHebrewProgressAnswer/)
  assert.match(coach, /await advanceAfterSave\(\)/)
})
