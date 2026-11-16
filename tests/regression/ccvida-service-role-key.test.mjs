import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

const original = 'https://atjtjpchslxbseayzflz.supabase.co'
const ccvida = 'https://lnkrojvyiwnlcoponxud.supabase.co'
const loadKey = env => cargarModulo('lib/supabase/service-role-key.ts', { 'server-only': {} }, env)

test('la clave nueva no cambia la conexión original, en producción ni Preview', () => {
  for (const VERCEL_ENV of ['production', 'preview']) {
    const env = { VERCEL_ENV, NEXT_PUBLIC_SUPABASE_URL: original,
      SUPABASE_SERVICE_ROLE_KEY: 'anterior-simulada', CCVIDA_SUPABASE_SERVICE_ROLE_KEY: 'nueva-simulada' }
    assert.equal(loadKey(env).getServiceRoleKey(), 'anterior-simulada')
  }
})

test('ccvida usa su clave propia incluso si la variable anterior sigue presente', () => {
  for (const url of [ccvida, ccvida + '/']) {
    assert.equal(loadKey({ NEXT_PUBLIC_SUPABASE_URL: url,
      SUPABASE_SERVICE_ROLE_KEY: 'anterior-simulada', CCVIDA_SUPABASE_SERVICE_ROLE_KEY: 'nueva-simulada',
    }).getServiceRoleKey(), 'nueva-simulada')
  }
})

test('la configuración estándar de la rama sigue siendo compatible', () => {
  assert.equal(loadKey({ NEXT_PUBLIC_SUPABASE_URL: ccvida,
    SUPABASE_SERVICE_ROLE_KEY: 'rama-simulada',
  }).getServiceRoleKey(), 'rama-simulada')
  assert.equal(loadKey({ NEXT_PUBLIC_SUPABASE_URL: ccvida + '.example.org',
    SUPABASE_SERVICE_ROLE_KEY: 'anterior-simulada', CCVIDA_SUPABASE_SERVICE_ROLE_KEY: 'nueva-simulada',
  }).getServiceRoleKey(), 'anterior-simulada')
})

test('ambos clientes administrativos reciben la clave del proyecto seleccionado', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: ccvida, SUPABASE_SERVICE_ROLE_KEY: 'anterior-simulada',
    CCVIDA_SUPABASE_SERVICE_ROLE_KEY: 'nueva-simulada' }
  const calls = []
  const factory = (...args) => { calls.push(args); return {} }
  const dependency = { './service-role-key': loadKey(env) }
  const server = cargarModulo('lib/supabase/server.ts', { ...dependency,
    '@supabase/ssr': { createServerClient: factory }, 'next/headers': {},
  }, env)
  const service = cargarModulo('lib/supabase/service.ts', { ...dependency,
    '@supabase/supabase-js': { createClient: factory },
  }, env)
  server.createAdminClient()
  service.createServiceClient()
  assert.equal(calls.length, 2)
  for (const [url, key] of calls) {
    assert.equal(url, ccvida)
    assert.equal(key, 'nueva-simulada')
  }
  assert.equal(calls[1][2].auth.persistSession, false)
  assert.equal(calls[1][2].auth.autoRefreshToken, false)
})

test('sin credenciales el cliente interno falla antes de hacer una consulta', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: ccvida }
  const service = cargarModulo('lib/supabase/service.ts', {
    './service-role-key': loadKey(env),
    '@supabase/supabase-js': { createClient: () => assert.fail('No debe crear cliente sin clave') },
  }, env)
  assert.throws(() => service.createServiceClient(), /clave de servidor/)
})
