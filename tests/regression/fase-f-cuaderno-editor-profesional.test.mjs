import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const estudios = fs.readFileSync('app/(app)/estudios/page.tsx', 'utf8')
const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')

test('FASE F: Cuaderno aparece como herramienta principal de Estudios', () => {
  assert.match(estudios, /href: '\/biblia\/notas'/)
  assert.match(estudios, /title: 'Cuaderno'/)
  assert.match(estudios, /Abrir cuaderno/)
  assert.match(estudios, /Biblia/)
  assert.match(estudios, /Estudio Profundo/)
})

test('FASE F: el cuaderno conserva un editor accesible con controles visibles', () => {
  assert.match(workspace, /NotesEditingToolbar/)
  assert.match(workspace, /RichNoteEditor/)
  assert.match(workspace, /FONT_SIZE_KEY/)
  assert.match(workspace, /Buscar en todo el cuaderno/)
  assert.match(workspace, /Guardado automático/)
  assert.match(workspace, /Volver a Estudios/)
})

test('FASE F: la barra cubre estilos, énfasis, listas, cita, referencia y salida', () => {
  for (const label of ['Título', 'Encabezado', 'Subtítulo', 'Cuerpo', 'Negrita', 'Cursiva', 'Subrayado', 'Tachado', 'Viñetas', 'Numerada', 'Tareas', 'Cita', 'Separador', 'Fecha y hora', 'Referencia']) {
    assert.match(toolbar, new RegExp(label))
  }
  assert.match(toolbar, /Aumentar tamaño/)
  assert.match(toolbar, /Reducir tamaño/)
  assert.match(toolbar, /Imprimir \/ PDF/)
  assert.match(toolbar, /min-h-14/)
})
