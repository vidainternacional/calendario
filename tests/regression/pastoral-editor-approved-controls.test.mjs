import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('editor conserva retorno, fondo editable y presentación real separada de Compartir', () => {
  assert.match(workspace, /aria-label="Volver al Centro Pastoral"/)
  assert.match(workspace, /onClick=\{\(\) => router\.back\(\)\}/)
  assert.match(workspace, /const desbloquearFondo/)
  assert.match(workspace, /fondo_visual: fondoVisual/)
  assert.match(model, /fondo_visual\?: string/)
  const inicioPresentar = workspace.indexOf("{vista === 'presentacion' && pagina")
  const finPresentar = workspace.indexOf("{vista === 'publicar' && <section", inicioPresentar)
  const presentar = workspace.slice(inicioPresentar, finPresentar)
  assert.match(presentar, /Pantalla completa/)
  assert.match(presentar, /presentarHorizontalGirado/)
  assert.match(presentar, /orientacionPresentacion/)
  assert.match(presentar, />Horizontal</)
  assert.match(presentar, />Vertical</)
  assert.match(presentar, /fitViewport=\{modoPresentacion && orientacionPresentacion === 'horizontal' && !presentarHorizontalGirado\}/)
  assert.doesNotMatch(workspace, /vista === 'congregacion'/)
  assert.match(workspace, /transform: 'rotate\(90deg\)'/)
  const inicioCompartir = workspace.indexOf("{vista === 'publicar' && <section")
  const finCompartir = workspace.indexOf('pastoral-print-deck', inicioCompartir)
  const compartir = workspace.slice(inicioCompartir, finCompartir)
  assert.match(compartir, /PackageDistributionControls/)
  assert.doesNotMatch(compartir, /Vista de presentación|<PastoralVisualCanvas/)
  assert.doesNotMatch(workspace, /abrirPresentacionDesdeCompartir/)
  assert.match(canvas, /fitViewport\?: boolean/)
})
