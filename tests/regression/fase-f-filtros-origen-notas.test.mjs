import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: el cuaderno deriva filtros visuales de origen sin duplicar filas canónicas', () => {
  assert.match(workspace, /type FiltroOrigen = 'todos' \| 'biblia' \| 'estudio_profundo' \| 'cuaderno'/)
  assert.match(workspace, /function origenOrganizacion\(nota: NotaBiblica\)/)
  assert.match(workspace, /nota\.origen === 'estudio_profundo'/)
  assert.match(workspace, /superficie === 'biblia'/)
  assert.match(workspace, /nota\.origen === 'biblia_notas' && nota\.tipo === 'versiculo' && nota\.referencia\.trim\(\)/)
  assert.match(workspace, /filtroOrigen === 'todos' \|\| origenOrganizacion\(nota\) === filtroOrigen/)
  assert.match(workspace, /\[notas, busqueda, filtro, filtroOrigen\]/)
  assert.doesNotMatch(workspace, /notas\.flatMap/)
})

test('FASE F: Biblia y Estudio Profundo quedan visibles como origen de organización', () => {
  assert.match(workspace, /\{ id: 'biblia', nombre: 'Biblia' \}/)
  assert.match(workspace, /\{ id: 'estudio_profundo', nombre: 'Estudio Profundo' \}/)
  assert.match(workspace, /`Biblia\$\{seleccionada\.referencia \? ` · \$\{seleccionada\.referencia\}` : ''\}`/)
  assert.match(workspace, /`Estudio Profundo\$\{seleccionada\.referencia \? ` · \$\{seleccionada\.referencia\}` : ''\}`/)
  assert.doesNotMatch(workspace, /notas\.flatMap/)
})
