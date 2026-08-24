import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspace.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/page.tsx', 'utf8')
const actions = fs.readFileSync('app/actions/pastoral-paquetes.ts', 'utf8')

test('Proyecto pastoral activa el workspace visual sin reintroducir el workspace legado', () => {
  assert.match(page, /ProyectoContenidoWorkspace/)
  assert.match(wrapper, /PastoralVisualWorkspace/)
  assert.doesNotMatch(page, /workspace-mobile\.css/)
  assert.doesNotMatch(page, /PaqueteDetalleClient/)
  assert.doesNotMatch(page, /PastoralMobileWorkspaceShell/)
})

test('Cada página es un lienzo con elementos posicionables y capas', () => {
  assert.match(model, /type FormatoLienzo = '16:9' \| '9:16' \| '4:3' \| '1:1'/)
  assert.match(model, /type ElementoCanvas =/)
  for (const campo of ['x: number', 'y: number', 'w: number', 'h: number', 'z: number']) assert.match(model, new RegExp(campo))
  assert.match(canvas, /tipo: 'mover' \| 'redimensionar'/)
  assert.match(canvas, /onPointerMove=\{moverGesto\}/)
  assert.match(canvas, /aria-label="Mover elemento"/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
})

test('Proyectos anteriores se normalizan al nuevo lienzo sin perder título ni contenido', () => {
  assert.match(model, /normalizarPaginaCanvas/)
  assert.match(model, /if \(!elementos\.length && item\.titulo\)/)
  assert.match(model, /if \(!elementos\.length && item\.contenido\)/)
  assert.match(workspace, /presentacion_diapositivas\.map\(normalizarPaginaCanvas\)/)
})

test('Herramientas se separan en acordeones Fondo Texto Párrafo Recursos Biblia y Diseño', () => {
  for (const nombre of ['Fondo', 'Texto', 'Párrafo', 'Recursos', 'Biblia', 'Diseño']) assert.match(workspace, new RegExp(`label: '${nombre}'`))
  assert.match(workspace, /setPanel\(\(actual\) => actual === id \? null : id\)/)
  assert.match(workspace, /aria-label="Herramientas del lienzo"/)
})

test('Fondo admite imagen color y temas predefinidos', () => {
  assert.match(workspace, /prepararSubida\('fondo'\)/)
  assert.match(workspace, /fondo_modo: 'color'/)
  assert.match(workspace, /fondo_modo: 'tema'/)
  assert.match(workspace, /fondo_modo: 'imagen'/)
  for (const tema of ['claro', 'amanecer', 'cielo', 'bosque', 'noche', 'vino']) assert.match(model, new RegExp(`id: '${tema}'`))
})

test('Texto usa cajas movibles con fuentes y formato independiente', () => {
  assert.match(workspace, /Caja de texto/)
  for (const fuente of ['Inter', 'Arial', 'Georgia', 'Trebuchet MS', 'Times New Roman', 'Courier New']) assert.match(model, new RegExp(fuente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(workspace, /tamano_fuente/)
  assert.match(workspace, /subrayado/)
  assert.match(workspace, /tachado/)
  assert.match(canvas, /contentEditable=\{editable\}/)
})

test('Párrafo queda separado de Texto e incluye alineación listas e interlineado', () => {
  assert.match(workspace, /panel === 'parrafo'/)
  assert.match(workspace, /insertUnorderedList/)
  assert.match(workspace, /insertOrderedList/)
  assert.match(workspace, /Interlineado/)
  assert.match(workspace, /alinear\('centro'\)/)
})

test('Imágenes permiten composición múltiple fondo capas borrado duplicado y ajuste', () => {
  assert.match(workspace, /const agregarImagen =/)
  assert.match(workspace, /tipo: 'imagen'/)
  assert.match(workspace, /Duplicar/)
  assert.match(workspace, /Adelante/)
  assert.match(workspace, /Atrás/)
  assert.match(workspace, /Borrar/)
  assert.match(workspace, /Ajuste:/)
  assert.match(workspace, /Opacidad/)
  assert.match(workspace, /Esquinas/)
  assert.doesNotMatch(workspace, /slice\(0, 2\)/)
})

test('Subir imagen reutiliza la Biblioteca Pastoral existente y no crea infraestructura paralela', () => {
  assert.match(workspace, /subirArchivoBibliotecaPastoral/)
  assert.match(workspace, /paquete_id/)
  assert.match(workspace, /categoria', 'multimedia'/)
  assert.doesNotMatch(actions, /create table|alter table|create policy/i)
})

test('Recursos ofrece biblioteca propia y bancos externos con recordatorio de derechos', () => {
  assert.match(workspace, /Buscar en mi biblioteca/)
  for (const banco of ['Unsplash', 'Pexels', 'Pixabay']) assert.match(workspace, new RegExp(banco))
  assert.match(workspace, /derechos de personas, marcas u obras visibles/)
})

test('Biblia inserta versículos como elementos independientes y selector conserva multiselección y concordancias', () => {
  assert.match(workspace, /tipo: 'versiculo'/)
  assert.match(workspace, /PastoralVersePicker/)
  assert.match(picker, /const \[seleccionados, setSeleccionados\]/)
  assert.match(picker, /elegidos\.forEach\(v => onInsert/)
  assert.match(picker, /setConcordanciaDe\(versiculo\)/)
  assert.match(picker, /aria-label="Volver a versículos"/)
})

test('Deshacer y Rehacer son globales siempre visibles y cubren páginas metadatos y gestos', () => {
  assert.match(workspace, /undoRef = useRef<Snapshot\[\]>/)
  assert.match(workspace, /redoRef = useRef<Snapshot\[\]>/)
  assert.match(workspace, /const registrarHistorial =/)
  assert.match(workspace, /const deshacer =/)
  assert.match(workspace, /const rehacer =/)
  assert.match(workspace, /aria-label="Deshacer"/)
  assert.match(workspace, /aria-label="Rehacer"/)
  assert.match(workspace, /onBeginChange=\{registrarHistorial\}/)
  assert.match(workspace, /registrarHistorial\(\); setPaginas/)
})

test('Los formatos responden a móvil iPad computadora y distintas relaciones de aspecto', () => {
  for (const formato of ['16:9', '9:16', '4:3', '1:1']) assert.match(model, new RegExp(formato.replace(':', '\\:')))
  assert.match(canvas, /aspectRatio: aspectoLienzo/)
  assert.match(canvas, /maxWidth: pagina\.formato === '9:16'/)
  assert.match(workspace, /sm:grid-cols-4/)
})

test('Presentar y Congregación reutilizan el mismo lienzo y ambos admiten pantalla completa', () => {
  assert.match(workspace, /vista === 'presentacion'/)
  assert.match(workspace, /vista === 'congregacion'/)
  const usosCanvas = workspace.match(/<PastoralVisualCanvas pagina=\{pagina\}/g) ?? []
  assert.ok(usosCanvas.length >= 3)
  assert.match(workspace, /requestFullscreen/)
  assert.match(workspace, /exitFullscreen/)
  assert.match(workspace, /Mismo lienzo y formato/)
  assert.match(workspace, /Exactamente la misma composición/)
})

test('Compartir conserva distribución existente y suma PDF y enlace actual sin fingir enlace público', () => {
  assert.match(workspace, /PackageDistributionControls/)
  assert.match(workspace, /window\.print\(\)/)
  assert.match(workspace, /Exportar PDF/)
  assert.match(workspace, /navigator\.share/)
  assert.match(workspace, /navigator\.clipboard\.writeText/)
  assert.match(workspace, /capa segura de publicación y emparejamiento/)
  assert.match(workspace, /no se exponen anónimamente todavía/)
})

test('Persistencia usa el JSON de diapositivas existente con formato fondo y elementos', () => {
  for (const campo of ['diapositiva_formato', 'diapositiva_fondo_modo', 'diapositiva_fondo_tema', 'diapositiva_fondo_recurso_id', 'diapositiva_elementos']) {
    assert.match(workspace, new RegExp(campo))
    assert.match(actions, new RegExp(campo.replace('diapositiva_', 'diapositiva_')))
  }
  assert.match(actions, /elementosValidos/)
  assert.doesNotMatch(actions, /create table|alter table|create policy|grant /i)
})
