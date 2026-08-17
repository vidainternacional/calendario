import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')

test('FASE F: la IA queda por encima de los submenús y las herramientas siguen agrupadas sin scroll horizontal', () => {
  assert.match(toolbar, /aria-label="Barra de asistencia con IA"/)
  assert.match(toolbar, /¿Qué quieres hacer con esta nota\?/)
  assert.match(toolbar, /grid grid-cols-4/)
  assert.match(toolbar, /Texto/)
  assert.match(toolbar, /Listas/)
  assert.match(toolbar, /Insertar/)
  assert.match(toolbar, /Vista/)
  assert.doesNotMatch(toolbar, /id: 'organizar'/)
  assert.doesNotMatch(toolbar, /overflow-x-auto rounded-2xl/)
  assert.match(toolbar, /min-h-14/)
})

test('FASE F: el editor ofrece Vista de lectura segura sin inyectar HTML', () => {
  assert.match(toolbar, /Vista de lectura/)
  assert.match(toolbar, /const preview = useMemo/)
  assert.match(toolbar, /inlineNodes/)
  assert.match(toolbar, /<strong key=/)
  assert.match(toolbar, /<em key=/)
  assert.match(toolbar, /<blockquote key=/)
  assert.match(toolbar, /aria-label="Vista de lectura de la nota"/)
  assert.doesNotMatch(toolbar, /dangerouslySetInnerHTML/)
})

test('FASE F: la vista de lectura no cambia el formato canónico guardado', () => {
  assert.match(toolbar, /area\.style\.display = previewMode \? 'none' : ''/)
  assert.match(toolbar, /const commitChange = \(next: string\) =>/)
  assert.match(toolbar, /onChange\(next\)/)
  assert.doesNotMatch(toolbar, /innerHTML\s*=/)
})
