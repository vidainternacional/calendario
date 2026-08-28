import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('Herramientas de Texto prioriza estilo, barra horizontal y Fuente desplegable', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  const estilo = texto.indexOf('Estilo ·')
  const herramientas = texto.indexOf('Formato · listas · tamaño · alineación')
  const fuente = texto.indexOf('Fuente ·')
  assert.ok(estilo >= 0 && herramientas > estilo && fuente > herramientas)
  assert.match(texto, /role="toolbar" aria-label="Formato listas tamaño interlineado y alineación"/)
  assert.match(texto, /overflow-x-auto/)
  assert.match(texto, /aria-label="Elegir fuente"/)
  assert.match(texto, /<details[\s\S]*Fuente · \{fuenteTextoActual\}[\s\S]*aria-label="Fuentes disponibles"/)
  assert.match(texto, /aria-label="Color de texto"[\s\S]*aria-label="Colores de texto"/)
  assert.doesNotMatch(workspace, /grupoTextoAbierto|alternarGrupoTexto/)
})

test('A+ crea texto y Título Subtítulo Cuerpo solo cambian el texto seleccionado', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /aria-label="Agregar texto"/)
  assert.match(texto, /<span className="text-base font-black">A<\/span><span className="text-sm font-black">\+<\/span>/)
  assert.match(texto, /ESTILOS_TEXTO\.filter\(\(item\) => item\.id !== 'libre'\)\.map/)
  assert.match(texto, /disabled=\{!textoSeleccionado\}[\s\S]*onClick=\{\(\) => aplicarRolTexto\(estilo\.id\)\}/)
  for (const entrada of [
    "{ id: 'titulo', label: 'Título'",
    "{ id: 'subtitulo', label: 'Subtítulo'",
    "{ id: 'cuerpo', label: 'Cuerpo'",
  ]) assert.ok(model.includes(entrada))
  assert.match(texto, /min-h-12/)
  assert.doesNotMatch(texto, /Opciones de estilo de texto[\s\S]{0,1000}rounded-full/)
  assert.match(workspace, /if \(!textoSeleccionado\) return\n    if \(textoSeleccionado\.rol === rol\) return actualizarElemento\(textoSeleccionado\.id, \{ rol: 'libre' \}\)/)
  assert.doesNotMatch(workspace, /if \(!textoSeleccionado\) return agregarTexto\(rol\)/)
})

test('Plantillas no crean ni mueven texto del usuario y Temas no cambian su fuente', () => {
  const plantilla = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  const paleta = workspace.slice(workspace.indexOf('const aplicarPaleta'), workspace.indexOf('const aplicarPlantilla'))
  assert.match(plantilla, /const tieneTextoUsuario = textos\.some/)
  assert.match(plantilla, /if \(tieneTextoUsuario\)/)
  assert.match(plantilla, /return layout \? \{ \.\.\.elemento, fuente: layout\.fuente \} : elemento/)
  assert.doesNotMatch(plantilla.slice(plantilla.indexOf('if (tieneTextoUsuario)'), plantilla.indexOf('const imagenesActuales')), /\bx:|\by:|\bw:|\bh:|crearMuestra/)
  assert.doesNotMatch(plantilla, /Título del mensaje|Subtítulo o referencia|Escribe aquí el contenido principal/)
  assert.match(plantilla, /textoMuestraPlantilla\(plantilla, rol\)/)
  assert.doesNotMatch(paleta, /fuente:/)
})

test('Plantillas y Temas crecen verticalmente en filas de tres', () => {
  const plantillas = workspace.slice(workspace.indexOf("panel === 'plantillas'"), workspace.indexOf("panel === 'temas'"))
  const temas = workspace.slice(workspace.indexOf("panel === 'temas'"), workspace.indexOf("panel === 'recursos'"))
  assert.match(plantillas, /grid grid-cols-3 gap-x-2 gap-y-3/)
  assert.match(plantillas, /aria-label="Plantillas en filas de tres"/)
  assert.match(temas, /grid grid-cols-3 gap-x-2 gap-y-3/)
  assert.match(temas, /aria-label="Temas en filas de tres"/)
  assert.doesNotMatch(plantillas, /pastoral-template-grid|overflow-x-auto/)
  assert.doesNotMatch(temas, /pastoral-theme-grid|overflow-x-auto/)
})

test('Formato listas tamaño interlineado y alineación comparten una sola cinta redonda horizontal', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /role="toolbar" aria-label="Formato listas tamaño interlineado y alineación"/)
  assert.match(texto, /overflow-x-auto/)
  assert.match(workspace, /const claseControlTexto[\s\S]*rounded-full/)
  assert.match(texto, /aria-label="Reducir tamaño de letra"/)
  assert.match(texto, /aria-label="Aumentar tamaño de letra"/)
  assert.match(texto, /aria-label="Reducir interlineado"/)
  assert.match(texto, /aria-label="Aumentar interlineado"/)
  assert.match(texto, /aria-label="Lista con viñetas"/)
  assert.match(texto, /aria-label="Lista numerada"/)
  assert.match(texto, /aria-label="Justificar"/)
})

