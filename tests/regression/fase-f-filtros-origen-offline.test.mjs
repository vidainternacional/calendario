import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: filtros online y offline son literalmente la misma implementación', () => {
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  assert.match(workspace, /type FiltroOrigen = 'todos' \| 'biblia' \| 'estudio_profundo' \| 'cuaderno'/)
  assert.match(workspace, /origenOrganizacion\(nota\) === filtroOrigen/)
  assert.match(workspace, /\[notas, busqueda, filtro, filtroOrigen\]/)
})

test('FASE F: Biblia, Estudio Profundo y Cuaderno conservan una sola taxonomía al quedar sin conexión', () => {
  assert.match(workspace, /\{ id: 'biblia', nombre: 'Biblia' \}/)
  assert.match(workspace, /\{ id: 'estudio_profundo', nombre: 'Estudio Profundo' \}/)
  assert.match(workspace, /\{ id: 'cuaderno', nombre: 'Cuaderno' \}/)
  assert.match(workspace, /superficieOrigen/)
})

test('FASE F: la navegación offline entra al mismo Cuaderno React y no a un HTML alterno', () => {
  assert.match(sw, /OFFLINE_NOTES_APP = '\/biblia\/notas-offline'/)
  assert.match(sw, /Response\.redirect\(fallbackUrl\.toString\(\), 302\)/)
  assert.doesNotMatch(sw, /OFFLINE_NOTES_SHELL/)
})
