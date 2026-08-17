import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Solicitudes ministeriales conserva scroll táctil propio en iOS', () => {
  const page = source('app/(app)/ministerios/[id]/solicitudes/page.tsx')

  assert.match(page, /data-solicitudes-scroll="ministerio"/)
  assert.match(page, /h-\[100dvh\]/)
  assert.match(page, /overflow-y-auto/)
  assert.match(page, /touch-pan-y/)
  assert.match(page, /\[-webkit-overflow-scrolling:touch\]/)
})

test('la relación visible del ministerio distingue liderazgo contextual de gestión global', () => {
  const layout = source('app/(app)/ministerios/[id]/layout.tsx')
  const sync = source('components/ministerios/MinisterioRoleContextSync.tsx')

  assert.match(layout, /esMiembroMinisterio = Boolean\(membresiaReq\.data\)/)
  assert.match(layout, /esLider = Boolean\(\(membresiaReq\.data as any\)\?\.es_lider\)/)
  assert.match(layout, /gestionGlobal=\{Boolean\(isAdminOrPastor\)\}/)
  assert.match(sync, /Eres parte del equipo/)
  assert.match(sync, /Acceso de gestión/)
  assert.match(sync, /Gestión del ministerio/)
  assert.doesNotMatch(sync, /set.*es_lider|update\(.*es_lider/s)
})

test('Programación presenta tarjetas mensuales y una sola superficie mensual activa', () => {
  const enhancer = source('components/ministerios/ProgramacionUXEnhancer.tsx')

  assert.match(enhancer, /aria-label="Meses de programación"/)
  assert.match(enhancer, /Trabaja un solo mes a la vez/)
  assert.match(enhancer, /href=\{`\$\{pathname\}\?mes=\$\{mes\}`\}/)
  assert.match(enhancer, /data-month-nav-legacy/)
  assert.match(enhancer, /border-top-width: 1px !important/)
  assert.doesNotMatch(enhancer, /border-top-width: 6px !important/)
})

test('pendientes gestionables aparecen en Inicio y Avisos sin crear otro sistema', () => {
  const layout = source('app/(app)/layout.tsx')
  const shortcut = source('components/notificaciones/PendingAttentionShortcut.tsx')
  const indicators = source('components/notificaciones/usePendingIndicators.ts')

  assert.match(layout, /<PendingAttentionShortcut \/>/)
  assert.match(shortcut, /pendingMinisterioIngresos/)
  assert.match(shortcut, /pendingSolicitudesGestionables/)
  assert.match(shortcut, /\/admin\/solicitudes-ministerios/)
  assert.match(shortcut, /\/solicitudes/)
  assert.match(indicators, /obtenerConteoSolicitudesGestionables/)
})

test('una nueva solicitud de ingreso notifica líderes y gestión global activa', () => {
  const action = source('app/actions/ministerios.ts')

  assert.match(action, /notificarGestoresSolicitudIngreso/)
  assert.match(action, /service\.from\('ministerio_miembros'\).*eq\('es_lider', true\)/s)
  assert.match(action, /service\s*\.from\('profiles'\)/)
  assert.match(action, /item\.rol === 'administrador'/)
  assert.match(action, /item\.rol === 'pastor'/)
  assert.match(action, /item\.es_pastor_general === true/)
  assert.match(action, /notifyUsersOnceByReference\(destinatarios/)
})
