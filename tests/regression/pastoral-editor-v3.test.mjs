import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('workspace activo usa V4 con base V3 y autoridad stable', () => {
  assert.match(workspace, /pastoral-editor-v3 pastoral-editor-v4/)
  assert.match(layout, /pastoral-editor-v3\.css'[\s\S]*pastoral-editor-stable\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-capcut/)
})

test('dock mantiene solo los tres grupos principales aprobados', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Texto', 'Capas']) assert.match(dock, new RegExp(label))
  assert.doesNotMatch(dock, /Elementos|Biblia|Diseño|Fondo|Párrafo|Borrar/)
  assert.match(workspace, /const SUBMENUS:[\s\S]*label: 'Imágenes'[\s\S]*label: 'Biblia'[\s\S]*label: 'Relación'[\s\S]*label: 'Ajustes'/)
})

test('Biblia entra directamente en panel e Imágenes absorbe la opción de fondo', () => {
  assert.match(workspace, /panel === 'biblia'[\s\S]*PastoralVersePicker/)
  const plantillas = workspace.match(/plantillas:\s*\[[\s\S]*?\],/)?.[0] ?? ''
  const imagenes = workspace.slice(workspace.indexOf("panel === 'recursos'"), workspace.indexOf("panel === 'texto'"))
  assert.doesNotMatch(plantillas, /label: 'Fondo'/)
  assert.match(plantillas, /label: 'Imágenes'/)
  assert.match(imagenes, /Como fondo/)
  assert.match(imagenes, /aplicarFondoImagen/)
})

test('guardado automático usa acción existente', () => {
  assert.match(workspace, /window\.setTimeout\(\(\) => \{ void guardarAutomatico\(\) \}, 650\)/)
  assert.match(workspace, /editarPaquetePastoral/)
})

test('cursiva es nativa y controles viven fuera de la caja con hitbox táctil', () => {
  assert.match(canvas, /fontStyle: elemento\.cursiva \? 'italic' : 'normal'/)
  assert.match(canvas, /data-canvas-floating-controls="true"/)
  assert.match(canvas, /pastoral-canvas-resize-handle/)
  assert.match(css, /pastoral-canvas-action[\s\S]*width: 44px !important/)
  assert.match(css, /pastoral-canvas-resize-handle[\s\S]*width: 44px !important/)
})

test('tipografía del lienzo escala con ancho real del canvas', () => {
  assert.match(canvas, /containerType: 'inline-size'/)
  assert.match(canvas, /escalaLienzo/)
})