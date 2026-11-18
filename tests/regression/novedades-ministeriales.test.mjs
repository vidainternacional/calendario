import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const ruta='lib/estudios/novedades-ministeriales.ts'
const util=cargarModulo(ruta)
const id='11111111-1111-4111-8111-111111111111'
const fecha='2026-11-17T22:00:00.000Z'
test('abrir un video solo retira ese pendiente; una nueva publicación vuelve a avisar',()=>{
 const videos=[{id,titulo:'Mensaje',publicadoEn:fecha},{id:'otro',titulo:'Otro',publicadoEn:fecha}]
 assert.equal(util.videosPorAbrir(videos,{}).length,2)
 assert.equal(util.videosPorAbrir(videos,{[id]:fecha})[0].id,'otro')
 assert.equal(util.videosPorAbrir(videos,{[id]:'2026-11-16T22:00:00.000Z'}).length,2)
})
test('marcadores separados por usuario y almacenamiento inválido descartado',()=>{
 assert.notEqual(util.claveAperturasVideos('a'),util.claveAperturasVideos('b'))
 for(const dato of ['{','[]','null','"x"']) assert.equal(Object.keys(util.leerAperturasVideos(dato)).length,0)
 const leidos=util.leerAperturasVideos(JSON.stringify({[id]:fecha,incorrecto:fecha,'22222222-2222-4222-8222-222222222222':'mala fecha'}))
 assert.deepEqual(Object.keys(leidos),[id])
})
function action({usuario={id:'lector'},filas=[],fallo=false}={}) {
 const llamadas=[]
 const q={select(...a){llamadas.push(['select',...a]);return this},eq(...a){llamadas.push(['eq',...a]);return this},neq(...a){llamadas.push(['neq',...a]);return this},order(){return this},async range(desde,hasta){llamadas.push(['range',desde,hasta]);return {data:filas.slice(desde,hasta+1),error:fallo?{}:null}}}
 const client={auth:{getUser:async()=>({data:{user:usuario},error:null})},from(tabla){llamadas.push(['from',tabla]);return q}}
 return {api:cargarModulo('app/actions/novedades-ministeriales.ts',{'@/lib/supabase/server':{createClient:async()=>client}}),llamadas}
}
test('sin sesión no consulta publicaciones',async()=>{
 const {api,llamadas}=action({usuario:null});const r=await api.listarNovedadesMinisteriales();assert.equal(r.usuarioId,null);assert.equal(llamadas.length,0)
})
test('consulta con sesión lectora, solo publicados y excluye los propios',async()=>{
 const {api,llamadas}=action({filas:[{id,titulo:'Mensaje',published_at:fecha}]});const r=await api.listarNovedadesMinisteriales()
 assert.equal(r.videos.length,1);assert.equal(r.videos[0].publicadoEn,fecha)
 assert.ok(llamadas.some(x=>x[0]==='eq'&&x[1]==='publicado'&&x[2]===true))
 assert.ok(llamadas.some(x=>x[0]==='neq'&&x[1]==='autor_id'&&x[2]==='lector'))
})
test('pagina más de mil publicaciones sin omitir destinatarios y falla cerrada ante error',async()=>{
 const {api,llamadas}=action({filas:Array.from({length:1001},(_,i)=>({id:String(i),titulo:'Mensaje',published_at:fecha}))})
 assert.equal((await api.listarNovedadesMinisteriales()).videos.length,1001)
 assert.equal(llamadas.filter(x=>x[0]==='range').length,2)
 const r=await action({fallo:true}).api.listarNovedadesMinisteriales();assert.equal(r.videos.length,0);assert.ok(r.error)
})

test('estado compartido conserva pendientes al visitar Inicio, limpia al abrir y aísla cambio de cuenta',async()=>{
 const fs=await import('node:fs');const vm=await import('node:vm');const ts=(await import('typescript')).default
 let sesion={user:{id:'a'}}, authCallback,subscribe,snapshot,requests=0
 const storage=new Map(),listeners=new Map()
 const client={auth:{getSession:async()=>({data:{session:sesion}}),onAuthStateChange(fn){authCallback=fn;return {data:{subscription:{unsubscribe(){}}}}}}}
 const mod={exports:{}}
 const code=ts.transpileModule(fs.readFileSync('components/notificaciones/useVideosMinisteriales.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 vm.runInNewContext(code,{module:mod,exports:mod.exports,Date,Set,Map,queueMicrotask,navigator:{onLine:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{setInterval:()=>1,clearInterval(){},addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener(){}},document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},require(name){
  if(name==='react') return {useSyncExternalStore:(s,g)=>{subscribe=s;snapshot=g;return g()}}
  if(name==='@/lib/supabase/client')return {createClient:()=>client}
  if(name==='@/lib/estudios/novedades-ministeriales')return util
  if(name==='@/app/actions/novedades-ministeriales')return {listarNovedadesMinisteriales:async()=>{requests++;return {usuarioId:sesion.user.id,videos:[{id,titulo:sesion.user.id,publicadoEn:fecha}]}}}
  throw Error(name)
 }})
 mod.exports.useVideosMinisteriales();const stop=subscribe(()=>{})
 const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve()}
 await settle();assert.equal(snapshot().pendientes.length,1)
 assert.equal(snapshot().pendientes[0].titulo,'a')
 // Abrir Inicio no ejecuta registrarVideoAbierto: el pendiente sigue allí.
 mod.exports.useVideosMinisteriales();assert.equal(snapshot().pendientes.length,1)
 await mod.exports.registrarVideoAbierto('otra-cuenta',id,fecha);assert.equal(snapshot().pendientes.length,1)
 await mod.exports.registrarVideoAbierto('a',id,fecha);assert.equal(snapshot().pendientes.length,0)
 sesion={user:{id:'b'}};authCallback('SIGNED_IN',sesion)
 assert.equal(snapshot().pendientes.length,0);await settle()
 assert.equal(snapshot().pendientes[0].titulo,'b');assert.ok(storage.has(util.claveAperturasVideos('a')))
 sesion=null;authCallback('SIGNED_OUT',null);assert.equal(snapshot().pendientes.length,0)
 await settle();stop();assert.ok(requests>=2)
})
