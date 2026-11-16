import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'

const actor = '11111111-1111-4111-8111-111111111111'
const ministerioA = '22222222-2222-4222-8222-222222222222'
const ministerioB = '33333333-3333-4333-8333-333333333333'
const videoUrl = 'https://youtu.be/fvBD-rFlTfg'

class Query {
  constructor(table, calls, options) {
    this.table = table
    this.calls = calls
    this.options = options
    this.ops = []
    this.calls.push(this)
  }
  then(ok, fail) {
    return Promise.resolve().then(() => this.resolve()).then(ok, fail)
  }
  resolve() {
    if (this.table === 'profiles') return { data: { rol: this.options.role, activo: this.options.active, estado_cuenta: this.options.status }, error: null }
    if (this.table === 'ministerios') {
      const ids = this.ops.find(x => x[0] === 'in' && x[1] === 'id')?.[2] || []
      const actives = this.options.allowedMinistries
      return { data: ids.filter(x => actives.includes(x)).map(id => ({ id })), error: null }
    }
    if (this.ops.some(x => x[0] === 'insert' || x[0] === 'update')) {
      return { data: this.options.race ? [] : [{ id: ministerioA }], error: null }
    }
    return { data: this.options.existing, error: null }
  }
}
for (const method of ['select','eq','in','insert','update','maybeSingle','single']) {
  Query.prototype[method] = function (...args) { this.ops.push([method, ...args]); return this }
}
const op = (q,method,field) => q.ops.find(x=>x[0]===method && (field===undefined||x[1]===field))
function makeForm({publicar=false, roles=[], ministerios=[], iglesia=false, lideres=false, tipo='mensaje'}={}) {
  const f = new FormData()
  f.set('titulo','Esperanza')
  f.set('video_url',videoUrl)
  f.set('descripcion','Para el ministerio')
  f.set('tipo',tipo)
  if(publicar) f.set('publicar','on')
  if(iglesia) f.set('audiencia_iglesia','on')
  if(lideres) f.set('lideres_ministerio','on')
  for(const id of roles) f.append('rol_destino',id)
  for(const id of ministerios) f.append('ministerio_destino',id)
  return f
}
function setup(options={}) {
  const opts={role:'pastor',status:'activo',active:true,allowedMinistries:[ministerioA,ministerioB],existing:null,race:false,...options}
  const calls=[]
  const refreshed=[]
  const db={from: table=>new Query(table,calls,opts)}
  const actions=cargarModulo('app/actions/mensajes-dirigidos.ts',{
    'next/cache': { revalidatePath: path=>refreshed.push(path) },
    '@/lib/auth/permisos': { contextoPastoral: async()=>({ supabase:db,user:opts.user===null?null:{id:actor},error:null }) },
    '@/lib/estudios/youtube-link': { youtubeVideo: v=>v===videoUrl ? {url:'https://www.youtube.com/watch?v=fvBD-rFlTfg'} : null },
    '@/lib/estudios/mensajes-dirigidos-tipos': { ROL_DESTINO_IDS:new Set(['pastor','administrador','lider','servidor']) },
  })
  return {actions,calls,refreshed}
}

test('sin marcar Publicar, el mensaje se guarda como borrador de su autor',async()=>{
  const {actions,calls}=setup()
  assert.equal((await actions.guardarMensajeDirigido(makeForm())).success,true)
  const q=calls.find(v=>v.table==='vida_devocionales'&&op(v,'insert'))
  assert.ok(q)
  const payload=op(q,'insert')[1]
  assert.equal(payload.publicado,false)
  assert.equal(payload.published_at,null)
  assert.equal(payload.autor_id,actor)
  assert.equal(payload.audiencia_iglesia,false)
})

test('puede publicar para dos ministerios y pastores sin abrir a toda la congregación',async()=>{
  const {actions,calls,refreshed}=setup()
  const f=makeForm({publicar:true,roles:['pastor'],ministerios:[ministerioA,ministerioB],tipo:'devocional'})
  assert.equal((await actions.guardarMensajeDirigido(f)).success,true)
  const q=calls.find(v=>v.table==='vida_devocionales'&&op(v,'insert'))
  const payload=op(q,'insert')[1]
  assert.equal(payload.publicado,true)
  assert.equal(payload.audiencia_iglesia,false)
  assert.deepEqual(payload.roles_destino,['pastor'])
  assert.deepEqual(payload.ministerios_destino,[ministerioA,ministerioB])
  assert.equal(payload.tipo,'devocional')
  assert.ok(payload.published_at)
  assert.ok(refreshed.includes('/pastoral/mensajes'))
  assert.ok(refreshed.includes('/estudios/mensajes'))
})

test('rechaza publicación sin destinatarios o con ministerio no disponible',async()=>{
  const a=setup()
  assert.equal((await a.actions.guardarMensajeDirigido(makeForm({publicar:true}))).success,false)
  assert.equal(a.calls.some(q=>op(q,'insert')),false)
  const b=setup({allowedMinistries:[ministerioA]})
  assert.equal((await b.actions.guardarMensajeDirigido(makeForm({publicar:true,ministerios:[ministerioA,ministerioB]}))).success,false)
  assert.equal(b.calls.some(q=>op(q,'insert')),false)
})

test('rechaza roles falsos y autores sin acceso pastoral activo',async()=>{
  const a=setup()
  assert.equal((await a.actions.guardarMensajeDirigido(makeForm({roles:['superadmin']}))).success,false)
  assert.equal(a.calls.some(q=>op(q,'insert')),false)
  for(const opts of [{role:'servidor'}, {role:'lider'}, {status:'inactivo'}, {active:false}, {user:null}]) {
    const b=setup(opts)
    assert.equal((await b.actions.guardarMensajeDirigido(makeForm({iglesia:true,publicar:true}))).success,false)
    assert.equal(b.calls.some(q=>op(q,'insert')),false)
  }
})

test('la migración protege directamente lectura, edición y lista de ministerios',()=>{
  const sql=fs.readFileSync('supabase/migrations/20261116223000_vida_devocionales_destinatarios.sql','utf8')
  assert.match(sql,/enable row level security/i)
  assert.match(sql,/for select to authenticated using/i)
  assert.match(sql,/mm[.]profile_id\s*=\s*\(select auth[.]uid\(\)\)/i)
  assert.match(sql,/mm[.]es_lider is true/)
  assert.match(sql,/mm[.]ministerio_id = any\(ministerios_destino\)/)
  assert.match(sql,/for insert to authenticated with check/i)
  assert.match(sql,/for update to authenticated/i)
  assert.match(sql,/with check\s*\(/)
  assert.doesNotMatch(sql,/drop table/i)
})
