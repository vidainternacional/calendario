import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

const youtube = cargarModulo('lib/estudios/youtube-link.ts')
const actor = '11111111-1111-4111-8111-111111111111'
const id = '22222222-2222-4222-8222-222222222222'
const revision = '2026-11-16T00:00:00+00:00'
const url = 'https://www.youtube.com/watch?v=fvBD-rFlTfg'
const row = (extra = {}) => ({ id, profile_id: actor, titulo: 'Esperanza', descripcion_publica: 'Mensaje semanal',
  instrucciones: url, audiencia: 'iglesia', bosquejo_id: null, coleccion_id: null, recurso_ids: [],
  publicado: true, published_at: revision, updated_at: revision, ...extra })

class Query {
  constructor(table, resolver, calls) { this.table = table; this.resolver = resolver; this.ops = []; calls.push(this) }
  then(a, b) { return Promise.resolve().then(() => this.resolver(this)).then(a, b) }
}
for (const method of ['select', 'eq', 'in', 'is', 'like', 'range', 'order', 'limit', 'single', 'maybeSingle', 'insert', 'update']) {
  Query.prototype[method] = function (...args) { this.ops.push([method, ...args]); return this }
}
const op = (q, name, field) => q.ops.find(v => v[0] === name && (field === undefined || v[1] === field))
function database(resolver, calls) {
  return { from: table => new Query(table, resolver, calls), rpc: name => new Query('rpc:' + name, resolver, calls) }
}
function form(extra = {}) {
  const f = new FormData()
  for (const [k, v] of Object.entries({ titulo: 'Esperanza', descripcion: 'Mensaje semanal', video_url: url, ...extra })) f.set(k, v)
  return f
}
function actions({ role = 'pastor', status = 'activo', user = { id: actor }, existing = row(), race = false } = {}) {
  const calls = []
  const refreshed = []
  const db = database(q => {
    if (q.table === 'profiles') return { data: { rol: role, estado_cuenta: status }, error: null }
    if (op(q, 'insert')) return { data: [{ id }], error: null }
    if (op(q, 'update')) return { data: race ? [] : [{ id }], error: null }
    const owner = op(q, 'eq', 'profile_id')?.[2]
    return { data: existing?.profile_id === owner ? existing : null, error: null }
  }, calls)
  const mod = cargarModulo('app/actions/mensajes-semanales.ts', {
    'next/cache': { revalidatePath: p => refreshed.push(p) },
    '@/lib/auth/permisos': { contextoPastoral: async () => ({ supabase: db, user, error: null }) },
    '@/lib/estudios/youtube-link': youtube,
  })
  return { mod, calls, refreshed }
}

test('normaliza enlaces reales de YouTube y rechaza otros hosts, credenciales y URLs ejecutables', () => {
  for (const input of [url, 'https://youtu.be/fvBD-rFlTfg?si=abc', 'https://m.youtube.com/watch?v=fvBD-rFlTfg&t=20', 'https://youtube.com/shorts/fvBD-rFlTfg']) {
    assert.equal(youtube.youtubeVideo(input).url, url)
    assert.equal(youtube.youtubeVideo(input).embed, 'https://www.youtube-nocookie.com/embed/fvBD-rFlTfg')
  }
  for (const bad of ['javascript:alert(1)', 'https://youtube.com.evil.org/watch?v=fvBD-rFlTfg', 'https://youtube.com@evil.org/watch?v=fvBD-rFlTfg', 'https://user:pass@youtube.com/watch?v=fvBD-rFlTfg', 'http://youtu.be/fvBD-rFlTfg', 'https://youtu.be/no', 'https://youtube.com/watch?v=%3Cscript%3E']) assert.equal(youtube.youtubeVideo(bad), null)
})

