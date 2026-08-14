import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const queuePath = new URL('../../lib/biblia/notes-queue.ts', import.meta.url)
const localStorePath = new URL('../../lib/biblia/notes-local.ts', import.meta.url)
const syncPath = new URL('../../lib/biblia/notes-sync.ts', import.meta.url)

test('FASE F: el borrado offline conserva el origen de la nota', async () => {
  const [queue, localStore, sync] = await Promise.all([
    readFile(queuePath, 'utf8'),
    readFile(localStorePath, 'utf8'),
    readFile(syncPath, 'utf8'),
  ])

  assert.match(queue, /origen\?: string/)
  assert.match(queue, /encolarDeleteNotaBiblica\(id: string, ownerId: string, origen\?: string\)/)
  assert.match(queue, /origen: origen\?\.trim\(\) \|\| 'biblia_notas'/)
  assert.match(localStore, /encolarDeleteNotaBiblica\(anterior\.id, ownerId, anterior\.origen\)/)
  assert.match(sync, /const origenBorrado = textoONull\(operacion\.origen, 100\) \?\? 'biblia_notas'/)
  assert.match(sync, /\.eq\('origen', origenBorrado\)/)
  assert.doesNotMatch(sync, /\.eq\('origen', 'biblia_notas'\)/)
})
