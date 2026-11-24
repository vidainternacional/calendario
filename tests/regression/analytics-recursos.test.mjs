import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(js, { exports, require: name => {
    if (!(name in imports)) throw new Error(`Import no simulado: ${name}`)
    return imports[name]
  }, process: { env: {} }, AbortSignal, URL, Date, ...globals })
  return exports
}
const metrics = load('lib/admin/resource-metrics.ts')
const collect = fetch => load('lib/admin/resource-usage.ts', { 'server-only': {}, 'next/cache': { unstable_cache: fn => fn }, './resource-metrics': metrics }, { fetch }).collectResourceUsage

test('cuotas: límites exactos, valores ausentes y exceso sin ocultarlo', () => {
  for (const invalid of [null, undefined, '', '  ', NaN, Infinity, -1, false, {}]) assert.equal(metrics.finiteUsage(invalid), null)
  assert.equal(metrics.finiteUsage('0'), 0)
  assert.equal(metrics.resourceLevel(null, 100).percent, null)
  assert.equal(metrics.resourceLevel(0, null).percent, null)
  assert.equal(metrics.resourceLevel(69, 100).tone, 'normal')
  assert.equal(metrics.resourceLevel(70, 100).tone, 'warning')
  assert.equal(metrics.resourceLevel(85, 100).tone, 'urgent')
  assert.equal(metrics.resourceLevel(95, 100).tone, 'critical')
  assert.equal(metrics.resourceLevel(130, 100).percent, 130)
})

test('sin credenciales no consulta proveedores ni inventa ceros', async () => {
  const rows = await collect(() => { throw new Error('No debe consultar') })({})
  assert.equal(rows.length, 4)
  assert.ok(rows.every(row => row.status === 'unconfigured' && row.measuredAt === null))
  assert.ok(rows.every(row => row.metrics.every(item => item.used === null)))
})

test('Supabase: proyecto ccvida, agregado de solo lectura y cero Storage real', async () => {
  const rows = await collect(async (url, init) => {
    assert.match(url, /lnkrojvyiwnlcoponxud\/database\/query\/read-only$/)
    assert.equal(init.method, 'POST')
    const sql = JSON.parse(init.body).query
    assert.match(sql, /pg_database_size/)
    assert.doesNotMatch(sql, /public\.|insert|delete|update/i)
    return { ok: true, json: async () => [{ measured_at: '2026-11-24T01:00:00Z', database_bytes: '251377331', storage_bytes: '0' }] }
  })({ VIDA_SUPABASE_METRICS_TOKEN: 'TEST_SECRET' })
  assert.equal(rows[0].status, 'ok')
  assert.equal(rows[0].metrics[1].used, 0)
  assert.ok(!JSON.stringify(rows).includes('TEST_SECRET'))
})

test('Neon: ignora campos antiguos cero; usa CU ponderado y rama principal', async () => {
  const rows = await collect(async url => {
    const project = url.includes('rough-glitter') ? 'rough-glitter-04635242' : 'curly-scene-97670657'
    const payload = url.includes('/branches?') ? { branches: [{ default: true, logical_size: 750895104 }] } : { project: { id: project, compute_time_seconds: 36000, cpu_used_sec: 0, synthetic_storage_size: 0, data_transfer_bytes: 1000, branch_logical_size_limit_bytes: 1073741824 } }
    return { ok: true, json: async () => payload }
  })({ VIDA_NEON_METRICS_TOKEN: 'TEST_SECRET' })
  assert.equal(rows[1].metrics[0].used, 750895104)
  assert.equal(rows[1].metrics[0].limit, 1073741824)
  assert.equal(rows[1].metrics[1].used, 10)
  assert.equal(rows[1].metrics[1].limit, null)
})

test('R2: no suma Infrequent Access ni convierte respuesta incompleta en cero', async () => {
  const env = { VIDA_CLOUDFLARE_METRICS_TOKEN: 'TEST', VIDA_CLOUDFLARE_ACCOUNT_ID: 'TEST' }
  const good = await collect(async () => ({ ok: true, json: async () => ({ success: true, result: { standard: { published: { payloadSize: 100 } }, infrequentAccess: { published: { payloadSize: 999 } } } }) }))(env)
  assert.equal(good[3].metrics[0].used, 100)
  const bad = await collect(async () => ({ ok: true, json: async () => ({ success: true, result: {} }) }))(env)
  assert.equal(bad[3].status, 'unavailable')
  assert.equal(bad[3].metrics[0].used, null)
})

test('fallos aislados del proveedor no derriban el panel ni filtran errores', async () => {
  const rows = await collect(async () => { throw new Error('TEST_SECRET upstream SQL') })({ VIDA_NEON_METRICS_TOKEN: 'TEST_SECRET' })
  assert.equal(rows[1].status, 'unavailable')
  assert.equal(rows[2].status, 'unavailable')
  assert.ok(!JSON.stringify(rows).includes('TEST_SECRET'))
})

test('endpoint rechaza anónimo, pastor e inactivo antes de consultar consumo', async () => {
  let calls = 0
  async function request(user, profile) {
    const route = load('app/api/admin/recursos/route.ts', {
      'next/server': { NextResponse: { json: (data, options) => ({ data, ...options }) } },
      '@/lib/admin/resource-usage': { getResourceUsage: async () => { calls++; return [] } },
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: profile }) }) }) }) }) },
    }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://lnkrojvyiwnlcoponxud.supabase.co' } } })
    return route.GET()
  }
  assert.equal((await request(null, null)).status, 401)
  assert.equal((await request({ id: 'TEST' }, { rol: 'pastor', estado_cuenta: 'activo' })).status, 403)
  assert.equal((await request({ id: 'TEST' }, { rol: 'administrador', estado_cuenta: 'suspendido' })).status, 403)
  assert.equal(calls, 0)
  const good = await request({ id: 'TEST' }, { rol: 'administrador', estado_cuenta: 'activo' })
  assert.equal(calls, 1)
  assert.equal(good.headers['Cache-Control'], 'private, no-store')
})
