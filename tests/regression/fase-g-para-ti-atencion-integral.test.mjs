import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Para ti reúne contactos y atención pastoral en el estado compartido', () => {
  const layout = source('app/(app)/layout.tsx')
  const indicators = source('components/notificaciones/usePendingIndicators.ts')
  const shortcut = source('components/notificaciones/PendingAttentionShortcut.tsx')
  const solidaritySync = source('components/solidaridad/SolidarityAccessBadgeSync.tsx')

  for (const field of [
    'pendingContactos',
    'pendingPreguntasPastorales',
    'pendingAyudaSolidaria',
  ]) {
    assert.match(indicators, new RegExp(field))
  }

  for (const field of [
    'pendingContactos',
    'pendingPreguntasPastorales',
  ]) {
    assert.match(shortcut, new RegExp(field))
  }

  assert.match(indicators, /from\('contactos'\)[\s\S]*?\.eq\('destinatario_id', user\.id\)[\s\S]*?\.eq\('estado', 'pendiente'\)/)
  assert.match(indicators, /from\('preguntas_congregacion'\)[\s\S]*?\.eq\('estado', 'pendiente'\)/)
  assert.match(indicators, /from\('solicitudes_ayuda_solidaria'\)[\s\S]*?\.eq\('estado', 'enviada'\)/)
  assert.match(indicators, /from\('aportes_ayuda_solidaria'\)[\s\S]*?\.eq\('estado', 'ofrecido'\)/)
  assert.match(indicators, /const esGestorPastoral = rol === 'pastor' \|\| esAdministrador \|\| esPastorGeneral/)

  assert.match(shortcut, /href: '\/contactos'/)
  assert.match(shortcut, /href: '\/pastoral\/preguntas'/)
  assert.match(shortcut, /label: 'Solicitudes de contacto'/)
  assert.match(shortcut, /label: 'Buzón pastoral'/)

  assert.match(layout, /<SolidarityAccessBadgeSync \/>/)
  assert.match(solidaritySync, /SolidarityUnreadBadge/)
  assert.match(solidaritySync, /scope="all"/)
  assert.match(solidaritySync, /\/ayuda-solidaria/)
  assert.match(solidaritySync, /\/pastoral\/ayuda-solidaria/)
})

test('badge global suma los nuevos pendientes sin contar casos pastorales ya en seguimiento', () => {
  const indicators = source('components/notificaciones/usePendingIndicators.ts')

  assert.match(indicators, /\+ Math\.max\(0, pendingContactos\)/)
  assert.match(indicators, /\+ Math\.max\(0, pendingPreguntasPastorales\)/)
  assert.match(indicators, /\+ Math\.max\(0, pendingAyudaSolidaria\)/)
  assert.doesNotMatch(indicators, /\.in\('estado', \['enviada', 'revisando'/)
  assert.doesNotMatch(indicators, /\.in\('estado', \['ofrecido', 'contactando'/)
})
