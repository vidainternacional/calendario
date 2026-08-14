import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const local = fs.readFileSync('lib/biblia/notes-local.ts', 'utf8')
const sync = fs.readFileSync('lib/biblia/notes-sync.ts', 'utf8')
const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260814192000_fase_f_correlativo_predicacion_seguro.sql', 'utf8')

test('FASE F: el modelo local conserva metadatos de predicación offline', () => {
  for (const campo of [
    'numeroPredicacion',
    'fechaPredicacion',
    'serie',
    'lugar',
    'predicador',
    'estadoPredicacion',
  ]) {
    assert.match(local, new RegExp(campo))
  }
  assert.match(local, /numeroPredicacion: null/)
})

test('FASE F: la subida separa estado técnico de estado de predicación y pide correlativo seguro', () => {
  assert.match(sync, /estado: 'activo'/)
  assert.match(sync, /estado_predicacion:/)
  assert.match(sync, /numero_predicacion:/)
  assert.match(sync, /fecha_predicacion:/)
  assert.match(sync, /rpc\('asignar_numero_predicacion_nota'/)
  assert.match(sync, /p_nota_id: nota\.id/)
  assert.match(sync, /estado_predicacion: null/)
})

test('FASE F: Supabase devuelve los metadatos canónicos al dispositivo', () => {
  assert.match(remote, /numero_predicacion/)
  assert.match(remote, /fecha_predicacion/)
  assert.match(remote, /estado_predicacion/)
  assert.match(remote, /numeroPredicacion:/)
  assert.match(remote, /fechaPredicacion:/)
  assert.match(remote, /estadoPredicacion:/)
  assert.match(remote, /serie,lugar,predicador,estado_predicacion/)
})

test('FASE F: el correlativo está protegido por usuario y no reutiliza estado técnico', () => {
  assert.match(migration, /security invoker/i)
  assert.match(migration, /pg_advisory_xact_lock/)
  assert.match(migration, /profile_id, numero_predicacion/)
  assert.match(migration, /estado_predicacion text/)
  assert.match(migration, /grant execute on function public\.asignar_numero_predicacion_nota\(uuid\) to authenticated/)
})
