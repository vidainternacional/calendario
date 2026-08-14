import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const experiencePath = new URL('../../components/biblia/BibleExperienceFixes.tsx', import.meta.url)
const localStorePath = new URL('../../lib/biblia/notes-local.ts', import.meta.url)

test('FASE F: crear nota desde un versículo usa el motor central de Notas', async () => {
  const [experience, localStore] = await Promise.all([
    readFile(experiencePath, 'utf8'),
    readFile(localStorePath, 'utf8'),
  ])

  assert.match(experience, /agregarNotaBiblicaLocal/)
  assert.match(experience, /tipo: 'versiculo'/)
  assert.match(experience, /router\.push\(`\/biblia\/notas\?nota=/)
  assert.doesNotMatch(experience, /vida-biblia-notas-v2/)
  assert.doesNotMatch(experience, /localStorage\.setItem\([^\n]*NOTAS/)

  assert.match(localStore, /export function agregarNotaBiblicaLocal/)
  assert.match(localStore, /guardarNotasBiblicasLocales/)
})
