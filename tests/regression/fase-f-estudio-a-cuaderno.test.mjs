import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const client = fs.readFileSync('components/estudios/EstudioProfundoClient.tsx', 'utf8')
const estudio = fs.readFileSync('app/actions/estudio.ts', 'utf8')

test('FASE F: Estudio Profundo expone acciones claras hacia el cuaderno único', () => {
  assert.match(client, />\s*Mis notas\s*</)
  assert.match(client, /Guardar estudio en Notas/)
  assert.match(client, /href="\/biblia\/notas"/)
  assert.match(client, /Abrir mi cuaderno/)
})

test('FASE F: guardar el estudio reutiliza la misma nota canónica y evita duplicar el bloque', () => {
  assert.match(client, /const buildStudySnapshot = \(\) =>/)
  assert.match(client, /const mergeStudySnapshot = \(existing: string, snapshot: string\) =>/)
  assert.match(client, /━━ Estudio guardado · \$\{state\.pasaje\} ━━/)
  assert.match(client, /━━ Fin del estudio guardado ━━/)
  assert.match(client, /existing\.indexOf\(start\)/)
  assert.match(client, /guardarNota\(state\.pasaje, contenido\)/)
})

test('FASE F: Estudio Profundo conserva identidad estable por usuario y pasaje', () => {
  assert.match(estudio, /pasaje_normalizado: pasajeNormalizado/)
  assert.match(estudio, /origen: 'estudio_profundo'/)
  assert.match(estudio, /origen_key: `estudio-profundo:\$\{pasajeNormalizado\}`/)
  assert.match(estudio, /onConflict: 'profile_id, pasaje_normalizado'/)
  assert.doesNotMatch(estudio.slice(estudio.indexOf('export async function guardarNota')), /\.insert\(/)
})
