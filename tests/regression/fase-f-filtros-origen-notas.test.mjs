import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: el cuaderno filtra por tipo y origen sin duplicar notas', () => {
  assert.match(workspace, /type FiltroOrigen = 'todos' \| 'estudio_profundo' \| 'biblia_notas'/)
  assert.match(workspace, /filtroOrigen === 'todos' \|\| nota\.origen === filtroOrigen/)
  assert.match(workspace, /\[notas, busqueda, filtro, filtroOrigen\]/)
  assert.doesNotMatch(workspace, /notas\.flatMap/)
})

test('FASE F: el origen de Estudio Profundo queda visible en tarjetas y editor', () => {
  assert.match(workspace, /Estudio Profundo/)
  assert.match(workspace, /Origen: Estudio Profundo/)
  assert.match(workspace, /nota\.origen === 'estudio_profundo'/)
  assert.match(workspace, /seleccionada\.origen === 'estudio_profundo'/)
})
