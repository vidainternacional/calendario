import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const ajustes = fs.readFileSync('components/ministerios/ProgramacionVistaAjustes.tsx', 'utf8')
const repertorio = fs.readFileSync('components/ministerios/RepertorioServicioEditor.tsx', 'utf8')

test('Programación mueve crear fecha sin eliminar el acceso Abrir programación', () => {
  assert.doesNotMatch(ajustes, /\.remove\(\)/)
  assert.match(ajustes, /insertAdjacentElement\('beforebegin', crearFecha\)/)
})

test('Cifrado convierte saltos escapados en saltos reales', () => {
  assert.match(repertorio, /function saltosReales/)
  assert.match(repertorio, /saltosReales\(song\.acordes\)/)
})
