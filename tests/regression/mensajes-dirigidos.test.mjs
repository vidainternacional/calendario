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
function makeForm({publicar=false, roles=[], ministerios=[], iglesia=false, lideres=false, tipo='mensaje', serieTitulo='', episodio=''}={}) {
  const f = new FormData()
  f.set('titulo','Esperanza')
  f.set('video_url',videoUrl)
  f.set('descripcion','Para el ministerio')
  f.set('tipo',tipo)
  if (serieTitulo) f.set('serie_titulo',serieTitulo)
  if (episodio) f.set('serie_episodio',episodio)
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
  const avisos=[]
  const db={from: table=>new Query(table,calls,opts)}
  const actions=cargarModulo('app/actions/mensajes-dirigidos.ts',{
    'next/cache': { revalidatePath: path=>refreshed.push(path) },
    '@/lib/estudios/notificar-mensaje-dirigido': { notificarMensajeDirigido: async (...args) => { avisos.push(args); return 'Aviso preparado.' } },
    '@/lib/auth/permisos': { contextoPastoral: async()=>({ supabase:db,user:opts.user===null?null:{id:actor},error:null }) },
    '@/lib/estudios/youtube-link': { youtubeVideo: v=>v===videoUrl ? {url:'https://www.youtube.com/watch?v=fvBD-rFlTfg'} : null },
    '@/lib/estudios/mensajes-dirigidos-tipos': { ROL_DESTINO_IDS:new Set(['pastor','administrador','lider','servidor']), TIPO_DEVOCIONAL_IDS: new Set(['mensaje','devocional','serie','estudio_biblico','ensenanza','reflexion','testimonio','conferencia','capacitacion']) },
  })
  return {actions,calls,refreshed,avisos}
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
  assert.deepEqual([...payload.roles_destino],['pastor'])
  assert.deepEqual([...payload.ministerios_destino],[ministerioA,ministerioB])
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

test('el editor guarda todas las categorías disponibles sin alterar la audiencia seleccionada', async () => {
  for (const tipo of ['estudio_biblico','ensenanza','reflexion','testimonio','conferencia','capacitacion']) {
    const {actions,calls} = setup()
    const r = await actions.guardarMensajeDirigido(makeForm({tipo,publicar:true,iglesia:true}))
    assert.equal(r.success,true, tipo)
    const fila = calls.find(q=>q.table==='vida_devocionales'&&op(q,'insert'))
    const datos = op(fila,'insert')[1]
    assert.equal(datos.tipo,tipo)
    assert.equal(datos.serie_titulo,null)
    assert.equal(datos.serie_episodio,null)
    assert.equal(datos.audiencia_iglesia,true)
  }
})

test('serie se guarda con título y número de capítulo, respetando borrador y destinatarios',async()=>{
  const {actions,calls}=setup()
  const r=await actions.guardarMensajeDirigido(makeForm({
    tipo:'serie',serieTitulo:'Fundamentos de la fe',episodio:'2',publicar:false,
    ministerios:[ministerioA],
  }))
  assert.equal(r.success,true)
  const fila=calls.find(q=>q.table==='vida_devocionales'&&op(q,'insert'))
  const datos=op(fila,'insert')[1]
  assert.equal(datos.tipo,'serie')
  assert.equal(datos.serie_titulo,'Fundamentos de la fe')
  assert.equal(datos.serie_episodio,2)
  assert.equal(datos.publicado,false)
  assert.deepEqual([...datos.ministerios_destino],[ministerioA])
})

test('serie rechaza nombre vacío, episodio fuera de rango y categoría desconocida',async()=>{
  for(const o of [
    {tipo:'serie',episodio:'1'},
    {tipo:'serie',serieTitulo:'Serie A',episodio:'0'},
    {tipo:'serie',serieTitulo:'Serie A',episodio:'1000'},
    {tipo:'serie',serieTitulo:'Serie A',episodio:'1.5'},
    {tipo:'otro'},
  ]){
    const {actions,calls}=setup()
    assert.equal((await actions.guardarMensajeDirigido(makeForm(o))).success,false)
    assert.equal(calls.some(q=>op(q,'insert')||op(q,'update')),false)
  }
})

test('la migración de categorías solo amplía la tabla nueva y conserva políticas y datos existentes',()=>{
  const sql=fs.readFileSync('supabase/migrations/20261116233000_vida_devocionales_categorias_series.sql','utf8')
  assert.match(sql,/alter table public[.]vida_devocionales/)
  assert.match(sql,/add column if not exists serie_titulo/)
  assert.match(sql,/add column if not exists serie_episodio/)
  assert.match(sql,/tipo in \('mensaje','devocional','serie','estudio_biblico','ensenanza','reflexion','testimonio','conferencia','capacitacion'\)/)
  assert.match(sql,/unique index if not exists/i)
  assert.doesNotMatch(sql,/drop table|delete from|update public[.]|create policy|drop policy/i)
  assert.doesNotMatch(sql,/pastoral_paquetes|ministerio_miembros|alter table public[.]profiles/i)
})


test('una nueva publicación solicita el aviso, pero el borrador y la edición publicada no lo repiten', async () => {
  const nuevo=setup();await nuevo.actions.guardarMensajeDirigido(makeForm({publicar:true,iglesia:true}));assert.equal(nuevo.avisos.length,1)
  const borrador=setup();await borrador.actions.guardarMensajeDirigido(makeForm());assert.equal(borrador.avisos.length,0)
  const edicion=setup({existing:{updated_at:'revision',published_at:'2026-11-17T12:00:00Z'}})
  const f=makeForm({publicar:true,iglesia:true});f.set('id',ministerioA);f.set('revision','revision')
  await edicion.actions.guardarMensajeDirigido(f);assert.equal(edicion.avisos.length,0)
})

test('publicar un borrador desde la biblioteca avisa; despublicar no envía', async () => {
  const e=setup({existing:{audiencia_iglesia:true,roles_destino:[],ministerios_destino:[],lideres_ministerio:false,published_at:null,updated_at:'revision'}})
  assert.equal((await e.actions.cambiarPublicacionDirigida(ministerioA,'revision',true)).success,true)
  assert.equal(e.avisos.length,1)
  await e.actions.cambiarPublicacionDirigida(ministerioA,'revision',false)
  assert.equal(e.avisos.length,1)
})

test('no dispara aviso si el guardado perdió la revisión o falló', async () => {
  const e=setup({race:true});await e.actions.guardarMensajeDirigido(makeForm({publicar:true,iglesia:true}));assert.equal(e.avisos.length,0)
})

test('el reintento exige autor autenticado y mensaje publicado; no cambia destinatarios ni contenido', async () => {
  const e=setup({existing:{id:ministerioA,publicado:true}})
  assert.equal((await e.actions.avisarMensajeDirigido(ministerioA)).success,true)
  assert.equal(e.avisos.length,1)
  const consulta=e.calls.find(q=>q.table==='vida_devocionales')
  assert.equal(op(consulta,'eq','autor_id')[2],actor)
  assert.equal(e.calls.some(q=>op(q,'update')||op(q,'insert')),false)
  const b=setup({existing:{publicado:false}});assert.equal((await b.actions.avisarMensajeDirigido(ministerioA)).success,false)
  const a=setup({role:'servidor'});assert.equal((await a.actions.avisarMensajeDirigido(ministerioA)).success,false);assert.equal(a.avisos.length,0)
})

test('administrador activo corrige otro autor sin cambiar autoría ni reavisar al editar',async()=>{
 const otro='44444444-4444-4444-8444-444444444444'
 const p=setup({role:'administrador',existing:{autor_id:otro,updated_at:'r1',published_at:'2026-11-17T00:00:00Z'}})
 const form=makeForm({publicar:true,iglesia:true});form.set('id',ministerioA);form.set('revision','r1')
 assert.equal((await p.actions.guardarMensajeDirigido(form)).success,true)
 const q=p.calls.find(q=>op(q,'update'));assert.equal(op(q,'eq','autor_id'),undefined)
 assert.equal(op(q,'update')[1].autor_id,undefined);assert.equal(p.avisos.length,0)
})
test('reenvío de administrador usa autor original; administrador suspendido no obtiene acceso general',async()=>{
 const otro='44444444-4444-4444-8444-444444444444'
 const p=setup({role:'administrador',existing:{id:ministerioA,autor_id:otro,publicado:true}})
 assert.equal((await p.actions.avisarMensajeDirigido(ministerioA)).success,true)
 assert.equal(p.avisos[0][1],otro)
 const no=setup({role:'administrador',active:false});assert.equal((await no.actions.avisarMensajeDirigido(ministerioA)).success,false);assert.equal(no.avisos.length,0)
})
