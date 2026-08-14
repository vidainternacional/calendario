import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const estudio = fs.readFileSync('app/actions/estudio.ts', 'utf8')

test('FASE F: Estudio Profundo enriquece la misma fila canónica por pasaje', () => {
  const guardarInicio = estudio.indexOf('export async function guardarNota')
  assert.ok(guardarInicio >= 0)
  const guardar = estudio.slice(guardarInicio)

  assert.match(guardar, /\.from\('notas_estudio'\)/)
  assert.match(guardar, /\.upsert\(/)
  assert.match(guardar, /onConflict: 'profile_id, pasaje_normalizado'/)
  assert.match(guardar, /pasaje_normalizado: pasajeNormalizado/)
  assert.match(guardar, /tipo: 'estudio'/)
  assert.match(guardar, /referencia: pasaje\.slice\(0, 300\)/)
  assert.match(guardar, /origen: 'estudio_profundo'/)
  assert.match(guardar, /origen_key: `estudio-profundo:\$\{pasajeNormalizado\}`/)
  assert.match(guardar, /estado: 'activo'/)
})

test('FASE F: guardar desde Estudio Profundo no reemplaza metadatos ajenos', () => {
  const guardarInicio = estudio.indexOf('export async function guardarNota')
  const guardar = estudio.slice(guardarInicio)

  assert.doesNotMatch(guardar, /titulo:/)
  assert.doesNotMatch(guardar, /paquete_id:/)
  assert.doesNotMatch(guardar, /contexto:/)
  assert.doesNotMatch(guardar, /\.insert\(/)
})
