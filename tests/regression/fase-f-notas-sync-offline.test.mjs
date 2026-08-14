import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const localStorePath = new URL('../../lib/biblia/notes-local.ts', import.meta.url)
const queuePath = new URL('../../lib/biblia/notes-queue.ts', import.meta.url)
const syncPath = new URL('../../lib/biblia/notes-sync.ts', import.meta.url)

test('FASE F: la cola offline conserva dueño y última operación por nota', async () => {
  const queue = await readFile(queuePath, 'utf8')
  assert.match(queue, /ownerId: string/)
  assert.match(queue, /vida-biblia-notas-sync-v1/)
  assert.match(queue, /encolarUpsertNotaBiblica/)
  assert.match(queue, /encolarDeleteNotaBiblica/)
  assert.match(queue, /item\.ownerId === ownerId/)
})

test('FASE F: la sincronización usa UUID local y las notas nuevas de Biblia no ocupan pasaje único de Estudio Profundo', async () => {
  const [localStore, sync] = await Promise.all([
    readFile(localStorePath, 'utf8'),
    readFile(syncPath, 'utf8'),
  ])

  assert.match(sync, /id: nota\.id/)
  assert.match(sync, /profile_id: userId/)
  assert.match(localStore, /pasajeNormalizado: ''/)
  assert.match(sync, /pasaje_normalizado: textoONull\(nota\.pasajeNormalizado, 1000\)/)
  assert.match(localStore, /origen: 'biblia_notas'/)
  assert.match(sync, /origen === 'biblia_notas'/)
  assert.match(sync, /operacion\.ownerId === user\.id/)
  assert.match(sync, /onConflict: 'id'/)
})

test('FASE F: al iniciar offline identifica la sesión antes de comprobar la red', async () => {
  const sync = await readFile(syncPath, 'utf8')
  const sessionIndex = sync.indexOf('supabase.auth.getSession()')
  const onlineIndex = sync.indexOf('navigator.onLine')

  assert.ok(sessionIndex >= 0)
  assert.ok(onlineIndex >= 0)
  assert.ok(sessionIndex < onlineIndex)
})

test('FASE F: cada guardado resuelve el usuario antes de encolar y preserva el orden', async () => {
  const [localStore, sync] = await Promise.all([
    readFile(localStorePath, 'utf8'),
    readFile(syncPath, 'utf8'),
  ])

  assert.match(sync, /export async function resolverUsuarioActualNotas/)
  assert.match(localStore, /resolverUsuarioActualNotas/)
  assert.match(localStore, /colaEncolado = colaEncolado\.then/)
  assert.match(localStore, /encolarCambiosTrasResolverUsuario\(anteriores, notas\)/)
  assert.doesNotMatch(localStore, /obtenerUsuarioActualNotas/)
})

test('FASE F: la sincronización drena reemplazos hasta alcanzar la última versión', async () => {
  const sync = await readFile(syncPath, 'utf8')

  assert.match(sync, /while \(true\)/)
  assert.match(sync, /const operaciones = leerOperacionesNotasPendientes\(\)/)
  assert.match(sync, /const pendientesActuales = leerOperacionesNotasPendientes\(\)/)
  assert.match(sync, /if \(pendientesActuales\.length === 0\) break/)
  assert.match(sync, /if \(huboError \|\| !huboProgreso\) break/)
  assert.match(sync, /completarOperacionNotaBiblica\(operacion\.id, operacion\.token, operacion\.ownerId\)/)
})

test('FASE F: Notas reintenta sincronización al recuperar la PWA', async () => {
  const localStore = await readFile(localStorePath, 'utf8')
  assert.match(localStore, /addEventListener\('online'/)
  assert.match(localStore, /addEventListener\('focus'/)
  assert.match(localStore, /visibilitychange/)
  assert.match(localStore, /sincronizarNotasBiblicasPendientes/)
})
