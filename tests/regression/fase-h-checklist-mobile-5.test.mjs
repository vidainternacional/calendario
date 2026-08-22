import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')

test('FASE H checklist 5: Teclado hebreo es una acción directa sin grupo Herramientas', () => {
  assert.match(home, /aria-label="Práctica"/)
  assert.doesNotMatch(home, />Herramientas</)
  assert.match(home, />Teclado hebreo</)
  assert.equal((home.match(/>Teclado hebreo</g) ?? []).length, 1)
  assert.match(home, /onClick=\{\(\) => setKeyboardEnabled\(value => !value\)\}/)
  assert.match(home, /aria-pressed=\{keyboardEnabled\}/)
  assert.match(home, /rounded-\[22px\] border border-slate-200 bg-white/)
  assert.match(home, /\{keyboardEnabled \? 'Desactivar' : 'Activar'\}/)
})

test('FASE H checklist 5: progreso sigue sin fingir historial persistente antes de su bloque autorizado', () => {
  assert.match(home, /Prueba tu progreso/)
  assert.match(home, /La persistencia de progreso todavía no está activa\./)
  assert.doesNotMatch(home, /localStorage|sessionStorage|supabase/)
})
