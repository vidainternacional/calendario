import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

function loadTs(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const loaded = { exports: {} }
  const require = name => { if (Object.hasOwn(dependencies, name)) return dependencies[name]; throw new Error(`Importación inesperada: ${name}`) }
  new Function('require', 'module', 'exports', code)(require, loaded, loaded.exports)
  return loaded.exports
}
const policies = loadTs('lib/neon/editorial-policies.ts')
const query = loadTs('lib/neon/editorial-query.ts', { './editorial-policies': policies })
const spec = overrides => ({ table: 'biblical_word_occurrences', columns: 'id', filters: [], orders: [], limit: 10, offset: 0, count: true, head: false, ...overrides })

test('AT y NT se leen en su destino; el AT redundante de B queda excluido', () => {
  assert.deepEqual(query.targetsFor(spec({ filters: [{ column: 'book_code', op: 'eq', value: 'GEN' }] })), ['A'])
  assert.deepEqual(query.targetsFor(spec({ filters: [{ column: 'book_code', op: 'eq', value: 'MAT' }] })), ['B'])
  assert.deepEqual(query.targetsFor(spec()), ['A', 'B'])
  const compiled = query.compileRead(spec(), 'B')
  assert.ok(compiled.params.includes('MAT'))
  assert.ok(!compiled.params.includes('GEN'))
  assert.throws(() => query.compileRead(spec({ table: 'profiles' }), 'A'))
  assert.ok(!query.migratedTables.has('biblical_hebrew_progress_answers'))
  assert.ok(!query.migratedTables.has('biblical_hebrew_search_resolutions'))
})

test('valores de búsqueda son parámetros y los identificadores inválidos se rechazan', () => {
  const input = "x' OR true --"
  const compiled = query.compileRead(spec({ filters: [{ column: 'surface_form', op: 'eq', value: input }] }), 'A')
  assert.ok(!compiled.query.includes(input))
  assert.ok(compiled.params.includes(input))
  assert.throws(() => query.compileRead(spec({ columns: 'id); DROP TABLE profiles;--' }), 'A'))
  assert.throws(() => query.compileRead(spec({ filters: [{ column: 'id;SELECT', op: 'eq', value: 'x' }] }), 'A'))
  const nested = query.parseOr('and(book_code.eq.GEN,chapter.eq.1),and(book_code.eq.EXO,chapter.eq.2)')
  assert.equal(nested.filters.length, 2)
  assert.equal(nested.filters[0].logic, 'and')
})

test('selecciones relacionadas aplican aprobación, fuentes y licencias sin cambiar permisos', () => {
  const compiled = query.compileRead(spec({ table: 'biblical_library_fragments', columns: 'title,source:biblical_sources!biblical_library_fragments_source_id_fkey(name)' }), 'B')
  assert.match(compiled.query, /license_status/)
  assert.match(compiled.query, /review_status/)
  assert.match(compiled.query, /biblical_library_items/)
  assert.match(compiled.query, /AS NOT MATERIALIZED/)
  assert.doesNotMatch(compiled.query, /cuenta_activa|auth\.uid|INSERT|UPDATE|DELETE|GRANT/)
})

test('contención de versiones usa text[] y los conteos no transportan páginas', () => {
  const compiled = query.compileRead(spec({ table: 'biblical_versification_profiles', filters: [{ column: 'translation_ids', op: 'contains', value: ['spaRV1909'] }], head: true }), 'B')
  assert.match(compiled.query, /@> ARRAY\[\$1\]::text\[\]/)
  assert.deepEqual(compiled.params, ['spaRV1909'])
  assert.doesNotMatch(compiled.query, /LIMIT/)
})

function clientWith(session) {
  return loadTs('lib/neon/biblical-client.ts', {
    'server-only': {}, './editorial-query': query,
    '@/lib/supabase/server': { createClient: async () => session },
    '@/lib/supabase/service': { createServiceClient: () => session },
  })
}

test('sin sesión o con cuenta inactiva nunca se consulta Neon', async () => {
  const prior = process.env.VIDA_BIBLE_READ_BACKEND, originalFetch = globalThis.fetch
  process.env.VIDA_BIBLE_READ_BACKEND = 'neon'
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('No debe consultar Neon') }
  try {
    for (const active of [false, null]) {
      const session = { auth: { getUser: async () => ({ data: { user: active === null ? null : { id: 'test' } } }) }, rpc: async () => ({ data: active, error: null }) }
      const client = await clientWith(session).createClient()
      const result = await client.from('biblical_sources').select('name')
      assert.equal(result.error.code, '42501')
    }
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch; if (prior === undefined) delete process.env.VIDA_BIBLE_READ_BACKEND; else process.env.VIDA_BIBLE_READ_BACKEND = prior }
})

test('la combinación global conserva orden, página y conteo sin duplicar AT de B', async () => {
  const oldEnv = { ...process.env }, originalFetch = globalThis.fetch
  process.env.VIDA_BIBLE_READ_BACKEND = 'neon'
  process.env.NEON_BIBLE_LEXICON_DATABASE_URL = 'postgresql://test@a.neon.tech/neondb'
  process.env.NEON_BIBLE_TEXTS_DATABASE_URL = 'postgresql://test@b.neon.tech/neondb'
  const seen = []
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers['Neon-Batch-Read-Only'], 'true')
    assert.equal(options.cache, 'force-cache')
    assert.equal(options.next.revalidate, 300)
    const request = JSON.parse(options.body).queries[0]
    const isA = String(url).includes('a.neon.tech')
    if (!isA) assert.ok(!request.params.includes('GEN'))
    seen.push(url)
    const values = isA ? [1, 3] : [2, 4]
    return { ok: true, json: async () => ({ results: [{ rows: [[JSON.stringify(values.map(n => ({ value: { word_index: n }, sort: [n] }))), '2']] }] }) }
  }
  const personal = { personal: true }
  const session = { auth: { getUser: async () => ({ data: { user: { id: 'test' } }, error: null }) }, rpc: async name => ({ data: name === 'cuenta_activa', error: null }), from: () => personal }
  try {
    const client = await clientWith(session).createClient()
    assert.equal(client.auth, session.auth)
    assert.equal(client.from('biblical_hebrew_progress_sessions'), personal)
    assert.equal(client.from('biblical_hebrew_search_resolutions'), personal)
    const result = await client.from('biblical_word_occurrences').select('word_index', { count: 'exact' }).order('word_index').range(1, 2)
    assert.deepEqual(result.data, [{ word_index: 2 }, { word_index: 3 }])
    assert.equal(result.count, 4)
    assert.equal(seen.length, 2)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of ['VIDA_BIBLE_READ_BACKEND', 'NEON_BIBLE_LEXICON_DATABASE_URL', 'NEON_BIBLE_TEXTS_DATABASE_URL']) {
      if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key]
    }
  }
})
