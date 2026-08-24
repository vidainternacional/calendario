import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/pastoral/page.tsx', 'utf8')
const header = fs.readFileSync('components/pastoral/PastoralPageHeader.tsx', 'utf8')
const packages = fs.readFileSync('components/pastoral/PaquetesClient.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/pastoral/pastoral-workspace-v2.css', 'utf8')
const detailStyles = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/workspace-mobile.css', 'utf8')

test('Centro Pastoral conserva Proyecto visible y herramientas en rejilla horizontal', () => {
  assert.match(page, /<h2 id="proyecto-pastoral">Proyecto<\/h2>/)
  assert.match(page, /className="pastoral-primary-action"/)
  assert.match(page, /grid grid-cols-3 gap-x-3 gap-y-5 py-6 sm:grid-cols-4/)
  assert.match(page, /h-7 w-7 stroke-\[1\.8\]/)
  assert.doesNotMatch(page, /<details/)
})

test('Centro Pastoral conserva las rutas funcionales existentes', () => {
  for (const route of [
    '/pastoral/bosquejos',
    '/pastoral/colecciones',
    '/pastoral/biblioteca',
    '/pastoral/materiales',
    '/biblia?from=pastoral',
    '/estudios/profundo?from=pastoral',
    '/pastoral/paquetes',
  ]) assert.match(page, new RegExp(route.replace(/[?]/g, '\\?')))
})

test('Centro Pastoral evita composición de lista y tarjetas anidadas', () => {
  assert.match(page, /pastoral-workspace/)
  assert.match(styles, /accesos como iconos directos sobre el background/)
  assert.doesNotMatch(page, /pastoral-work-section/)
  assert.doesNotMatch(page, /bg-gradient-to-br from-indigo-600 to-violet-700/)
})

test('Centro Pastoral mantiene iconos directos y feedback móvil', () => {
  assert.match(page, /active:scale-95/)
  assert.match(page, /group-active:scale-90/)
})

test('Proyecto nuevo solicita solo información básica antes de abrir el editor', () => {
  assert.match(packages, /Información del proyecto/)
  assert.match(packages, /name="titulo"/)
  assert.match(packages, /name="descripcion_publica"/)
  assert.match(packages, /name="estado" value="borrador"/)
  assert.match(packages, /Crear proyecto/)
  assert.match(packages, /El contenido, versículos, diseño y presentación se preparan dentro del proyecto/)
  assert.doesNotMatch(packages, /name="instrucciones"/)
  assert.doesNotMatch(packages, /name="bosquejo_id"/)
  assert.doesNotMatch(packages, /name="coleccion_id"/)
  assert.doesNotMatch(packages, /SeccionNueva|pastoral-builder-tools|pastoral-builder-panel/)
})

test('La creación simple conserva título y descripción mientras el formulario está abierto', () => {
  assert.match(packages, /const \[titulo, setTitulo\] = useState\(''\)/)
  assert.match(packages, /const \[descripcion, setDescripcion\] = useState\(''\)/)
  assert.match(packages, /value=\{titulo\}/)
  assert.match(packages, /onChange=\{\(event\) => setTitulo\(event\.target\.value\)\}/)
  assert.match(packages, /value=\{descripcion\}/)
  assert.match(packages, /onChange=\{\(event\) => setDescripcion\(event\.target\.value\)\}/)
})

test('Proyecto abierto coloca Editar Presentar Congregación y Compartir arriba', () => {
  for (const label of ['Editar', 'Presentar', 'Congregación', 'Compartir']) assert.match(workspace, new RegExp(`>${label}<\\/button>`))
  assert.match(workspace, /type Vista = 'contenido' \| 'presentacion' \| 'congregacion' \| 'publicar'/)
  assert.match(detailStyles, /herramientas arriba, un solo panel activo/)
  assert.match(detailStyles, /position: sticky/)
  assert.doesNotMatch(detailStyles, /position: fixed/)
  assert.match(detailStyles, /background: transparent !important/)
  assert.match(detailStyles, /box-shadow: none !important/)
})

test('Proyectos existentes permanecen cerrados hasta solicitarlos', () => {
  assert.match(packages, /pastoral-projects-accordion/)
  assert.doesNotMatch(packages, /<details[^>]*\sopen(?:\s|=|>)/)
})

test('Áreas internas usan encabezado compacto sin descripción permanente', () => {
  assert.doesNotMatch(header, /pastoral-page-description/)
  assert.match(styles, /\.pastoral-page-description[\s\S]*display: none/)
  assert.match(styles, /\.pastoral-back-link[\s\S]*background: transparent/)
})
