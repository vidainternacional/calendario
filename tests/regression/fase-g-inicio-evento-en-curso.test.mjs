import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Inicio distingue un evento ya iniciado que sigue vigente', () => {
  const inicio = source('components/inicio/InicioClient.tsx')

  assert.match(inicio, /const nextEventIsOngoing = Boolean\(/)
  assert.match(inicio, /nextEvent\?\.item_type === 'event'/)
  assert.match(inicio, /nextEventStart\.getTime\(\) <= clock\.getTime\(\)/)
  assert.match(inicio, /\{nextEventIsOngoing \? 'Evento en curso' : 'Tu próximo evento'\}/)
  assert.match(inicio, /Hoy · En curso · inició/)
  assert.match(inicio, /\{nextEventIsOngoing \? 'En curso' : 'Próximo'\}/)
})