test('controles flotantes buscan espacio libre, evitan otros textos y respetan bordes', () => {
  assert.match(canvas, /function cajasSeCruzan/)
  assert.match(canvas, /function estiloControlesFlotantes\(elemento: ElementoCanvas, elementos: ElementoCanvas\[], canvasRect\?: DOMRect\)/)
  assert.match(canvas, /otro\.id !== elemento\.id && otro\.tipo !== 'imagen' && !otro\.oculto/)
  assert.match(canvas, /const dentroDelLienzo/)
  assert.match(canvas, /validos\.find\(\(candidato\) => cruces\(candidato\) === 0\)/)
  assert.match(canvas, /validos\.sort\(\(a, b\) => cruces\(a\) - cruces\(b\)\)\[0\]/)
  assert.match(canvas, /estiloControlesFlotantes\(elemento, pagina\.elementos \?\? \[], lienzoRef\.current\?\.getBoundingClientRect\(\)\)/)
})

test('autoajuste mide el texto y registra historial antes de cambiar la geometría', () => {
  assert.match(canvas, /aria-label="Ajustar caja al texto"/)
  assert.match(canvas, /document\.createRange\(\)/)
  assert.match(canvas, /const x = clamp\(elemento\.x, 0, 100 - w\)/)
  assert.match(canvas, /const y = clamp\(elemento\.y, 0, 100 - h\)/)
  const ajuste = canvas.slice(canvas.indexOf('const ajustarTextoAlContenido'), canvas.indexOf('return ('))
  assert.ok(ajuste.indexOf('onBeginChange?.()') >= 0 && ajuste.indexOf('onPatchElement(elemento.id') > ajuste.indexOf('onBeginChange?.()'))
})

test('Capas usa lista vertical con visibilidad persistente y conserva acciones existentes', () => {
  const capas = workspace.slice(workspace.indexOf("panel === 'capas'"), workspace.indexOf("panel === 'ajustes'"))
  assert.match(capas, /aria-label="Lista vertical de capas"/)
  assert.match(capas, /alternarVisibilidadCapa\(elemento\.id\)/)
  assert.match(capas, /<EyeOff className=/)
  assert.match(capas, /<Eye className=/)
  assert.match(capas, /Fondo de página/)
  for (const accion of ['Duplicar', 'Adelante', 'Atrás', 'Eliminar']) assert.ok(capas.includes(accion))
  assert.match(model, /oculto\?: boolean/)
  assert.match(model, /oculto: Boolean\(item\.oculto\)/)
  assert.match(canvas, /display: elemento\.oculto \? 'none' : undefined/)
  assert.match(workspace, /actualizarElemento\(id, \{ oculto: !elemento\.oculto \}\)/)
})

test('Justificado se representa y persiste sin degradarse a izquierda', () => {
  assert.match(model, /Alineacion = 'izquierda' \| 'centro' \| 'derecha' \| 'justificado'/)
  assert.match(model, /item\.alineacion === 'justificado'/)
  assert.match(canvas, /elemento\.alineacion === 'justificado' \? 'justify'/)
  assert.match(actions, /'izquierda', 'centro', 'derecha', 'justificado'/)
})

test('la navegación de páginas queda en la cabecera y desaparece la faja inferior', () => {
  assert.match(workspace, /Página \$\{indice \+ 1\} de \$\{paginas\.length\}/)
  assert.match(workspace, /aria-label="Nueva página"/)
  assert.doesNotMatch(workspace, /pastoral-pages-strip/)
})

test('el layout conserva stable después de V3 y los realces funcionales actuales', () => {
  const v3 = layout.indexOf("./pastoral-editor-v3.css")
  const stable = layout.indexOf("./pastoral-editor-stable.css")
  assert.ok(v3 >= 0 && stable > v3)
  assert.doesNotMatch(layout, /pastoral-editor-workbench-v10|pastoral-editor-surface-white|pastoral-editor-text-controls-v11|pastoral-editor-text-controls-v12/)
  assert.match(layout, /PastoralEditorRuntimeEnhancements/)
})

test('la arquitectura real mantiene tres grupos y las nuevas acciones aprobadas', () => {
  assert.match(workspace, /type GrupoPrincipal = 'plantillas' \| 'texto' \| 'capas'/)
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Texto', 'Capas']) assert.match(dock, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(dock, /Elementos|Biblia|Diseño|Fondo|Párrafo|Borrar/)
  assert.match(workspace, /const SUBMENUS:[\s\S]*label: 'Imágenes'[\s\S]*label: 'Biblia'[\s\S]*label: 'Relación'[\s\S]*label: 'Ajustes'/)
  assert.doesNotMatch(workspace.match(/plantillas:\s*\[[\s\S]*?\],/)?.[0] ?? '', /label: 'Fondo'/)
  assert.match(workspace, /Aplicar plantilla en blanco a la página actual/)
  assert.match(workspace, /aria-label="Borrar elemento seleccionado"/)
  assert.doesNotMatch(workspace, /Tema .* aplicado|Plantilla .* aplicada/)
  assert.match(css, /pastoral-tool-dock/)
})
