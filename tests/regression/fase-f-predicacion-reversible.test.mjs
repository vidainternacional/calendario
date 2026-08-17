import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: usar una nota como predicación conserva el tipo anterior para poder volver', () => {
  assert.match(workspace, /tipoAntesPredicacion/)
  assert.match(workspace, /const activarPredicacion =/)
  assert.match(workspace, /seleccionada\.tipo !== 'predicacion'/)
  assert.match(workspace, /tipoAntesPredicacion: seleccionada\.tipo/)
})

test('FASE F: una predicación puede regresar al tipo anterior como una acción reversible', () => {
  assert.match(workspace, /const dejarPredicacion =/)
  assert.match(workspace, /tipoRegresoPredicacion/)
  assert.match(workspace, /delete contexto\.tipoAntesPredicacion/)
  assert.match(workspace, /numeroPredicacion: null/)
  assert.match(workspace, /Volver/)
  assert.match(workspace, /checkpoint: true/)
})
