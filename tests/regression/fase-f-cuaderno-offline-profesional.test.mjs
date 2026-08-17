import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const shell = fs.readFileSync('public/offline/notas.html', 'utf8')

test('FASE F: el cold-start offline conserva la identidad del Cuaderno central', () => {
  assert.match(shell, /<title>Cuaderno · Vida Internacional<\/title>/)
  assert.match(shell, /<h1>Cuaderno<\/h1>/)
  assert.match(shell, /Buscar en todo el cuaderno/)
  assert.match(shell, /button\.className = `card/)
  assert.doesNotMatch(shell, /<h1>Notas bíblicas<\/h1>/)
})

test('FASE F: el editor offline ofrece las mismas familias de herramientas esenciales', () => {
  for (const label of ['Título','Negrita','Cursiva','Lista','Numerada','Tareas','Cita','Separador','Fecha','Referencia','Vista de lectura','Imprimir / PDF']) assert.match(shell, new RegExp(label))
  assert.match(shell, /id="format-tools"/)
  assert.match(shell, /Selecciona texto y toca una herramienta/)
  assert.match(shell, /FONT_KEY = 'vida-cuaderno-font-size-v1'/)
})

test('FASE F: la vista de lectura offline renderiza con DOM seguro y no ejecuta HTML de notas', () => {
  assert.match(shell, /document\.createTextNode\(part\)/)
  assert.match(shell, /strong\.textContent/)
  assert.match(shell, /em\.textContent/)
  assert.match(shell, /preview\.replaceChildren\(\)/)
  assert.doesNotMatch(shell, /preview\.innerHTML/)
})
