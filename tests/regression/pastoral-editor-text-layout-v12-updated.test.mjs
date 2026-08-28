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

test('A+ crea texto y Título Subtítulo Cuerpo solo cambian el texto seleccionado desbloqueado', () => {
  const texto = workspace.slice(workspace.indexOf("panel === 'texto'"), workspace.indexOf("panel === 'biblia'"))
  assert.match(texto, /aria-label="Agregar texto"/)
  assert.match(texto, /<span className="text-base font-black">A<\/span><span className="text-sm font-black">\+<\/span>/)
  assert.match(texto, /ESTILOS_TEXTO\.filter\(\(item\) => item\.id !== 'libre'\)\.map/)
  assert.match(texto, /disabled=\{!textoSeleccionado \|\| textoSeleccionado\.bloqueado\}[\s\S]*onClick=\{\(\) => aplicarRolTexto\(estilo\.id\)\}/)
  for (const entrada of ["{ id: 'titulo', label: 'Título'", "{ id: 'subtitulo', label: 'Subtítulo'", "{ id: 'cuerpo', label: 'Cuerpo'"]) assert.ok(model.includes(entrada))
  assert.match(texto, /min-h-12/)
  assert.doesNotMatch(texto, /Opciones de estilo de texto[\s\S]{0,1000}rounded-full/)
  assert.match(workspace, /if \(!textoSeleccionado \|\| textoSeleccionado\.bloqueado\) return\n    if \(textoSeleccionado\.rol === rol\) return actualizarElemento\(textoSeleccionado\.id, \{ rol: 'libre' \}\)/)
  assert.doesNotMatch(workspace, /if \(!textoSeleccionado\) return agregarTexto\(rol\)/)
})

