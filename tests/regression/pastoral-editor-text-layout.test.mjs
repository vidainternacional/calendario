import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('aplicar Plantilla o Tema no solicita toast de confirmación', () => {
  assert.doesNotMatch(workspace, /Tema “\$\{paleta\.label\}” aplicado|Plantilla “\$\{plantilla\.nombre\}” aplicada/)
})

test('En blanco modifica la página actual y solo el control superior crea página', () => {
  const inicio = workspace.indexOf('pastoral-template-blank-option')
  const blanco = workspace.slice(Math.max(0, inicio - 420), inicio + 260)
  assert.match(blanco, /actualizarPagina/)
  assert.doesNotMatch(blanco, /nuevaPagina/)
  assert.match(workspace, /Aplicar plantilla en blanco a la página actual/)
  assert.equal((workspace.match(/onClick=\{nuevaPagina\}/g) ?? []).length, 1)
  assert.match(workspace, /aria-label="Nueva página"/)
  assert.match(layout, /PastoralEditorRuntimeEnhancements/)
})

test('Texto conserva controles grandes y scroll de su superficie', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /overflow-y-auto/)
  assert.match(texto, /min-h-11/)
})

test('Tamaño e interlineado tienen steppers táctiles React', () => {
  assert.match(workspace, /aria-label="Reducir tamaño de letra"/)
  assert.match(workspace, /aria-label="Aumentar tamaño de letra"/)
  assert.match(workspace, /aria-label="Reducir interlineado"/)
  assert.match(workspace, /aria-label="Aumentar interlineado"/)
})

test('Caja queda disponible junto a Título Subtítulo y Cuerpo', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  for (const label of ['Caja', 'Título', 'Subtítulo', 'Cuerpo']) assert.match(texto, new RegExp(label))
  assert.doesNotMatch(workspace, /<Plus \/> Caja/)
})

test('página activa se elige arriba y ya no existe la faja inferior', () => {
  assert.match(workspace, /<select value=\{indice\}/)
  assert.match(workspace, /\{i \+ 1\}\/\{paginas\.length\}/)
  assert.doesNotMatch(workspace, /pastoral-pages-strip/)
  assert.match(css, /pastoral-pages-strip/)
})

test('cursiva usa variante real y evita síntesis tipográfica en el renderer', () => {
  assert.match(canvas, /fontStyle: elemento\.cursiva \? 'italic' : 'normal'/)
  assert.match(canvas, /fontSynthesis: 'none'/)
})