test('solo clasifica materiales sencillos de iglesia y el DTO no contiene notas privadas', () => {
  assert.equal(youtube.esMensajeSemanal(row()), true)
  for (const changed of [{ audiencia: 'lideres' }, { bosquejo_id: id }, { recurso_ids: [id] }, { instrucciones: 'Texto de otro proyecto' }]) assert.equal(youtube.esMensajeSemanal(row(changed)), false)
  const dto = youtube.mensajeDesdeFila(row({ notas_privadas: 'NO EXPONER' }))
  assert.equal(dto.videoUrl, url)
  assert.equal('notas_privadas' in dto, false)
  assert.equal('profile_id' in dto, false)
})

test('pastor guarda un borrador propio sin adjuntar archivos, crear cursos ni publicar por defecto', async () => {
  const { mod, calls, refreshed } = actions()
  assert.equal((await mod.guardarMensajeSemanal(form())).success, true)
  const insertion = calls.find(q => op(q, 'insert'))
  const data = op(insertion, 'insert')[1]
  assert.equal(insertion.table, 'pastoral_paquetes')
  assert.equal(data.profile_id, actor)
  assert.equal(data.publicado, false)
  assert.equal(data.published_at, null)
  assert.equal(data.instrucciones, url)
  assert.equal(data.recurso_ids.length, 0)
  assert.ok(calls.every(q => ['profiles', 'pastoral_paquetes'].includes(q.table)))
  assert.ok(refreshed.includes('/estudios/mensajes'))
  assert.ok(refreshed.includes('/pastoral/mensajes'))
})

test('sin sesión, con rol delegado o cuenta inactiva no se escriben mensajes', async () => {
  for (const option of [{ user: null }, { role: 'lider' }, { role: 'servidor' }, { status: 'suspendido' }]) {
    const { mod, calls } = actions(option)
    assert.equal((await mod.guardarMensajeSemanal(form())).success, false)
    assert.equal(calls.some(q => op(q, 'insert') || op(q, 'update')), false)
  }
})

test('enlaces ajenos e intentos de editar otro autor u otro tipo de proyecto no llegan a una mutación', async () => {
  for (const options of [
    { input: form({ video_url: 'https://evil.org/video' }) },
    { input: form({ id, revision }), existing: row({ profile_id: id }) },
    { input: form({ id, revision }), existing: row({ instrucciones: 'Mi bosquejo privado' }) },
    { input: form({ id, revision }), existing: row({ updated_at: 'otra-revision' }) },
  ]) {
    const { mod, calls } = actions(options)
    assert.equal((await mod.guardarMensajeSemanal(options.input)).success, false)
    assert.equal(calls.some(q => op(q, 'insert') || op(q, 'update')), false)
  }
})

test('publicar es explícito; editar y despublicar conservan autor y usan revisión de concurrencia', async () => {
  const { mod, calls } = actions()
  assert.equal((await mod.guardarMensajeSemanal(form({ id, revision, publicar: 'on' }))).success, true)
  let update = calls.find(q => op(q, 'update'))
  assert.equal(op(update, 'update')[1].publicado, true)
  assert.equal(op(update, 'eq', 'profile_id')[2], actor)
  assert.equal(op(update, 'eq', 'updated_at')[2], revision)
  assert.equal('profile_id' in op(update, 'update')[1], false)
  const other = actions()
  assert.equal((await other.mod.cambiarPublicacionMensaje(id, revision, false)).success, true)
  update = other.calls.find(q => op(q, 'update'))
  assert.equal(op(update, 'update')[1].publicado, false)
  assert.equal(op(update, 'update')[1].published_at, null)
  assert.equal(op(update, 'eq', 'profile_id')[2], actor)
  assert.equal(op(update, 'eq', 'updated_at')[2], revision)
  const race = actions({ race: true })
  assert.equal((await race.mod.guardarMensajeSemanal(form({ id, revision }))).success, false)
})