test('Plantillas aplican estilo con escala inicial segura sin alterar geometría aprobada y Temas no cambian su fuente', () => {
  const plantilla = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  const rama = plantilla.slice(plantilla.indexOf('if (tieneTextoUsuario)'), plantilla.indexOf('const imagenesActuales'))
  const paleta = workspace.slice(workspace.indexOf('const aplicarPaleta'), workspace.indexOf('const aplicarPlantilla'))
  assert.match(plantilla, /const tieneTextoUsuario = textos\.some/)
  assert.match(rama, /if \(elemento\.tipo === 'imagen'\) return elemento/)
  assert.doesNotMatch(rama, /x: layout\.x|y: layout\.y|w: layout\.w|h: layout\.h/)
  assert.match(rama, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
  assert.match(rama, /alineacion: layout\.alineacion/)
  assert.match(rama, /fuente: layout\.fuente/)
  assert.match(rama, /fondo: plantilla\.fondo/)
  assert.match(plantilla, /textoMuestraPlantilla\(plantilla, rol\)/)
  assert.match(plantilla, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
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
  for (const label of ['Reducir tamaño de letra','Aumentar tamaño de letra','Reducir interlineado','Aumentar interlineado','Lista con viñetas','Lista numerada','Justificar']) assert.match(texto, new RegExp(`aria-label="${label}"`))
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

test('la caja usa el tirador de esquina para redimensionar sin un segundo botón flotante', () => {
  assert.match(canvas, /aria-label="Mover elemento"/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
  assert.match(canvas, /iniciarGesto\(event, elemento, 'redimensionar'\)/)
  assert.doesNotMatch(canvas, /aria-label="Ajustar caja al texto"|const ajustarTextoAlContenido/)
})

test('Capas usa pipeline por arrastre y swipe con visibilidad, bloqueo y acciones circulares', () => {
  const capas = workspace.slice(workspace.indexOf("panel === 'capas'"), workspace.indexOf("panel === 'ajustes'"))
  assert.match(capas, /aria-label="Lista vertical de capas"/)
  assert.match(capas, /alternarVisibilidadCapa\(elemento\.id\)/)
  assert.match(capas, /<EyeOff className=/)
  assert.match(capas, /<Eye className=/)
  assert.match(capas, /Fondo de página/)
  assert.match(capas, /<GripVertical className=/)
  assert.match(capas, /iniciarArrastreCapa\(event, elemento\.id\)/)
  assert.match(capas, /moverArrastreCapa\(event, elemento\.id\)/)
  assert.match(workspace, /const DESPLAZAMIENTO_ACCIONES_CAPA = 150/)
  assert.match(capas, /translateX\(-\$\{DESPLAZAMIENTO_ACCIONES_CAPA\}px\)/)
  assert.match(capas, /pointer-events-none opacity-0/)
  assert.match(capas, /duplicarElemento\(elemento\.id\)/)
  assert.match(capas, /alternarBloqueoCapa\(elemento\.id\)/)
  assert.match(capas, /eliminarElemento\(elemento\.id\)/)
  assert.doesNotMatch(capas, />Adelante|>Atrás|\{elemento\.z\}<\/small>/)
  assert.match(model, /oculto\?: boolean/)
  assert.match(model, /oculto: Boolean\(item\.oculto\)/)
  assert.match(canvas, /display: elemento\.oculto \? 'none' : undefined/)
  const terminar = workspace.slice(workspace.indexOf('const terminarArrastreCapa ='), workspace.indexOf('const cancelarArrastreCapa ='))
  assert.ok(terminar.indexOf('limpiarEstiloArrastre(arrastre)') < terminar.indexOf('fijarOrdenCapaSinHistorial(id, arrastre.indiceDestino)'))
  assert.doesNotMatch(terminar, /requestAnimationFrame/)
})

test('bloqueo de capa impide editar mover y redimensionar sin cambiar el modelo global', () => {
  assert.match(workspace, /type ElementoCanvasEditor = ElementoCanvas & \{ bloqueado\?: boolean; sombreado\?: boolean \}/)
  assert.match(workspace, /const alternarBloqueoCapa/)
  assert.match(canvas, /if \(!editable \|\| elemento\.bloqueado \|\| !lienzoRef\.current\) return/)
  assert.match(canvas, /editable=\{editable && !bloqueado\}/)
  assert.match(canvas, /\{activo && !bloqueado && <>/)
  assert.doesNotMatch(model, /bloqueado\?: boolean/)
})

test('una imagen o fondo visual puede desbloquearse como capa editable', () => {
  assert.match(workspace, /const convertirImagenEnFondo/)
  assert.match(workspace, /elementos: \(pagina\.elementos \?\? \[]\)\.filter\(\(item\) => item\.id !== id\)/)
  assert.match(workspace, /const desbloquearFondo/)
  assert.match(workspace, /aria-label="Desbloquear fondo"/)
  assert.match(workspace, /tipo: 'imagen', recurso_id: recursoId, x: 0, y: 0, w: 100, h: 100, z: 0/)
  assert.match(workspace, /fondo_visual: fondoVisual/)
  assert.match(model, /fondo_visual\?: string/)
})

test('versículos nuevos no fuerzan sombreado y Ajustes permite alternarlo', () => {
  assert.match(workspace, /tipo: 'versiculo'[\s\S]*sombreado: false/)
  assert.match(workspace, /Sombreado: \{elementoSeleccionado\.sombreado \? 'Activado' : 'Desactivado'\}/)
  assert.match(canvas, /elemento\.tipo === 'versiculo' && elemento\.sombreado/)
})

test('Justificado se representa y persiste sin degradarse a izquierda', () => {
  assert.match(model, /Alineacion = 'izquierda' \| 'centro' \| 'derecha' \| 'justificado'/)
  assert.match(model, /item\.alineacion === 'justificado'/)
  assert.match(canvas, /elemento\.alineacion === 'justificado' \? 'justify'/)
  assert.match(actions, /'izquierda', 'centro', 'derecha', 'justificado'/)
})

test('la navegación de páginas queda en la cabecera con retorno al Centro Pastoral', () => {
  assert.match(workspace, /Página \$\{indice \+ 1\} de \$\{paginas\.length\}/)
  assert.match(workspace, /aria-label="Nueva página"/)
  assert.match(workspace, /aria-label="Volver al Centro Pastoral"/)
  assert.match(workspace, /onClick=\{\(\) => router\.back\(\)\}/)
  assert.doesNotMatch(workspace, /pastoral-pages-strip/)
})

test('Compartir conserva solo distribución PDF compartir y enlace; la vista final vive en Presentar', () => {
  const compartir = workspace.slice(workspace.indexOf("vista === 'publicar'"), workspace.indexOf('pastoral-print-deck'))
  assert.match(compartir, /PackageDistributionControls/)
  assert.match(compartir, /<FileDown/)
  assert.match(compartir, /<Share2/)
  assert.match(compartir, /<Link2/)
  assert.doesNotMatch(compartir, /Vista de presentación|<PastoralVisualCanvas|Presentación/)
  assert.doesNotMatch(workspace, /abrirPresentacionDesdeCompartir/)
  const presentar = workspace.slice(workspace.indexOf("vista === 'presentacion'"), workspace.indexOf("vista === 'congregacion'"))
  assert.match(presentar, /Pantalla completa/)
  assert.match(presentar, /fitViewport=\{modoPresentacion\}/)
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
  assert.match(workspace, /Aplicar plantilla en blanco a la página actual/)
  assert.match(workspace, /aria-label="Borrar elemento seleccionado"/)
  assert.doesNotMatch(workspace, /Tema .* aplicado|Plantilla .* aplicada/)
  assert.match(css, /pastoral-tool-dock/)
})
