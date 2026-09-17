import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

test('VAPID ausente o inválido aísla todos los envíos sin consultar ni reservar notificaciones', async () => {
  const completo = { VAPID_SUBJECT: 'mailto:ci@example.invalid', NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'publica', VAPID_PRIVATE_KEY: 'privada' }
  for (const caso of ['ausente', ...Object.keys(completo), 'invalido']) {
    const env = caso === 'ausente' ? {} : { ...completo }
    if (caso in completo) delete env[caso]
    let configuraciones = 0
    const mod = cargarModulo('lib/webpush.ts', {
      'web-push': { setVapidDetails() { configuraciones++; throw new Error('llave inválida') }, sendNotification() { assert.fail('No debe enviar') } },
      '@/lib/supabase/service': { createServiceClient() { assert.fail('No debe consultar ni reservar') } },
    }, env)
    assert.equal(configuraciones, 0, 'Importar no configura VAPID')
    const sub = { endpoint: 'https://push.invalid', p256dh: 'x', auth: 'y' }
    const payload = { title: 'Prueba', body: 'Prueba' }
    const r = await mod.sendPushNotification(sub, payload)
    assert.equal(r.success, false)
    assert.equal(r.expired, false, 'Una mala configuración no elimina suscripciones')
    assert.equal(await mod.notifyUser(null, 'perfil', payload), 0)
    assert.equal(await mod.notifyMultipleUsers(null, ['perfil'], payload), 0)
    const once = await mod.notifyUsersOnceByReference(['perfil'], payload, { tipo: 'test', referenciaId: 'test' })
    assert.equal(once.users, 0)
    assert.equal(once.devices, 0)
  }
})

test('VAPID válido mantiene envío, TTL, urgencia y clasificación de suscripciones expiradas', async () => {
  let status = 201
  const mod = cargarModulo('lib/webpush.ts', {
    'web-push': { setVapidDetails() {}, async sendNotification(sub, body, options) {
      assert.equal(options.TTL, 86400)
      assert.equal(options.urgency, 'high')
      assert.equal(JSON.parse(body).url, '/inicio')
      if (status !== 201) throw { statusCode: status }
      return { statusCode: status }
    } },
    '@/lib/supabase/service': {},
  }, { VAPID_SUBJECT: 'mailto:test@example.invalid', NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'publica', VAPID_PRIVATE_KEY: 'privada' })
  const sub = { endpoint: 'https://push.invalid', p256dh: 'x', auth: 'y' }
  for (const code of [201, 404, 410, 500]) {
    status = code
    const r = await mod.sendPushNotification(sub, { title: 'Prueba', body: 'Prueba' })
    assert.equal(r.success, code === 201)
    assert.equal(r.expired, [404, 410].includes(code))
  }
})
