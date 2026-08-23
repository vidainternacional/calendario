import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const keyboard = fs.readFileSync('components/hebreo/HebrewKeyboardDock.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')

test('FASE H teclado: conserva guardia de sesión y se despliega desde Inicio dentro de progreso', () => {
  assert.match(page, /<HebrewLearningHome \/>/)
  assert.doesNotMatch(page, /HebrewKeyboardDock/)
  assert.match(page, /if \(!user\) redirect\('\/login\?next=\/estudios\/hebreo'\)/)
  assert.match(home, /import HebrewKeyboardDock/)
  assert.match(home, /type PracticePanelId = 'evaluation' \| 'speech' \| 'keyboard'/)
  assert.doesNotMatch(home, />Herramientas</)
  assert.match(home, /keyboard: \{ title: 'Teclado hebreo'/)
  assert.match(home, /openPractice === 'keyboard'/)
  assert.match(home, /<HebrewKeyboardDock enabled \/>/)
})

test('FASE H teclado: queda fusionado con la superficie de la app y no como panel externo', () => {
  assert.match(keyboard, /if \(!enabled\) return null/)
  assert.match(keyboard, /className="w-full pb-2 pt-1 text-left"/)
  assert.match(keyboard, /Practica tu escritura/)
  assert.match(keyboard, /rounded-\[20px\] border border-slate-200 bg-slate-50/)
  assert.match(home, /border-t border-slate-100 pb-5 pt-4/)
  assert.doesNotMatch(keyboard, /bg-\[#f9f9fb\]|fixed bottom-|fixed inset-|z-\[6[89]\]|onDisable/)
})

test('FASE H teclado: conserva las 22 letras y separa las cinco formas Sofit', () => {
  for (const letter of ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת']) assert.match(keyboard, new RegExp(letter))
  for (const finalForm of ['ך', 'ם', 'ן', 'ף', 'ץ']) assert.match(keyboard, new RegExp(finalForm))
  assert.match(keyboard, /type KeyboardMode = 'letters' \| 'sofit' \| 'niqqud'/)
  assert.match(keyboard, /סופית · Sofit/)
})

test('FASE H teclado: niqqud incluye vocales, Dagesh y signos avanzados de escritura', () => {
  for (const name of ['Sheva', 'Hataf Segol', 'Hataf Pataj', 'Hataf Qamats', 'Hiriq', 'Tsere', 'Segol', 'Pataj', 'Qamats', 'Qamats Qatan', 'Holam', 'Holam Haser', 'Qubuts', 'Dagesh', 'Meteg', 'Rafe', 'Punto Shin', 'Punto Sin']) assert.match(keyboard, new RegExp(name))
  for (const name of ['Maqaf', 'Paseq', 'Sof pasuq']) assert.match(keyboard, new RegExp(name))
})

test('FASE H teclado: puede escribir en el último input o textarea enfocado', () => {
  assert.match(keyboard, /document\.addEventListener\('focusin', rememberTarget\)/)
  assert.match(keyboard, /lastTargetRef\.current = event\.target/)
  assert.match(keyboard, /setNativeValue\(target, next\)/)
  assert.match(keyboard, /target\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/)
})

test('FASE H teclado: inicia directamente con práctica libre y tres modos didácticos', () => {
  assert.match(keyboard, /data-hebrew-practice="true"/)
  assert.match(keyboard, /אותיות · Letras/)
  assert.match(keyboard, /סופית · Sofit/)
  assert.match(keyboard, /נִקּוּד · Niqqud/)
  assert.match(keyboard, /useState<KeyboardMode>\('letters'\)/)
})

test('FASE H teclado: no persiste el texto de práctica ni pretende cambiar el teclado del sistema', () => {
  assert.match(keyboard, /no guarda lo que escribes/)
  assert.doesNotMatch(keyboard, /supabase|localStorage|sessionStorage|speechSynthesis|navigator\.clipboard/)
})
