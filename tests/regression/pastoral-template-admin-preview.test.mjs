import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const runtime = fs.readFileSync('components/pastoral/PastoralTemplateRuntime.tsx', 'utf8')
const proyecto = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')

test('Plantillas usa el mismo catálogo administrado para preview y muestras', () => {
  assert.match(proyecto, /PastoralTemplateRuntime/)
  assert.doesNotMatch(proyecto, /PastoralTemplateSampleRuntime/)
  assert.match(runtime, /Plantillas en filas de tres/)
  assert.match(runtime, /plantilla\[rol\]/)
  assert.match(runtime, /plantilla\.muestras\[rol\]/)
  assert.match(runtime, /caja\.x/)
  assert.match(runtime, /caja\.y/)
  assert.match(runtime, /caja\.w/)
  assert.match(runtime, /caja\.h/)
  assert.match(runtime, /caja\.pt/)
  assert.match(runtime, /caja\.interlineado/)
  assert.match(runtime, /caja\.fuente/)
  assert.match(runtime, /BASE_WIDTH_16_9 = 1100/)
  assert.match(runtime, /containerType = 'inline-size'/)
})
