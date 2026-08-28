import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('formato aplica efectos a palabras seleccionadas y usa la caja completa cuando no hay selección', () => {
  assert.match(workspace, /const haySeleccionDePalabras =/)
  assert.match(workspace, /if \(editor && haySeleccionDePalabras\(editor\)\)/)
  assert.match(workspace, /document\.execCommand\(comando\)/)
  assert.match(workspace, /patchElementoSinHistorial\(textoSeleccionado\.id, \{ contenido: limpiarHtmlCanvas\(editor\.innerHTML\) \}\)/)
  assert.match(workspace, /actualizarElemento\(textoSeleccionado\.id, patchCaja\)/)
  for (const comando of ['bold', 'italic', 'underline', 'strikeThrough']) assert.ok(workspace.includes(`aplicarEfectoTexto('${comando}'`))
})

test('listas usan selección existente o seleccionan toda la caja si no hay palabras marcadas', () => {
  assert.match(workspace, /type ComandoListaTexto = 'insertUnorderedList' \| 'insertOrderedList'/)
  assert.match(workspace, /const habiaSeleccion = Boolean/)
  assert.match(workspace, /rangoCompleto\.selectNodeContents\(editor\)/)
  assert.match(workspace, /seleccionVentana\.addRange\(rangoCompleto\)/)
  assert.match(workspace, /if \(!habiaSeleccion\) seleccionVentana\?\.collapseToEnd\(\)/)
})

test('estilos y controles no roban la selección y la cinta de formato solo desplaza horizontalmente', () => {
  assert.match(workspace, /onPointerDown=\{\(e\) => e\.preventDefault\(\)\} onClick=\{\(\) => aplicarRolTexto\(estilo\.id\)\}/)
  assert.match(workspace, /touch-pan-x[\s\S]*overflow-x-auto overflow-y-hidden overscroll-x-contain/)
  assert.match(workspace, /aria-label="Color de texto" aria-expanded=\{paletaTextoAbierta\}/)
  assert.match(workspace, /role="group" aria-label="Colores de texto"/)
})

test('título y subtítulo parten de tamaños más proporcionados al lienzo', () => {
  assert.match(model, /\{ id: 'titulo', label: 'Título', pt: 42, peso: 800 \}/)
  assert.match(model, /\{ id: 'subtitulo', label: 'Subtítulo', pt: 28, peso: 700 \}/)
  assert.match(model, /rol: 'titulo'[\s\S]*tamano_fuente: 42/)
})

test('tachado inline sobre selección sobrevive a la limpieza segura del contenido', () => {
  assert.match(model, /strike\|ul\|ol\|li/)
  assert.match(model, /'STRIKE'/)
})
