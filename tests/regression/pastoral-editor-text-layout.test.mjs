import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('aplicar Plantilla o Tema no solicita toast de confirmación', () => {
  assert.doesNotMatch(workspace, /Tema “\$\{paleta\.label\}” aplicado|Plantilla “\$\{plantilla\.nombre\}” aplicada/)
})

test('En blanco modifica la página actual y solo el control superior crea página', () => {
  const marcador = 'aria-label="Aplicar plantilla en blanco a la página actual"'
  const inicio = workspace.indexOf(marcador)
  const blanco = workspace.slice(Math.max(0, inicio - 700), inicio + marcador.length + 80)
  assert.ok(inicio >= 0)
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

test('Tamaño e interlineado tienen controles táctiles React en la cinta horizontal', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /aria-label="Reducir tamaño de letra"/)
  assert.match(texto, /aria-label="Aumentar tamaño de letra"/)
  assert.match(texto, /aria-label="Reducir interlineado"/)
  assert.match(texto, /aria-label="Aumentar interlineado"/)
  assert.match(texto, /role="toolbar" aria-label="Formato listas tamaño interlineado y alineación"/)
})

test('A+ queda disponible y Título Subtítulo Cuerpo son atributos del texto seleccionado', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /aria-label="Agregar texto"/)
  assert.match(texto, /<span className="text-base font-black">A<\/span><span className="text-sm font-black">\+<\/span>/)
  assert.match(texto, /ESTILOS_TEXTO\.filter\(\(item\) => item\.id !== 'libre'\)\.map/)
  assert.match(texto, /\{estilo\.label\}/)
  for (const entrada of [
    "{ id: 'titulo', label: 'Título'",
    "{ id: 'subtitulo', label: 'Subtítulo'",
    "{ id: 'cuerpo', label: 'Cuerpo'",
  ]) assert.ok(model.includes(entrada))
  assert.doesNotMatch(workspace, /if \(!textoSeleccionado\) return agregarTexto\(rol\)/)
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
