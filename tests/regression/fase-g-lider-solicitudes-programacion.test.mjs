import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Solicitudes ministeriales usa scroll natural del documento en iOS', () => {
  const page = source('app/(app)/ministerios/[id]/solicitudes/page.tsx')

  assert.match(page, /data-solicitudes-scroll="ministerio"/)
  assert.match(page, /min-h-\[100dvh\]/)
  assert.match(page, /touch-pan-y/)
  assert.match(page, /overflow-x-hidden/)
  assert.doesNotMatch(page, /overflow-y-auto/)
  assert.doesNotMatch(page, /overscroll-contain/)
})

test('el dashboard distingue liderazgo ministerial real de acceso global', () => {
  const hub = source('app/(app)/ministerios/[id]/page.tsx')
  const layout = source('app/(app)/ministerios/[id]/layout.tsx')

  assert.match(hub, /const esLiderMinisterio = mem\?\.es_lider === true/)
  assert.match(hub, /const accesoGlobal = \['pastor', 'administrador'\]\.includes\(perfil\?\.rol\)/)
  assert.match(hub, /visible: esLiderMinisterio/)
  assert.match(hub, /\{esLiderMinisterio && <section>/)
  assert.match(hub, /Eres parte del equipo/)
  assert.match(hub, /Acceso de gestión/)
  assert.doesNotMatch(hub, /mem\?\.es_lider === true \|\|/)

  assert.match(layout, /\{esLider && <PersonalizarMinisterioButton/)
  assert.match(layout, /puedeGestionar=\{esLider\}/)
  assert.doesNotMatch(layout, /MinisterioRoleContextSync/)
})

test('Programación presenta tarjetas mensuales, precarga adyacentes y limita consultas al mes visible', () => {
  const enhancer = source('components/ministerios/ProgramacionUXEnhancer.tsx')
  const calendar = source('lib/programacion/calendario-ministerial.ts')

  assert.match(enhancer, /aria-label="Meses de programación"/)
  assert.match(enhancer, /Trabaja un solo mes a la vez/)
  assert.match(enhancer, /router\.prefetch/)
  assert.match(enhancer, /mesPendiente/)
  assert.match(enhancer, /data-month-nav-legacy/)
  assert.match(enhancer, /border-top-width: 1px !important/)
  assert.doesNotMatch(enhancer, /border-top-width: 6px !important/)

  assert.match(calendar, /\.from\('eventos'\)[\s\S]*?\.gte\('fecha_inicio', start\)[\s\S]*?\.lt\('fecha_inicio', end\)/)
  assert.match(calendar, /\.from\('evento_calendarios'\)[\s\S]*?\.in\('evento_id', candidateIds\)/)
  assert.doesNotMatch(calendar, /\.from\('evento_calendarios'\)[\s\S]*?\.in\('calendar_id', sourceIds\)[\s\S]*?const eventIds = Array\.from\(eventCalendarMap\.keys\(\)\)/)
})

test('la biblioteca recupera canciones de servicios anteriores y las materializa al reutilizarlas', () => {
  const action = source('app/actions/repertorio-programacion.ts')
  const picker = source('components/ministerios/RepertorioBibliotecaPicker.tsx')

  assert.match(action, /export async function obtenerBibliotecaRepertorioMinisterio/)
  assert.match(action, /\.from\('evento_repertorio'\)/)
  assert.match(action, /id: `hist:\$\{String\(row\.id\)\}`/)
  assert.match(action, /async function materializarCancionHistorica/)
  assert.match(action, /cancionId\.startsWith\('hist:'\)/)
  assert.match(action, /\.from\('ministerio_canciones'\)[\s\S]*?\.insert\(/)

  assert.match(picker, /obtenerBibliotecaRepertorioMinisterio/)
  assert.match(picker, /setBiblioteca/)
  assert.match(picker, /Historial/)
  assert.match(picker, /biblioteca permanente/)
})

test('acciones gestionables forman parte de Para ti en Inicio y Avisos', () => {
  const layout = source('app/(app)/layout.tsx')
  const shortcut = source('components/notificaciones/PendingAttentionShortcut.tsx')
  const indicators = source('components/notificaciones/usePendingIndicators.ts')

  assert.match(layout, /<PendingAttentionShortcut \/>/)
  assert.match(shortcut, /pendingMinisterioIngresos/)
  assert.match(shortcut, /pendingServicios/)
  assert.match(shortcut, /pendingSolicitudesGestionables/)
  assert.match(shortcut, /Mensajes y acciones directas según tu rol y responsabilidades/)
  assert.match(shortcut, /avisos-preview-title/)
  assert.match(shortcut, /data\.pendingAttentionPreview|pendingAttentionPreview/)
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
