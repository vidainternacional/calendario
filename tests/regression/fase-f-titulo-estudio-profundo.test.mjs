import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')

test('FASE F: una nota de Estudio Profundo sin título recibe un nombre útil sin modificar la fila', () => {
  assert.match(remote, /function tituloDesdeFila\(row: NotaBiblicaRemota\)/)
  assert.match(remote, /row\.origen === 'estudio_profundo' && referencia/)
  assert.match(remote, /return `Estudio: \$\{referencia\}`/)
  assert.match(remote, /titulo: tituloDesdeFila\(row\)/)
  assert.doesNotMatch(remote, /\.update\(\{\s*titulo:/)
})
