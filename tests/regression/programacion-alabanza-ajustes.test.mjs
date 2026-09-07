import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const page = fs.readFileSync('app/(app)/ministerios/[id]/programacion/page.tsx', 'utf8')
const secciones = fs.readFileSync('components/ministerios/ProgramacionAlabanzaSecciones.tsx', 'utf8')
const repertorio = fs.readFileSync('components/ministerios/RepertorioServicioEditor.tsx', 'utf8')

test('Programación usa un solo control minimalista para abrir y ocultar', () => {
  assert.match(page, /Ocultar programación/)
  assert.match(page, /border-y border-slate-200 text-left text-xs font-extrabold text-slate-600/)
  assert.doesNotMatch(page, /bg-slate-900 px-3 text-\[11px\] font-extrabold text-white/)
  assert.doesNotMatch(secciones, /programacionAbierta/)
})

test('Crear una fecha nueva queda debajo del calendario y fuera del día seleccionado', () => {
  const crearFecha = page.indexOf('Crear una fecha nueva')
  const diaSeleccionado = page.indexOf('id="dia-seleccionado"')
  assert.ok(crearFecha > -1 && diaSeleccionado > -1 && crearFecha < diaSeleccionado)
})

test('Cifrado convierte saltos escapados en saltos reales', () => {
  assert.match(repertorio, /function saltosReales/)
  assert.match(repertorio, /saltosReales\(song\.acordes\)/)
})
