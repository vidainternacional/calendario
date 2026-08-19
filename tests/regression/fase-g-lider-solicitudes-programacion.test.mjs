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

test('el dashboard reserva liderazgo a es_lider y Pastor no recibe gestión global', () => {
  const hub = source('app/(app)/ministerios/[id]/page.tsx')
  const layout = source('app/(app)/ministerios/[id]/layout.tsx')

  assert.match(hub, /const esLiderMinisterio = mem\?\.es_lider === true/)
  assert.match(hub, /const accesoGlobal = perfil\?\.rol === 'administrador'/)
  assert.match(hub, /visible: esLiderMinisterio/)
  assert.match(hub, /\{esLiderMinisterio && <section>/)
  assert.match(hub, /Eres parte del equipo/)
  assert.doesNotMatch(hub, /mem\?\.es_lider === true \|\|/)
  assert.doesNotMatch(hub, /\['pastor', 'administrador'\]\.includes\(perfil\?\.rol\)/)

  assert.match(layout, /const esAdministrador = profile\?\.rol === 'administrador'/)
  assert.match(layout, /if \(!membresiaReq\.data && !esAdministrador\)/)
  assert.match(layout, /\{esLider && <PersonalizarMinisterioButton/)
  assert.match(layout, /puedeGestionar=\{esLider\}/)
  assert.doesNotMatch(layout, /profile\?\.rol === 'pastor'/)
  assert.doesNotMatch(layout, /MinisterioRoleContextSync/)
})

test('Administrador general es exclusivo del rol administrador', () => {
  const adminLayout = source('app/(app)/admin/layout.tsx')
  const perfil = source('app/(app)/perfil/page.tsx')
  const adminActions = source('app/actions/admin.ts')
  const liderazgo = source('app/actions/liderazgo.ts')

  assert.match(adminLayout, /rol !== 'administrador'/)
  assert.doesNotMatch(adminLayout, /rol !== 'pastor'/)
  assert.match(perfil, /tienePanelAdministrativo = rolActual === 'administrador'/)
  assert.match(adminActions, /if \(rol !== 'administrador'\)/)
  assert.doesNotMatch(adminActions, /_rol\d+ !== 'pastor'/)
  assert.match(liderazgo, /Solo un administrador puede cambiar el liderazgo ministerial/)
  assert.doesNotMatch(liderazgo, /\.update\(\{ rol: 'lider' \}\)/)
  assert.doesNotMatch(liderazgo, /más de 2 ministerios/)
})

test('Solicitudes globales resuelve solo por Administrador o liderazgo contextual', () => {
  const page = source('app/(app)/solicitudes/page.tsx')
  const actions = source('app/actions/solicitudes.ts')

  assert.match(page, /const esAdministrador = rol === 'administrador'/)
  assert.match(page, /return esAdministrador \|\| ministeriosLider\.includes\(sol\.ministerio_id\)/)
  assert.doesNotMatch(page, /esPastorAdmin/)

  assert.match(actions, /obtenerContextoResolucionSolicitud/)
  assert.match(actions, /\.select\('es_lider'\)/)
  assert.match(actions, /Solo un administrador o líder de este ministerio puede resolver solicitudes/)
  assert.match(actions, /\.eq\('estado', 'pendiente'\)/)
  assert.doesNotMatch(actions, /rol === 'pastor'/)
})

test('la migración elimina el límite de dos liderazgos y privilegios administrativos antiguos de Pastor', () => {
  const migration = source('supabase/migrations/20260818020500_fase_g_separar_admin_liderazgo_ministerial.sql')

  assert.match(migration, /DROP TRIGGER IF EXISTS trg_max_liderazgos/)
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.check_max_liderazgos/)
  assert.match(migration, /DROP POLICY IF EXISTS pastor_gestiona_perfiles/)
  assert.match(migration, /DROP POLICY IF EXISTS pastor_gestiona_miembros/)
  assert.match(migration, /DROP POLICY IF EXISTS pastor_gestiona_ministerios/)
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

test('acciones ministeriales sensibles usan Administrador o liderazgo contextual, no Pastor global', () => {
  const programacion = source('app/actions/programacion-alabanza.ts')
  const servicios = source('app/actions/servicios-alabanza.ts')
  const equipo = source('app/actions/equipo-ministerial.ts')
  const repertorio = source('app/actions/repertorio-programacion.ts')
  const reemplazos = source('app/actions/reemplazos-ministeriales.ts')
  const solicitudes = source('app/actions/centro-solicitudes-ministerio.ts')

  for (const codigo of [programacion, servicios, equipo, repertorio, reemplazos, solicitudes]) {
    assert.match(codigo, /rol === 'administrador'/)
    assert.match(codigo, /es_lider/)
  }

  assert.doesNotMatch(programacion, /\['administrador', 'pastor'\]\.includes\(profile\.rol\)/)
  assert.doesNotMatch(servicios, /\['administrador', 'pastor'\]\.includes\(profile\.rol\)/)
  assert.doesNotMatch(equipo, /\['administrador', 'pastor'\]\.includes\(profile\.rol\)/)
  assert.doesNotMatch(repertorio, /\['administrador', 'pastor'\]\.includes\(profile\.rol\)/)
  assert.doesNotMatch(reemplazos, /profile\.rol === 'pastor'/)
  assert.doesNotMatch(solicitudes, /profile\.rol === 'pastor'/)
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

test('acciones gestionables forman parte de Para ti y respetan liderazgo real', () => {
  const layout = source('app/(app)/layout.tsx')
  const shortcut = source('components/notificaciones/PendingAttentionShortcut.tsx')
  const indicators = source('components/notificaciones/usePendingIndicators.ts')

  assert.match(layout, /<PendingAttentionShortcut \/>/)
  assert.match(shortcut, /pendingMinisterioIngresos/)
  assert.match(shortcut, /pendingServicios/)
  assert.match(shortcut, /pendingSolicitudesGestionables/)
  assert.match(shortcut, /Mensajes y acciones directas según tu rol y responsabilidades/)
  assert.match(shortcut, /avisos-preview-title/)
  assert.match(shortcut, /const accesoGlobal = rol === 'administrador'/)
  assert.doesNotMatch(shortcut, /rol === 'administrador' \|\| rol === 'pastor'/)

  assert.match(indicators, /\.eq\('es_lider', true\)/)
  assert.match(indicators, /const esAdministrador = .*rol === 'administrador'/)
  assert.match(indicators, /\.in\('ministerio_id', ministeriosLiderados\)/)
  assert.match(indicators, /obtenerConteoSolicitudesGestionables/)
})

test('una nueva solicitud de ingreso notifica líderes reales y administradores', () => {
  const action = source('app/actions/ministerios.ts')

  assert.match(action, /notificarGestoresSolicitudIngreso/)
  assert.match(action, /service\.from\('ministerio_miembros'\).*eq\('es_lider', true\)/s)
  assert.match(action, /item\.rol === 'administrador'/)
  assert.doesNotMatch(action, /item\.rol === 'pastor'/)
  assert.doesNotMatch(action, /item\.es_pastor_general === true/)
  assert.match(action, /Solo un administrador o líder de este ministerio puede resolver solicitudes/)
  assert.match(action, /notifyUsersOnceByReference\(destinatarios/)
})
