import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const runtime = fs.readFileSync('components/pastoral/PastoralEditorRuntimeEnhancements.tsx', 'utf8')

test('cabecera reserva espacio real para Presentar Compartir y páginas pese al grid estable', () => {
  assert.match(runtime, /setProperty\('grid-template-columns', '50px 72px minmax\(0, 1fr\)', 'important'\)/)
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
  assert.match(workspace, /pagina\.fondo_modo === 'imagen'[\s\S]{0,180}desbloquearFondo\(\)/)
  assert.match(workspace, /const desbloquearFondo = \(\) =>/)
  assert.match(workspace, /ajuste: 'contain', radio: 0, opacidad: 1/)
  assert.match(workspace, /fondo_modo: 'color', fondo: '#ffffff'/)
  assert.match(workspace, /setDestinoSubida\('elemento'\)/)
})

test('acciones de capa permanecen ocultas hasta deslizar y muestran los tres botones completos', () => {
  assert.match(workspace, /const DESPLAZAMIENTO_ACCIONES_CAPA = 150/)
  assert.match(workspace, /accionesAbiertas \? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'/)
  assert.match(workspace, /translateX\(-\$\{DESPLAZAMIENTO_ACCIONES_CAPA\}px\)/)
  for (const accion of ['Duplicar', 'Bloquear', 'Eliminar']) assert.ok(workspace.includes(accion))
})

test('arrastre de capas sigue el dedo y solo fija el orden al soltar con un historial', () => {
  const mover = workspace.slice(workspace.indexOf('const moverArrastreCapa'), workspace.indexOf('const terminarArrastreCapa'))
  const terminar = workspace.slice(workspace.indexOf('const terminarArrastreCapa'), workspace.indexOf('const cancelarArrastreCapa'))
  assert.match(mover, /translateY\(\$\{delta\}px\)/)
  assert.doesNotMatch(mover, /reordenarCapaSinHistorial/)
  assert.match(terminar, /registrarHistorial\(\)/)
  assert.match(terminar, /reordenarCapaSinHistorial\(id, direccion\)/)
})

test('versículos nuevos parten de tamaño moderado y tipografía integrada', () => {
  assert.match(workspace, /tipo: 'versiculo'[\s\S]{0,260}tamano_fuente: 18, fuente: 'Inter', alineacion: 'izquierda'/)
  assert.match(workspace, /interlineado: 1\.35/)
  assert.match(workspace, /sombreado: false/)
})
