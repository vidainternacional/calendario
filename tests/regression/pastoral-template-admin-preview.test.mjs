import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const runtime = fs.readFileSync('components/pastoral/PastoralTemplateRuntime.tsx', 'utf8')
const proyecto = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const admin = fs.readFileSync('components/admin/PastoralTemplateAdminBuilder.tsx', 'utf8')

test('el catálogo administrado sigue conectado al Centro Pastoral sin runtime que altere contenido', () => {
  assert.match(proyecto, /PastoralTemplateRuntime/)
  assert.doesNotMatch(proyecto, /PastoralTemplateSampleRuntime/)
  assert.match(runtime, /return null/)
  assert.doesNotMatch(runtime, /querySelector|dispatchEvent|setTimeout|requestAnimationFrame/)
})

test('el administrador muestra fondos reales y no reconstruye texto de muestra', () => {
  assert.match(admin, /Fondos del Centro Pastoral/)
  assert.match(admin, /style=\{\{ background: item\.fondo \}\}/)
  assert.match(admin, /style=\{\{ background: plantilla\.fondo \}\}/)
  assert.doesNotMatch(admin, /PastoralVisualCanvas|plantilla\[rol\]|caja\.pt|caja\.interlineado/)
})
