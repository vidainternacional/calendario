import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/page.tsx', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('Proyecto pastoral usa páginas como fuente única de edición y presentación', () => {
  assert.match(page, /ProyectoContenidoWorkspace/)
  assert.match(workspace, /type Vista = 'contenido' \| 'presentacion' \| 'congregacion' \| 'publicar'/)
  assert.match(workspace, /const \[paginas, setPaginas\]/)
  assert.match(workspace, /cambiarVista\('presentacion'\)/)
  assert.match(workspace, />Presentar<\/button>/)
  assert.match(workspace, /Presenta las mismas páginas como diapositivas/)
})

test('Contenido mantiene una sola página activa y permite crear o eliminar páginas', () => {
  assert.match(workspace, /const \[indice, setIndice\] = useState\(0\)/)
  assert.match(workspace, /const nuevaPagina = \(\) =>/)
  assert.match(workspace, /const eliminarPagina = \(i = indice\) =>/)
  assert.match(workspace, /window\.confirm\(`/)
  assert.match(workspace, /Página \{i \+ 1\}/)
  assert.match(workspace, /aria-label="Nueva página"/)
})

test('Versículos se insertan en el rango activo y dejan el cursor listo para continuar', () => {
  assert.match(workspace, /useRef<Range \| null>/)
  assert.match(workspace, /window\.getSelection\(\)/)
  assert.match(workspace, /document\.createRange\(\)/)
  assert.match(workspace, /const insertarBloqueEnCursor = \(bloque: HTMLElement\) =>/)
  assert.match(workspace, /range\.insertNode\(frag\)/)
  assert.match(workspace, /nuevaSeleccion\.selectNodeContents\(destinoCaret\)/)
  assert.match(workspace, /bloque\.dir = 'ltr'/)
  assert.match(workspace, /agregado a Página/)
})

test('Selector pastoral permite múltiples versículos y concordancias internas sin cerrarse', () => {
  assert.match(workspace, /PastoralVersePicker/)
  assert.match(picker, /const \[seleccionados, setSeleccionados\]/)
  assert.match(picker, /elegidos\.forEach\(v => onInsert/)
  assert.match(picker, /setSeleccionados\(\[\]\)/)
  assert.doesNotMatch(picker, /elegidos\.forEach[\s\S]{0,220}onClose\(\)/)
  assert.match(picker, /setConcordanciaDe\(versiculo\)/)
  assert.match(picker, /aria-label="Volver a versículos"/)
  assert.match(picker, /agregarUno\(v\)/)
})

test('Herramientas editoriales y de inserción permanecen arriba del documento', () => {
  assert.match(workspace, /aria-label="Herramientas del contenido"/)
  for (const label of ['Negrita', 'Cursiva', 'Subrayado', 'Tachado', 'Deshacer', 'Rehacer', 'Limpiar']) assert.match(workspace, new RegExp(`label: '${label}'`))
  assert.match(workspace, /> Versículo<\/button>/)
  assert.match(workspace, /> Imagen<\/button>/)
  assert.match(workspace, /> Diseño<\/button>/)
  assert.doesNotMatch(workspace, /position:\s*fixed/)
})

test('Editor editable no se reinjecta en cada pulsación y el guardado captura el DOM actual', () => {
  const editorDesde = workspace.indexOf('ref={editorRef}')
  const editorHasta = workspace.indexOf('/>', editorDesde)
  const superficieEditable = workspace.slice(editorDesde, editorHasta)
  assert.ok(editorDesde >= 0 && editorHasta > editorDesde)
  assert.doesNotMatch(superficieEditable, /dangerouslySetInnerHTML/)
  assert.match(workspace, /const cargarEditor = \(html: string\) =>/)
  assert.match(workspace, /const snapshot = paginas\.map/)
  assert.match(workspace, /construirFormulario\(snapshot\)/)
})

test('Imágenes pueden insertarse dentro de la página o utilizarse como fondo', () => {
  assert.match(workspace, /'FIGURE', 'FIGCAPTION', 'IMG'/)
  assert.match(workspace, /const insertarImagen = \(recurso: Recurso\) =>/)
  assert.match(workspace, /figura\.appendChild\(imagen\)/)
  assert.match(workspace, /insertarBloqueEnCursor\(figura\)/)
  assert.match(workspace, /const usarImagenComoFondo = \(recurso: Recurso\) =>/)
  assert.match(workspace, />Fondo<\/button>/)
})

test('Cada página conserva recurso visual y plantilla sin crear tablas nuevas', () => {
  for (const plantilla of ['limpia', 'titulo', 'imagen', 'versiculo']) assert.match(workspace, new RegExp(`'${plantilla}'`))
  assert.match(workspace, /diapositiva_plantilla/)
  assert.match(actions, /formData\.getAll\('diapositiva_plantilla'\)/)
  assert.match(actions, /plantilla: plantillaValida/)
  assert.match(workspace, /pastoral-template-title:after/)
  assert.match(workspace, /pastoral-template-verse:before/)
  assert.doesNotMatch(actions, /create table|alter table/i)
})

test('Editor pastoral fuerza dirección LTR sin alterar el contenido hebreo insertado', () => {
  assert.match(workspace, /<input dir="ltr" value=\{titulo\}/)
  assert.match(workspace, /<input dir="ltr" value=\{pagina\.titulo\}/)
  assert.match(workspace, /dir="ltr"\s+lang="es"\s+contentEditable/)
  assert.match(workspace, /unicodeBidi: 'isolate'/)
  assert.match(workspace, /writingMode: 'horizontal-tb'/)
  assert.match(workspace, /bloque\.dir = 'ltr'/)
})

test('Presentación reutiliza las páginas, conserva 16:9 y permite modo inmersivo', () => {
  assert.match(workspace, /const \[modoPresentacion, setModoPresentacion\]/)
  assert.match(workspace, /className=\{`pastoral-presentation-slide/)
  assert.match(workspace, /aspect-video/)
  assert.match(workspace, /setModoPresentacion\(true\)/)
  assert.match(workspace, /setModoPresentacion\(false\)/)
  assert.match(workspace, /onTouchStart/)
  assert.match(workspace, /moverPresentacion/)
})

test('El editor nuevo queda aislado del workspace móvil legado', () => {
  assert.doesNotMatch(page, /workspace-mobile\.css/)
  assert.doesNotMatch(page, /PaqueteDetalleClient/)
  assert.doesNotMatch(page, /PastoralMobileWorkspaceShell/)
})
