import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

const { pushReminderKind, pushReminderStorageKey, PUSH_REMINDER_SNOOZE_MS } = cargarModulo('lib/pwa/push-reminder.ts')
const base = { supported: true, ios: false, standalone: false, permission: 'default', subscribed: false, dismissedUntil: 0, now: 1000 }

test('una suscripción activa no genera recordatorios; un permiso sin suscripción sí', () => {
  assert.equal(pushReminderKind({ ...base, permission: 'granted', subscribed: true }), null)
  assert.equal(pushReminderKind({ ...base, permission: 'granted' }), 'inactive')
  assert.equal(pushReminderKind(base), 'inactive')
})

test('distingue permisos bloqueados de falta de suscripción', () => {
  assert.equal(pushReminderKind({ ...base, permission: 'denied' }), 'blocked')
})

test('la posposición dura siete días y una preferencia inválida no oculta el aviso permanentemente', () => {
  const until = base.now + PUSH_REMINDER_SNOOZE_MS
  assert.equal(PUSH_REMINDER_SNOOZE_MS, 604800000)
  assert.equal(pushReminderKind({ ...base, dismissedUntil: until }), null)
  assert.equal(pushReminderKind({ ...base, dismissedUntil: until, now: until }), 'inactive')
  assert.equal(pushReminderKind({ ...base, dismissedUntil: Infinity }), 'inactive')
  assert.equal(pushReminderKind({ ...base, dismissedUntil: NaN }), 'inactive')
})

test('las preferencias de recordatorio quedan separadas por usuario', () => {
  assert.notEqual(pushReminderStorageKey('usuario-a'), pushReminderStorageKey('usuario-b'))
})

test('en iPhone sin instalar se orienta sobre instalación; no se insiste en navegadores incompatibles', () => {
  assert.equal(pushReminderKind({ ...base, ios: true, supported: false }), 'install')
  assert.equal(pushReminderKind({ ...base, supported: false }), null)
  assert.equal(pushReminderKind({ ...base, ios: true, standalone: true, permission: 'granted', subscribed: true }), null)
  assert.equal(pushReminderKind({ ...base, ios: true, dismissedUntil: 2000 }), null)
})
