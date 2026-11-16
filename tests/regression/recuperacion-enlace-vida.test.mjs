import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'

test('la recuperación usa la plantilla estándar de Supabase con retorno directo y sin PKCE entre dispositivos', async () => {
  const llamadas = []
  const auth = {
    resetPasswordForEmail: async (email, options) => {
      llamadas.push({ email, options })
      return { data: {}, error: null }
    },
  }
  let configuracion
  const modulo = cargarModulo('app/actions/recuperacion.ts', {
    '@supabase/supabase-js': {
      createClient: (_url, _clave, config) => {
        configuracion = config
        return { auth }
      },
    },
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key' })

  assert.equal((await modulo.solicitarRecuperacion(' usuario@ejemplo.com ')).success, true)
  assert.equal(llamadas[0].email, 'usuario@ejemplo.com')
  assert.equal(llamadas[0].options.redirectTo, 'https://calendario-vida-internacional.vercel.app/restablecer')
  assert.equal(configuracion.auth.flowType, 'implicit')
  assert.equal(configuracion.auth.persistSession, false)
})

test('recuperación mantiene respuesta neutra y no expone cuentas existentes', async () => {
  const modulo = cargarModulo('app/actions/recuperacion.ts', {
    '@supabase/supabase-js': {
      createClient: () => ({
        auth: { resetPasswordForEmail: async () => ({ error: null }) },
      }),
    },
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key' })
  assert.ok((await modulo.solicitarRecuperacion('invalid')).error)
  assert.equal((await modulo.solicitarRecuperacion('otra@ejemplo.com')).success, true)
})

test('la ruta de nueva contraseña es pública hasta verificar la sesión recibida', () => {
  const middleware = fs.readFileSync('lib/supabase/middleware.ts', 'utf8')
  const pagina = fs.readFileSync('app/restablecer/page.tsx', 'utf8')
  assert.match(middleware, /publicRoutes\s*=\s*\[[^\]]*'\/restablecer'/s)
  assert.match(pagina, /fragmento\.get\('access_token'\)/)
  assert.match(pagina, /fragmento\.get\('refresh_token'\)/)
  assert.match(pagina, /supabase\.auth\.setSession\(/)
  assert.match(pagina, /supabase\.auth\.exchangeCodeForSession\(/)
  assert.match(pagina, /window\.history\.replaceState\(/)
  assert.match(pagina, /acceso !== 'listo'/)
})
