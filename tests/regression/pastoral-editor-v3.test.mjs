import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV3.tsx', 'utf8')
const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-v3.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('workspace activo usa la version v3 y carga su capa visual al final', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV3/)
  assert.match(layout, /pastoral-editor-fixed-workspace\.css'[\s\S]*pastoral-editor-v3\.css'/)
})

test('dock principal deja parrafo dentro de texto y agrega capas', () => {
  const bloque = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  assert.match(bloque, /label: 'Plantillas'/)
  assert.match(bloque, /label: 'Elementos'/)
  assert.match(bloque, /label: 'Texto'/)
  assert.match(bloque, /label: 'Biblia'/)
  assert.match(bloque, /label: 'Fondo'/)
  assert.match(bloque, /label: 'Diseño'/)
  assert.match(bloque, /label: 'Capas'/)
  assert.doesNotMatch(bloque, /label: 'Párrafo'/)
  assert.match(workspace, /panel === 'texto'[\s\S]*AlignLeft[\s\S]*ListOrdered[\s\S]*Interlineado/)
})

test('diseño contiene relación de aspecto y capas concentra organización', () => {
  assert.match(workspace, /panel === 'diseno'[\s\S]*Relación de aspecto[\s\S]*FORMATOS_LIENZO/)
  assert.match(workspace, /panel === 'capas'[\s\S]*Duplicar[\s\S]*Adelante[\s\S]*Atrás[\s\S]*Eliminar elemento/)
})

test('fondos ofrece al menos treinta paletas completas con tipografias', () => {
  const bloque = workspace.match(/const PALETAS_PRESENTACION:[\s\S]*?\n\]/)?.[0] ?? ''
  const cantidad = (bloque.match(/fuenteTitulo:/g) ?? []).length
  assert.ok(cantidad >= 30, `se esperaban 30 paletas y hay ${cantidad}`)
  assert.match(bloque, /fuenteCuerpo:/)
  assert.match(workspace, /aplicarPaleta[\s\S]*fuenteTitulo[\s\S]*fuenteCuerpo/)
})

test('dock movil ocupa todo el ancho sin scroll lateral', () => {
  assert.match(css, /grid-template-columns: repeat\(7,minmax\(0,1fr\)\) !important/)
  assert.match(css, /\.pastoral-tool-dock[\s\S]*overflow: hidden !important/)
  assert.match(css, /\.pastoral-tool-button[\s\S]*min-width: 0 !important/)
})

test('selector biblico se integra visualmente a la bandeja movil', () => {
  assert.match(css, /aria-label='Seleccionar versículo'/)
  assert.match(css, /height: min\(44dvh, 390px\) !important/)
  assert.match(css, /background: transparent !important[\s\S]*backdrop-filter: none !important/)
})

test('tipografia del lienzo escala con el ancho real del canvas', () => {
  assert.match(canvas, /containerType: 'inline-size'/)
  assert.match(canvas, /fontSize: `min\(\$\{pixeles\}px, \$\{escalaLienzo\}cqw\)`/)
  assert.match(canvas, /baseWidth = pagina\.formato === '9:16'/)
})

test('compartir prioriza congregacion y deja utilidades despues', () => {
  const inicio = workspace.indexOf("vista === 'publicar'")
  const parte = workspace.slice(inicio)
  assert.ok(parte.indexOf('PackageDistributionControls') < parte.indexOf('pastoral-share-actions'))
  assert.match(parte, />PDF</)
  assert.match(parte, />Compartir</)
  assert.match(parte, />Copiar enlace</)
})
