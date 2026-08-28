import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspace.tsx', 'utf8')
const workspaceV4 = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('texto editable mantiene DOM estable y dirección LTR mientras se escribe', () => {
  assert.match(canvas, /function TextoCanvas/)
  assert.match(canvas, /document\.activeElement !== editor/)
  assert.match(canvas, /editor\.innerHTML !== contenidoSeguro/)
  assert.match(canvas, /aplicarAtributosInlineVida\(editor, baseWidth\)/)
  assert.match(canvas, /dir="ltr"/)
  assert.match(canvas, /direction: 'ltr'/)
  assert.match(canvas, /unicodeBidi: 'plaintext'/)
  assert.match(canvas, /writingMode: 'horizontal-tb'/)
  const textoDesde = canvas.indexOf('function TextoCanvas')
  const textoHasta = canvas.indexOf('export default function PastoralVisualCanvas')
  assert.ok(textoDesde >= 0 && textoHasta > textoDesde)
  assert.doesNotMatch(canvas.slice(textoDesde, textoHasta), /dangerouslySetInnerHTML/)
})

test('el lienzo deja solo Mover como acción flotante y conserva Borrar global y redimensionado', () => {
  assert.match(canvas, /aria-label="Mover elemento"/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
  assert.doesNotMatch(canvas, /aria-label="Eliminar elemento"/)
  assert.doesNotMatch(canvas, /aria-label="Ajustar caja al texto"/)
  assert.match(workspaceV4, /aria-label="Borrar elemento seleccionado"/)
  assert.match(workspaceV4, /const eliminarElemento =/)
  assert.match(workspace, /> Borrar<\/button>/)
  assert.match(workspace, /Quitar fondo/)
})

test('tamaño tipográfico se expresa en puntos admite 160 pt y escala con el lienzo', () => {
  assert.match(workspace, /Tamaño de letra en puntos/)
  assert.match(workspace, /type="number" min="8" max="160"/)
  assert.match(workspace, /type="range" min="8" max="160"/)
  assert.match(workspace, /<span>pt<\/span>/)
  assert.match(canvas, /const pixeles = \(puntos \* 4\) \/ 3/)
  assert.match(canvas, /fontSize: `min\(\$\{pixeles\}px, \$\{escalaLienzo\}cqw\)`/)
  assert.match(model, /tamano_fuente:[\s\S]*8, 160/)
  assert.match(actions, /tamano_fuente: numeroAcotado\(item\.tamano_fuente, 8, 160/)
})

test('botones de formato reflejan visualmente el estado activo', () => {
  assert.match(workspace, /const claseBotonActivo/)
  assert.match(workspace, /bg-violet-600 text-white/)
  assert.match(workspace, /aria-pressed=\{\(textoSeleccionado\.peso/)
  assert.match(workspace, /aria-pressed=\{Boolean\(textoSeleccionado\.cursiva\)\}/)
  assert.match(workspace, /aria-pressed=\{Boolean\(textoSeleccionado\.subrayado\)\}/)
  assert.match(workspace, /aria-pressed=\{Boolean\(textoSeleccionado\.tachado\)\}/)
})

test('texto ofrece Título Subtítulo Cuerpo y más familias tipográficas', () => {
  assert.match(model, /type RolTexto = 'titulo' \| 'subtitulo' \| 'cuerpo' \| 'libre'/)
  for (const etiqueta of ['Título', 'Subtítulo', 'Cuerpo']) assert.match(model, new RegExp(`label: '${etiqueta}'`))
  for (const fuente of ['Helvetica', 'Verdana', 'Tahoma', 'Palatino Linotype', 'Garamond', 'Lucida Console', 'Impact', 'Arial Black']) {
    assert.match(model, new RegExp(fuente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(actions, new RegExp(fuente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(actions, /type RolTexto = 'titulo' \| 'subtitulo' \| 'cuerpo' \| 'libre'/)
  assert.match(actions, /rolTextoValido/)
  assert.match(actions, /valor === 'subtitulo'/)
})