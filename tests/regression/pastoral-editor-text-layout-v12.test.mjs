import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('Herramientas de Texto abre todo el contenido en el orden aprobado', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  const tipo = texto.indexOf('Tipo ·')
  const fuente = texto.indexOf('Fuente ·')
  const formato = texto.indexOf('>Formato<')
  const tamano = texto.indexOf('Tamaño e interlineado')
  const alineacion = texto.indexOf('>Alineación<')
  const listas = texto.indexOf('>Listas<')
  assert.ok(tipo >= 0 && fuente > tipo && formato > fuente && tamano > formato && alineacion > tamano && listas > alineacion)
  assert.doesNotMatch(workspace, /grupoTextoAbierto|alternarGrupoTexto/)
  assert.match(texto, /FUENTE_MUESTRA[\s\S]*>Aa</)
  assert.match(texto, /<details[\s\S]*aria-label="Color de texto"[\s\S]*aria-label="Colores de texto"/)
})

test('Caja Título Subtítulo y Cuerpo siguen disponibles y táctiles sin píldoras propias', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, />Caja<\/button>/)
  assert.match(texto, /ESTILOS_TEXTO\.filter\(\(item\) => item\.id !== 'libre'\)\.map/)
  assert.match(texto, /\{estilo\.label\}/)
  for (const entrada of [
    "{ id: 'titulo', label: 'Título'",
    "{ id: 'subtitulo', label: 'Subtítulo'",
    "{ id: 'cuerpo', label: 'Cuerpo'",
  ]) assert.ok(model.includes(entrada))
  assert.match(texto, /min-h-12/)
  assert.doesNotMatch(texto, /Opciones de tipo de texto[\s\S]{0,900}rounded-full/)
  assert.doesNotMatch(workspace, /<Plus \/> Caja/)
})

test('Tamaño y Línea mantienen steppers táctiles y comparten fila con alineación 2 por 2', () => {
  assert.match(workspace, /aria-label="Reducir tamaño de letra"/)
  assert.match(workspace, /aria-label="Aumentar tamaño de letra"/)
  assert.match(workspace, /aria-label="Reducir interlineado"/)
  assert.match(workspace, /aria-label="Aumentar interlineado"/)
  assert.match(workspace, /grid-cols-\[minmax\(0,1\.35fr\)_minmax\(104px,\.65fr\)\]/)
  assert.match(workspace, /aria-label="Justificar"/)
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
