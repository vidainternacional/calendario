import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../app/(app)/biblia/notas/page.tsx', import.meta.url)
const workspacePath = new URL('../../components/biblia/BibleNotesWorkspace.tsx', import.meta.url)
const localPath = new URL('../../lib/biblia/notes-local.ts', import.meta.url)
const remotePath = new URL('../../lib/biblia/notes-remote.ts', import.meta.url)
const syncPath = new URL('../../lib/biblia/notes-sync.ts', import.meta.url)

test('FASE F: la caché canónica local queda separada por usuario sin borrar legado', async () => {
  const local = await readFile(localPath, 'utf8')
  assert.match(local, /vida-biblia-notas-v2/)
  assert.match(local, /vida-biblia-notas-v3/)
  assert.match(local, /\$\{VIDA_BIBLE_NOTES_USER_STORAGE_PREFIX\}:\$\{ownerId\}/)
  assert.match(local, /reemplazarNotasBiblicasLocalesDesdeServidor/)
  assert.match(local, /Las demás notas históricas sin dueño permanecen intactas/)
})

test('FASE F: la página identifica al usuario antes de abrir su cuaderno', async () => {
  const page = await readFile(pagePath, 'utf8')
  assert.match(page, /supabase\.auth\.getUser\(\)/)
  assert.match(page, /<BibleNotesWorkspace userId=\{user\.id\}/)
})

test('FASE F: el merge remoto preserva pendientes locales y usa tombstones en ambos orígenes canónicos', async () => {
  const remote = await readFile(remotePath, 'utf8')
  assert.match(remote, /pendientePorId\.has\(row\.id\)/)
  assert.match(remote, /operacion\.tipo === 'upsert'/)
  assert.match(remote, /row\.estado === 'eliminado'/)
  assert.match(remote, /remotaActualizada >= localActualizada/)
  assert.match(remote, /\.eq\('profile_id', ownerId\)/)
  assert.match(remote, /\.in\('origen', \['biblia_notas', 'estudio_profundo'\]\)/)
})

test('FASE F: borrar una nota publica tombstone sin conservar su contenido', async () => {
  const sync = await readFile(syncPath, 'utf8')
  assert.match(sync, /estado: 'eliminado'/)
  assert.match(sync, /nota: ''/)
  assert.match(sync, /updated_at: operacion\.encoladaEn/)
  assert.match(sync, /const origenBorrado = textoONull\(operacion\.origen, 100\) \?\? 'biblia_notas'/)
  assert.match(sync, /\.eq\('origen', origenBorrado\)/)
  assert.doesNotMatch(sync, /\.delete\(\)/)
})

test('FASE F: el workspace reconcilia al abrir y al reanudar sin polling', async () => {
  const workspace = await readFile(workspacePath, 'utf8')
  assert.match(workspace, /sincronizarNotasBiblicasPendientes/)
  assert.match(workspace, /obtenerNotasBiblicasRemotasMezcladas/)
  assert.match(workspace, /reemplazarNotasBiblicasLocalesDesdeServidor/)
  assert.match(workspace, /addEventListener\('online'/)
  assert.match(workspace, /addEventListener\('focus'/)
  assert.match(workspace, /visibilitychange/)
  assert.doesNotMatch(workspace, /setInterval/)
})
