import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-capcut-v2.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')

test('workspace activo usa v4 y carga la capa CapCut v2 al final', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV4/)
  assert.match(layout, /pastoral-editor-capcut\.css'[\s\S]*pastoral-editor-capcut-v2\.css'/)
})

test('dock mantiene herramientas principales y párrafo vive dentro de Texto', () => {
  const bloque = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Fondo', 'Diseño', 'Capas']) assert.match(bloque, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(bloque, /label: 'Párrafo'/)
  assert.match(workspace, /panel === 'texto'[\s\S]*AlignLeft[\s\S]*ListOrdered[\s\S]*Interlineado/)
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 34px 34px 38px/)
})

test('Biblia entra directamente en el panel y prioriza la lista de versículos', () => {
  assert.match(workspace, /panel === 'biblia'[\s\S]*PastoralVersePicker open embedded/)
  assert.doesNotMatch(workspace, />Abrir</)
  assert.match(picker, /embedded\?: boolean/)
  assert.match(picker, /pastoral-verse-toolbar/)
  assert.match(picker, /pastoral-verse-list/)
  assert.match(css, /grid-template-rows: 34px minmax\(0,1fr\)/)
  assert.match(css, /pastoral-insert-selected[\s\S]*height: 28px/)
})

test('plantillas integra temas y fondos como punto de inicio de una presentación', () => {
  const parte = workspace.slice(workspace.indexOf("panel === 'plantillas'"), workspace.indexOf("panel === 'recursos'"))
  assert.match(parte, /Plantillas/)
  assert.match(parte, /Temas/)
  assert.match(parte, /Fondos/)
  assert.match(parte, /PLANTILLAS_VISUALES/)
  assert.match(parte, /PALETAS_PRESENTACION/)
  assert.match(parte, /aplicarFondoImagen/)
})

test('temas conserva una colección curada amplia con tipografías completas', () => {
  const cantidad = (presets.match(/fuenteTitulo:/g) ?? []).length
  assert.ok(cantidad >= 20, `se esperaban al menos 20 temas curados y hay ${cantidad}`)
  assert.match(presets, /fuenteCuerpo:/)
  assert.match(presets, /linear-gradient\(/)
  assert.match(presets, /repeating-linear-gradient\(/)
  assert.match(workspace, /aplicarPaleta[\s\S]*fuenteTitulo[\s\S]*fuenteCuerpo/)
})

test('guardado automático usa la acción existente sin refrescar la página', () => {
  assert.match(workspace, /autosaveReadyRef/)
  assert.match(workspace, /guardarAutomatico/)
  assert.match(workspace, /editarPaquetePastoral\(paquete\.id, construirFormulario\(\)\)/)
  assert.match(workspace, /setTimeout\(\(\) => \{ void guardarAutomatico\(\) \}, 650\)/)
  const bloque = workspace.slice(workspace.indexOf('const guardarAutomatico'), workspace.indexOf('const cambiarVista'))
  assert.doesNotMatch(bloque, /router\.refresh/)
})

test('cursiva se sintetiza de forma visible y controles no cubren la caja', () => {
  assert.match(canvas, /fontStyle: elemento\.cursiva \? 'oblique 12deg' : 'normal'/)
  assert.match(canvas, /fontSynthesis: 'style weight'/)
  assert.match(canvas, /-top-7 left-0[\s\S]*h-6 w-6/)
  assert.match(canvas, /-top-7 right-0[\s\S]*h-6 w-6/)
})

test('tipografía del lienzo escala con el ancho real del canvas', () => {
  assert.match(canvas, /containerType: 'inline-size'/)
  assert.match(canvas, /fontSize: `min\(\$\{pixeles\}px, \$\{escalaLienzo\}cqw\)`/)
  assert.match(canvas, /baseWidth = pagina\.formato === '9:16'/)
})

test('compartir prioriza congregación y deja utilidades después', () => {
  const inicio = workspace.indexOf("vista === 'publicar'")
  const parte = workspace.slice(inicio)
  assert.ok(parte.indexOf('PackageDistributionControls') < parte.indexOf('pastoral-share-actions'))
  assert.match(parte, />PDF</)
  assert.match(parte, />Compartir</)
  assert.match(parte, />Copiar enlace</)
})
