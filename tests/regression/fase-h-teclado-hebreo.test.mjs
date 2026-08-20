import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const keyboard = fs.readFileSync('components/hebreo/HebrewKeyboardDock.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')

test('FASE H teclado: conserva guardia de sesión y se controla desde el inicio', () => {
  assert.match(page, /<HebrewLearningHome \/>/)
  assert.doesNotMatch(page, /HebrewKeyboardDock/)
  assert.match(page, /if \(!user\) redirect\('\/login\?next=\/estudios\/hebreo'\)/)
  assert.match(home, /import HebrewKeyboardDock/)
  assert.match(home, /useState\(false\)/)
  assert.match(home, /KeyboardToolToggle/)
  assert.match(home, /Activar/)
  assert.match(home, /Desactivar/)
  assert.match(home, /<HebrewKeyboardDock enabled=\{keyboardEnabled\}/)
})

test('FASE H teclado: no flota hasta que el usuario lo activa y queda más arriba', () => {
  assert.match(keyboard, /if \(!enabled\) return null/)
  assert.match(keyboard, /bottom-\[calc\(env\(safe-area-inset-bottom\)\+148px\)\]/)
  assert.match(keyboard, /bottom-\[calc\(env\(safe-area-inset-bottom\)\+84px\)\]/)
  assert.match(keyboard, /onDisable/)
})

test('FASE H teclado: conserva letras hebreas formas finales y niqqud', () => {
  for (const letter of ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת']) assert.match(keyboard, new RegExp(letter))
  for (const finalForm of ['ך', 'ם', 'ן', 'ף', 'ץ']) assert.match(keyboard, new RegExp(finalForm))
  for (const name of ['Sheva', 'Hataf Segol', 'Hataf Pataj', 'Hataf Qamats', 'Hiriq', 'Tsere', 'Segol', 'Pataj', 'Qamats', 'Holam', 'Qubuts', 'Dagesh']) assert.match(keyboard, new RegExp(name))
})

test('FASE H teclado: puede escribir en el último input o textarea enfocado', () => {
  assert.match(keyboard, /document\.addEventListener\('focusin', rememberTarget\)/)
  assert.match(keyboard, /lastTargetRef\.current = event\.target/)
  assert.match(keyboard, /setNativeValue\(target, next\)/)
  assert.match(keyboard, /target\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/)
  assert.match(keyboard, /target\.form\?\.requestSubmit\(\)/)
})

test('FASE H teclado: incluye práctica libre y dos modos didácticos', () => {
  assert.match(keyboard, /Práctica de escritura/)
  assert.match(keyboard, /data-hebrew-practice="true"/)
  assert.match(keyboard, /אותיות · Letras/)
  assert.match(keyboard, /נִקּוּד · Vocales/)
  assert.match(keyboard, /useState<KeyboardMode>\('letters'\)/)
})

test('FASE H teclado: no pretende forzar el teclado del sistema ni persiste datos', () => {
  assert.match(keyboard, /VIDA no puede cambiar automáticamente el idioma del teclado del sistema/)
  assert.doesNotMatch(keyboard, /supabase|localStorage|sessionStorage|speechSynthesis|navigator\.clipboard/)
})
