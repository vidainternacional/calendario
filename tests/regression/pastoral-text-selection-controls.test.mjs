import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('formato aplica efectos a palabras seleccionadas y usa la caja completa cuando no hay selección', () => {
  assert.match(workspace, /const haySeleccionDePalabras =/)
  assert.match(workspace, /if \(editor && haySeleccionDePalabras\(editor\)\)/)
  assert.match(workspace, /document\.execCommand\(comando\)/)
  assert.match(workspace, /persistirInline\(editor\)/)
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

test('la paleta de color permanece abierta al probar colores y solo el botón Color la alterna', () => {
  const inicio = workspace.indexOf('const aplicarColorTexto =')
  const fin = workspace.indexOf('const comandoParrafo =', inicio)
  const aplicarColor = workspace.slice(inicio, fin)
  assert.ok(inicio >= 0 && fin > inicio)
  assert.doesNotMatch(aplicarColor, /setPaletaTextoAbierta\(false\)/)
  assert.match(workspace, /onClick=\{\(\) => setPaletaTextoAbierta\(\(actual\) => !actual\)\}/)
  assert.match(workspace, /className=\{claseControlTexto\(paletaTextoAbierta\)\}/)
  assert.match(workspace, /aria-pressed=\{paletaTextoAbierta\}/)
})

test('los botones reflejan el formato real de la selección y las listas muestran su estado activo', () => {
  assert.match(workspace, /const leerEstadoFormatoSeleccion =/)
  assert.match(workspace, /document\.queryCommandState\(comando\)/)
  assert.match(workspace, /document\.addEventListener\('selectionchange', actualizar\)/)
  for (const comando of ['bold', 'italic', 'underline', 'strikeThrough']) {
    assert.match(workspace, new RegExp(`formatoActivo\\('${comando}'`))
  }
  assert.match(workspace, /claseControlTexto\(estadoFormatoSeleccion\.unorderedList\)/)
  assert.match(workspace, /claseControlTexto\(estadoFormatoSeleccion\.orderedList\)/)
  assert.match(workspace, /aria-pressed=\{estadoFormatoSeleccion\.unorderedList\}/)
  assert.match(workspace, /aria-pressed=\{estadoFormatoSeleccion\.orderedList\}/)
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
