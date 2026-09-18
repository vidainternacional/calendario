import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const hub = fs.readFileSync('app/(app)/ministerios/[id]/page.tsx', 'utf8')
const programacion = fs.readFileSync('app/(app)/ministerios/[id]/programacion/page.tsx', 'utf8')
const action = fs.readFileSync('app/actions/programacion-alabanza.ts', 'utf8')

test('Alabanza: una responsabilidad de paleta asignada expone Programación sin convertir a la persona en líder', () => {
  assert.match(hub, /ministerio_responsabilidad_asignaciones/)
  assert.match(hub, /eq\('ministerio_id',id\)\.eq\('codigo','paleta_colores'\)\.eq\('activo',true\)/)
  assert.match(hub, /const mostrarGestionAlabanza=esAlabanza&&\(esLiderMinisterio\|\|responsablePaleta\)/)
  assert.match(hub, /responsablePaleta\?/)
  assert.match(hub, /Gestión asignada/)
  assert.match(hub, /\/programacion/)
})

test('Alabanza: la pantalla del servicio conserva la edición de paleta protegida por puedePaleta', () => {
  assert.match(programacion, /const puedePaleta = puedeProgramar \|\| responsablePaleta/)
  assert.match(programacion, /puedePaleta=\{puedePaleta\}/)
  assert.match(action, /if \(!acceso\?\.puedePaleta\) fail\('No tienes permiso para editar la paleta de este servicio\.'\)/)
})
