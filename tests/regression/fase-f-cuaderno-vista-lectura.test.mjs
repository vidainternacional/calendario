import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')

test('FASE F: las herramientas quedan visibles sin depender de scroll horizontal', () => {
  assert.match(toolbar, /grid grid-cols-3/)
  assert.doesNotMatch(toolbar, /overflow-x-auto rounded-2xl/)
  assert.match(toolbar, /Selecciona texto y toca una herramienta/)
  assert.match(toolbar, /min-h-14/)
})

test('FASE F: el editor ofrece Vista de lectura segura sin inyectar HTML', () => {
  assert.match(toolbar, /Vista de lectura/)
  assert.match(toolbar, /previewLine/)
  assert.match(toolbar, /inlineNodes/)
  assert.match(toolbar, /<strong key=/)
  assert.match(toolbar, /<em key=/)
  assert.match(toolbar, /<blockquote key=/)
  assert.match(toolbar, /aria-label="Vista de lectura de la nota"/)
  assert.doesNotMatch(toolbar, /dangerouslySetInnerHTML/)
})

test('FASE F: la vista de lectura no cambia el formato canónico guardado', () => {
  assert.match(toolbar, /area\.style\.display = previewMode \? 'none' : ''/)
  assert.match(toolbar, /onChange\(`\$\{value\.slice\(0, start\)\}\$\{replacement\}\$\{value\.slice\(end\)\}`\)/)
  assert.doesNotMatch(toolbar, /innerHTML\s*=/)
})
