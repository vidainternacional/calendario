import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const runtime = fs.readFileSync('components/pastoral/PastoralTemplateRuntime.tsx', 'utf8')
const admin = fs.readFileSync('components/admin/PastoralTemplateAdminBuilder.tsx', 'utf8')

test('los fondos cambian solo el fondo y conservan los elementos existentes', () => {
  const inicio = workspace.indexOf('const aplicarPlantilla =')
  const fin = workspace.indexOf('const nuevaPagina =', inicio)
  const bloque = workspace.slice(inicio, fin)

  assert.match(bloque, /registrarHistorial\(\)/)
  assert.match(bloque, /patchPaginaSinHistorial\(\{ plantilla: 'limpia', fondo_modo: 'color', fondo: plantilla\.fondo, fondo_recurso_id: null, recurso_id: null \}\)/)
  assert.doesNotMatch(bloque, /elementos|tamano_fuente|alineacion|fuente|color_texto/)
})

test('el selector visual presenta fondos e imágenes sin Temas ni texto simulado', () => {
  assert.match(workspace, /\{ id: 'plantillas', label: 'Fondos' \}/)
  assert.match(workspace, /\{ id: 'recursos', label: 'Imágenes' \}/)
  const inicioSubmenu = workspace.indexOf('plantillas: [')
  const finSubmenu = workspace.indexOf('],', inicioSubmenu)
  assert.doesNotMatch(workspace.slice(inicioSubmenu, finSubmenu), /Temas/)
  const inicioPanel = workspace.indexOf("panel === 'plantillas'")
  const finPanel = workspace.indexOf("panel === 'temas'", inicioPanel)
  const panel = workspace.slice(inicioPanel, finPanel)
  assert.match(panel, /aria-label="Fondos en filas de tres"/)
  assert.doesNotMatch(panel, /<i className=/)
})

test('el texto nuevo nace centrado y entra en edición', () => {
  const inicio = workspace.indexOf('const agregarTexto =')
  const fin = workspace.indexOf('const aplicarRolTexto =', inicio)
  const bloque = workspace.slice(inicio, fin)

  assert.match(bloque, /alineacion: 'centro'/)
  assert.match(bloque, /requestAnimationFrame/)
  assert.match(bloque, /contenteditable=/)
  assert.match(bloque, /focus\(\{ preventScroll: true \}\)/)
})

test('el runtime legado deja de inyectar muestras de plantilla', () => {
  assert.match(runtime, /return null/)
  assert.doesNotMatch(runtime, /dispatchEvent|textoMuestra|setTimeout|querySelector/)
})

test('administración pastoral gestiona fondos sin editor de cajas de texto', () => {
  assert.match(admin, /Fondos del Centro Pastoral/)
  assert.match(admin, /Guardar fondos/)
  assert.match(admin, /guardarPlantillasPastoralesAdmin/)
  assert.doesNotMatch(admin, /PastoralVisualCanvas|Título \(edición\)|Subtítulo|Cuerpo \(edición\)/)
})
