import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

const destinos = cargarModulo('lib/auth/destino-seguro.ts')
test('recovery solo redirige al mismo origen, incluso con separadores normalizados', async () => {
  const route = cargarModulo('app/auth/confirm/route.ts', {
    'next/server': { NextResponse: { redirect: (url) => url.href } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { verifyOtp: async () => ({ error: null }) } }) },
    '@/lib/auth/destino-seguro': destinos,
  })
  for (const value of [null, '', 'https://externo.test', '//externo.test', '/\\externo.test', '/\t/externo.test', 'javascript:alert(1)', 'perfil']) {
    const url = new URL('https://vida.test/auth/confirm?token_hash=test&type=recovery')
    if (value !== null) url.searchParams.set('next', value)
    assert.equal(await route.GET({ url: url.href }), 'https://vida.test/restablecer')
  }
  assert.equal(destinos.destinoSeguro('/perfil?tab=cuenta#clave'), '/perfil?tab=cuenta#clave')
  assert.equal(await route.GET({ url: 'https://vida.test/auth/confirm?token_hash=test&type=signup&next=//externo.test' }), 'https://vida.test/inicio')
})