function reader({ user = { id: actor }, rpcError = false, rows = [row()], visible = [id] } = {}) {
  const calls = []
  let serviceCreated = 0
  const db = database(q => {
    if (q.table === 'profiles') return { data: { rol: 'servidor', estado_cuenta: 'activo' }, error: null }
    if (q.table.startsWith('rpc:')) {
      const range = op(q, 'range')
      return { data: visible.slice(range[1], range[2] + 1).map(id => ({ id })), error: rpcError ? { message: 'falló' } : null }
    }
    return { data: [], error: null }
  }, calls)
  db.auth = { getUser: async () => ({ data: { user }, error: null }) }
  const service = database(q => {
    if (q.table === 'profiles') return { data: [{ id: actor, nombre_completo: 'Pastor' }], error: null }
    const ids = op(q, 'in', 'id')?.[2] || []
    return { data: rows.filter(r => ids.includes(r.id)).slice(0, op(q, 'limit')?.[1]), error: null }
  }, calls)
  const mod = cargarModulo('lib/estudios/mensajes-semanales.ts', {
    'server-only': {}, './youtube-link': youtube,
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/service': { createServiceClient: () => { serviceCreated++; return service } },
  })
  return { mod, calls, count: () => serviceCreated }
}

test('sin sesión o sin autorización del RPC no se inicia ninguna lectura administrativa', async () => {
  const a = reader({ user: null })
  assert.equal((await a.mod.cargarMensajesSemanales()).autenticado, false)
  assert.equal(a.count(), 0)
  const b = reader({ rpcError: true })
  assert.ok((await b.mod.cargarMensajesSemanales()).error)
  assert.equal(b.count(), 0)
  const c = reader({ visible: [] })
  assert.equal((await c.mod.cargarMensajesSemanales()).mensajes.length, 0)
  assert.equal(c.count(), 0)
})

test('la lectura pública se limita a IDs autorizados y vuelve a filtrar borradores y audiencia', async () => {
  const a = reader({ rows: [row({ notas_privadas: 'SECRETO' })] })
  const result = await a.mod.cargarMensajesSemanales()
  assert.equal(result.mensajes.length, 1)
  assert.equal(result.puedePublicar, false)
  assert.equal(JSON.stringify(result).includes('SECRETO'), false)
  const q = a.calls.find(q => q.table === 'pastoral_paquetes')
  assert.equal(JSON.stringify(op(q, 'in', 'id')[2]), JSON.stringify([id]))
  assert.equal(op(q, 'eq', 'publicado')[2], true)
  assert.equal(op(q, 'eq', 'audiencia')[2], 'iglesia')
  assert.equal(op(q, 'select')[1].includes('notas_privadas'), false)
  const b = reader({ rows: [row({ publicado: false })] })
  assert.equal((await b.mod.cargarMensajesSemanales()).mensajes.length, 0)
  const c = reader({ rows: [row({ audiencia: 'lideres' })] })
  assert.equal((await c.mod.cargarMensajesSemanales()).mensajes.length, 0)
})

test('combina lotes autorizados y pagina cronológicamente sin repetir mensajes', async () => {
  const rows = Array.from({ length: 105 }, (_, i) => row({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    titulo: `Mensaje ${i}`, published_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
  })).reverse()
  const visible = rows.map(r => r.id)
  const a = reader({ rows, visible })
  const first = await a.mod.cargarMensajesSemanales(1)
  const second = await a.mod.cargarMensajesSemanales(2)
  assert.equal(first.mensajes.length, 12)
  assert.equal(second.mensajes.length, 12)
  assert.equal(first.mensajes[0].titulo, 'Mensaje 104')
  assert.equal(second.mensajes[0].titulo, 'Mensaje 92')
  assert.equal(first.haySiguiente, true)
  assert.equal(new Set([...first.mensajes, ...second.mensajes].map(m => m.id)).size, 24)
  for (const q of a.calls.filter(q => q.table === 'pastoral_paquetes')) assert.ok(op(q, 'in', 'id')[2].length <= 100)
})
