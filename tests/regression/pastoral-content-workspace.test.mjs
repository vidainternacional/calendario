import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/page.tsx', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('Proyecto pastoral usa contenido por páginas como fuente de la presentación', () => {
  assert.match(page, /ProyectoContenidoWorkspace/)
  assert.match(workspace, /type Vista = 'contenido' \| 'versiculos' \| 'recursos' \| 'presentacion' \| 'guia' \| 'publicar'/)
  assert.match(workspace, /const \[paginas, setPaginas\]/)
  assert.match(workspace, /Las páginas del contenido ya son las diapositivas/)
})

test('Contenido mantiene una sola página activa y permite crear o eliminar páginas', () => {
  assert.match(workspace, /const \[indice, setIndice\] = useState\(0\)/)
  assert.match(workspace, /const nuevaPagina = \(\) =>/)
  assert.match(workspace, /const eliminarPagina = \(\) =>/)
  assert.match(workspace, /Página \{indice \+ 1\} de \{paginas.length\}/)
})

test('Versículos se insertan en la posición activa del editor y regresan a Contenido', () => {
  assert.match(workspace, /selectionStart/)
  assert.match(workspace, /selectionEnd/)
  assert.match(workspace, /setVista\('contenido'\)/)
  assert.match(workspace, /agregado a la página/)
})

test('Cada página puede conservar recurso visual y plantilla sin crear tablas nuevas', () => {
  for (const plantilla of ['limpia', 'titulo', 'imagen', 'versiculo']) assert.match(workspace, new RegExp(`'${plantilla}'`))
  assert.match(workspace, /diapositiva_plantilla/)
  assert.match(actions, /formData\.getAll\('diapositiva_plantilla'\)/)
  assert.match(actions, /plantilla: plantillaValida/)
  assert.doesNotMatch(actions, /create table|alter table/i)
})

test('El editor nuevo queda aislado del workspace móvil legado', () => {
  assert.doesNotMatch(page, /workspace-mobile\.css/)
  assert.doesNotMatch(page, /PaqueteDetalleClient/)
  assert.doesNotMatch(page, /PastoralMobileWorkspaceShell/)
})
