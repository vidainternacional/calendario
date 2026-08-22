import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const review = fs.readFileSync('components/hebreo/ReviewExplorer.tsx', 'utf8')

test('FASE H repaso: Aprender abre Repaso como módulo real dentro del Bloque 1', () => {
  assert.match(home, /import ReviewExplorer/)
  assert.match(home, /id: 'review',[\s\S]*?short: 'Repaso'/)
  assert.match(home, /section\.id === 'grammar' \? <GrammarExplorer \/> : <ReviewExplorer \/>/)
})

test('FASE H repaso: distingue repaso de examen y mezcla áreas ya estudiadas', () => {
  assert.match(review, /Repaso no es un examen/)
  for (const label of ['Mixto', 'Letras', 'Vocales', 'Palabras', 'Lectura', 'Reglas', 'Verbos']) assert.match(review, new RegExp(label))
  for (const area of ["area: 'letters'", "area: 'vowels'", "area: 'words'", "area: 'reading'", "area: 'rules'", "area: 'verbs'"]) assert.match(review, new RegExp(area))
  assert.match(review, /MIXED_SESSION_IDS/)
  assert.match(review, /'verb-qatal-yiqtol'/)
})

test('FASE H repaso: usa sesiones cortas y autoevaluación explícita', () => {
  assert.match(review, /slice\(0, 8\)/)
  assert.match(review, /Mostrar respuesta/)
  assert.match(review, /Lo sé/)
  assert.match(review, /Necesito practicar/)
  assert.match(review, /Repasar después/)
  assert.match(review, /Solo esta sesión/)
})

test('FASE H repaso: incluye práctica de escritura compatible con el teclado hebreo', () => {
  assert.match(review, /data-hebrew-practice="true"/)
  assert.match(review, /placeholder="כתוב כאן…"/)
  assert.match(review, /activar el teclado hebreo de VIDA arriba/)
  assert.match(review, /writingTarget/)
})

test('FASE H repaso: incorpora niqqud avanzado y transformaciones nominales verificadas', () => {
  for (const id of ['sheva-vocal', 'sheva-silent', 'qamats-qatan', 'furtive-pataj', 'possessive-beni', 'possessive-aviv', 'construct-devar', 'construct-bnei']) {
    assert.match(review, new RegExp(`id: '${id}'`))
  }
  for (const form of ['בְּרֵאשִׁית', 'מַלְכָּה', 'כָּל', 'רוּחַ', 'בְּנִי', 'אָבִיו', 'דָּבָר → דְּבַר', 'בְּנֵי']) {
    assert.match(review, new RegExp(form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('FASE H repaso: practica Qal sin convertir morfología en pasado futuro mecánico', () => {
  for (const id of ['verb-qatal-yiqtol', 'verb-qatal-1cs', 'verb-yiqtol-1cs', 'verb-imperative', 'verb-participle', 'verb-inf-construct', 'verb-wayyiqtol', 'verb-weqatal']) {
    assert.match(review, new RegExp(`id: '${id}'`))
  }
  for (const form of ['אָמַרְתִּי', 'אֹמַר', 'אֱמֹר', 'אֹמֵר', 'לֵאמֹר', 'וַיֹּאמֶר', 'וְאָמַרְתָּ']) {
    assert.match(review, new RegExp(form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(review, /no equivale automáticamente a futuro/i)
  assert.match(review, /No memorices la equivalencia automática pasado\/futuro/)
  assert.match(review, /no es una fórmula de «ו \+ futuro = pasado»/i)
})

test('FASE H repaso: el resumen describe únicamente la sesión actual', () => {
  assert.match(review, /Sesión terminada/)
  assert.match(review, /No se guarda como progreso/)
  assert.match(review, /counts\.know/)
  assert.match(review, /counts\.practice/)
  assert.match(review, /counts\.later/)
})

test('FASE H repaso: no introduce persistencia ni audio falso', () => {
  assert.doesNotMatch(review, /supabase|localStorage|sessionStorage|speechSynthesis|new Audio|Audio\(/)
})
