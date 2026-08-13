import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workspacePath = new URL('../../components/biblia/BibleNotesWorkspace.tsx', import.meta.url)
const localStorePath = new URL('../../lib/biblia/notes-local.ts', import.meta.url)

test('FASE F: Biblia Notas usa una sola capa de almacenamiento local', async () => {
  const [workspace, localStore] = await Promise.all([
    readFile(workspacePath, 'utf8'),
    readFile(localStorePath, 'utf8'),
  ])

  assert.match(workspace, /leerNotasBiblicasLocales/)
  assert.match(workspace, /guardarNotasBiblicasLocales/)
  assert.doesNotMatch(workspace, /localStorage\.getItem/)
  assert.doesNotMatch(workspace, /localStorage\.setItem/)

  assert.match(localStore, /vida-biblia-notas-v2/)
  assert.match(localStore, /leerNotasBiblicasLocales/)
  assert.match(localStore, /guardarNotasBiblicasLocales/)
  assert.match(localStore, /agregarNotaBiblicaLocal/)
})
