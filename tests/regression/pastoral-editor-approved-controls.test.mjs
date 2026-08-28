import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('editor conserva retorno, fondo editable y presentación real desde Compartir', () => {
  assert.match(workspace, /aria-label="Volver al Centro Pastoral"/)
  assert.match(workspace, /onClick=\{\(\) => router\.back\(\)\}/)
  assert.match(workspace, /const desbloquearFondo/)
  assert.match(workspace, /fondo_visual: fondoVisual/)
  assert.match(model, /fondo_visual\?: string/)
  assert.match(workspace, /Vista de presentación/)
  assert.match(workspace, /abrirPresentacionDesdeCompartir/)
  assert.match(workspace, /setVista\('presentacion'\); setModoPresentacion\(true\)/)
  assert.match(workspace, /fitViewport=\{modoPresentacion\}/)
  assert.match(canvas, /fitViewport\?: boolean/)
})
