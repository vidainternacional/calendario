import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const runtime = fs.readFileSync('components/pastoral/PastoralEditorRuntimeEnhancements.tsx', 'utf8')

test('cabecera mantiene Editar Presentar Congregación y Compartir sin perder páginas', () => {
  assert.match(runtime, /setProperty\('grid-template-columns', '54px 80px 92px minmax\(0, 1fr\)', 'important'\)/)
  assert.match(runtime, /congregacion\.hidden = false/)
  assert.match(runtime, /congregacion\.style\.removeProperty\('display'\)/)
  assert.match(runtime, /grupo\.style\.justifyContent = 'space-between'/)
  assert.match(runtime, /compartir\.style\.flex = '0 0 66px'/)
  assert.match(runtime, /data\.pastoralPageStep|dataset\.pastoralPageStep/)
  assert.match(runtime, /Página anterior/)
  assert.match(runtime, /Página siguiente/)
})

test('fondo de imagen preserva proporción y no añade una capa oscura al bloquearlo', () => {
  assert.match(canvas, /fondoRecurso\?\.acceso_url[\s\S]*object-contain/)
  assert.doesNotMatch(canvas, /bg-black\/15/)
  assert.doesNotMatch(canvas, /fondoRecurso\?\.acceso_url[\s\S]{0,180}object-cover/)
})

test('Imagen y Como fondo son reversibles sin volver a subir el recurso', () => {
  assert.match(workspace, /const restaurarFondoComoImagen = \(\) =>/)
  assert.match(workspace, /tipo: 'imagen', recurso_id: recursoId, x: 12, y: 18, w: 56, h: 48/)
  assert.match(workspace, /ajuste: 'contain', radio: 14, opacidad: 1/)
  assert.match(workspace, /pagina\.fondo_modo === 'imagen'[\s\S]{0,220}restaurarFondoComoImagen\(\)/)
  assert.match(workspace, /setDestinoSubida\('elemento'\)/)
})

test('Fondo de página se desbloquea con cualquiera de las referencias compatibles', () => {
  assert.match(workspace, /const recursoId = pagina\.fondo_recurso_id \?\? pagina\.recurso_id/)
  assert.match(workspace, /pagina\.fondo_modo === 'imagen' && \(pagina\.fondo_recurso_id \?\? pagina\.recurso_id\)/)
  assert.match(workspace, /aria-label="Desbloquear fondo"/)
})

test('acciones de capa permanecen ocultas hasta deslizar y muestran los tres botones completos', () => {
  assert.match(workspace, /const DESPLAZAMIENTO_ACCIONES_CAPA = 164/)
  assert.match(workspace, /accionesAbiertas \? 'pointer-events-auto[^']*opacity-100' : 'pointer-events-none[^']*opacity-0'/)
  assert.match(workspace, /aria-hidden=\{!accionesAbiertas\}/)
  assert.match(workspace, /tabIndex=\{accionesAbiertas \? 0 : -1\}/)
  assert.match(workspace, /translateX\(-\$\{DESPLAZAMIENTO_ACCIONES_CAPA\}px\)/)
  for (const accion of ['Duplicar', 'Bloquear', 'Eliminar']) assert.ok(workspace.includes(accion))
})

test('arrastre de capas sigue el dedo acomoda vecinas y fija el orden una vez al soltar sin salto intermedio', () => {
  const mover = workspace.slice(workspace.indexOf('const moverArrastreCapa'), workspace.indexOf('const terminarArrastreCapa'))
  const terminar = workspace.slice(workspace.indexOf('const terminarArrastreCapa'), workspace.indexOf('const cancelarArrastreCapa'))
  assert.match(mover, /translateY\(\$\{delta\}px\)/)
  assert.match(mover, /compensacion = -arrastre\.altoFila/)
  assert.match(mover, /compensacion = arrastre\.altoFila/)
  assert.match(mover, /cubic-bezier\(\.32,\.72,0,1\)/)
  assert.doesNotMatch(mover, /fijarOrdenCapaSinHistorial/)
  assert.match(terminar, /registrarHistorial\(\)/)
  assert.ok(terminar.indexOf('limpiarEstiloArrastre(arrastre)') < terminar.indexOf('fijarOrdenCapaSinHistorial(id, arrastre.indiceDestino)'))
  assert.doesNotMatch(terminar, /requestAnimationFrame/)
})

test('Mover del lienzo tiene una sola autoridad de posición', () => {
  assert.doesNotMatch(runtime, /function posicionarControlesFlotantes/)
  assert.doesNotMatch(runtime, /posicionarControlesFlotantes\(\)/)
  assert.match(canvas, /style=\{estiloControlesFlotantes\(elemento, pagina\.elementos \?\? \[], lienzoRef\.current\?\.getBoundingClientRect\(\)\)\}/)
})

test('versículos nuevos parten de tamaño moderado y tipografía integrada', () => {
  assert.match(workspace, /tipo: 'versiculo'[\s\S]{0,260}tamano_fuente: 18, fuente: 'Inter', alineacion: 'izquierda'/)
  assert.match(workspace, /interlineado: 1\.35/)
  assert.match(workspace, /sombreado: false/)
})