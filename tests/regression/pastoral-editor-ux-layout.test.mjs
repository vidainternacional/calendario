import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-minimal.css', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceCanva.tsx', 'utf8')

test('editor pastoral conserva acciones globales siempre accesibles', () => {
  for (const label of ['Deshacer', 'Rehacer', 'Guardar proyecto']) {
    assert.match(workspace, new RegExp(`aria-label="${label}"`))
  }
  assert.match(css, /BARRA GLOBAL/)
})

test('móvil vertical prioriza lienzo y abre una sola bandeja inferior', () => {
  assert.match(css, /orientation: portrait/)
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock'/)
  assert.match(css, /max-height: 34dvh/)
  assert.match(css, /pastoral-editor-shell\.has-panel \.pastoral-pages-strip/)
})

test('móvil horizontal mantiene ancho del lienzo y superpone inspector', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /max-height: 620px/)
  assert.match(css, /grid-template-areas: 'dock stage'/)
  assert.match(css, /position: absolute !important/)
  assert.match(css, /width: min\(300px, 42vw\)/)
})

test('iPad y escritorio separan navegación de páginas, lienzo e inspector', () => {
  assert.match(css, /min-width: 768px/)
  assert.match(css, /grid-template-areas:\s*'dock panel'\s*'stage panel'/)
  assert.match(css, /grid-template-areas:\s*'pages canvas'\s*'pages hint'/)
  assert.match(css, /grid-template-columns: 84px minmax\(0, 1fr\)/)
})

test('herramientas mantienen todas las funciones pero agrupan contenido antes de formato', () => {
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Fondo', 'Biblia', 'Párrafo', 'Diseño']) {
    assert.match(workspace, new RegExp(`label: '${label}'`))
  }
  assert.match(css, /Reorden visualmente: contenido primero; formato después/)
  assert.match(css, /nth-child\(5\) \{ order: 4;/)
  assert.match(css, /nth-child\(4\) \{ order: 5;/)
})

test('lienzo conserva prioridad visual y selección discreta', () => {
  assert.match(css, /LIENZO > PANEL > HERRAMIENTAS/)
  assert.match(css, /--editor-stage: #eceef2/)
  assert.match(css, /button\[aria-label='Mover elemento'\]/)
  assert.match(css, /button\[aria-label='Eliminar elemento'\]/)
})
