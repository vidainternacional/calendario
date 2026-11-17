import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'
const autor='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222'
function preparar({legado=false,rol='pastor',activo=true,usuario=true,fallo=false,vacio=false,revision='r1',paquete=false}={}) {
 const consultas=[],paths=[]
 const db={from(tabla){const ops=[];consultas.push({tabla,ops});const q={then(ok,fail){const eliminado=ops.some(x=>x[0]==='delete');const perfil=tabla==='profiles';return Promise.resolve({data:perfil?{rol,activo,estado_cuenta:activo?'activo':'suspendido'}:eliminado?(vacio?[]:[{id}]):{id,updated_at:revision,audiencia:'iglesia',instrucciones:'https://www.youtube.com/watch?v=abcdefghijk',recurso_ids:paquete?['recurso']:[],bosquejo_id:null,coleccion_id:null},error:fallo&&!perfil?{}:null}).then(ok,fail)}};for(const k of ['select','eq','delete','maybeSingle','single'])q[k]=(...a)=>{ops.push([k,...a]);return q};return q}}
 const api=cargarModulo(legado?'app/actions/mensajes-semanales.ts':'app/actions/mensajes-dirigidos.ts',{
 'next/cache':{revalidatePath:p=>paths.push(p)},
 '@/lib/auth/permisos':{contextoPastoral:async()=>({supabase:db,user:usuario?{id:autor}:null,error:null})},
 '@/lib/estudios/youtube-link':{youtubeVideo:()=>({url:'https://www.youtube.com/watch?v=abcdefghijk'}),esMensajeSemanal:r=>r.audiencia==='iglesia'&&r.recurso_ids.length===0},
 '@/lib/estudios/notificar-mensaje-dirigido':{notificarMensajeDirigido:()=>{throw Error('Eliminar no debe notificar')}},
 '@/lib/estudios/mensajes-dirigidos-tipos':{ROL_DESTINO_IDS:new Set(),TIPO_DEVOCIONAL_IDS:new Set()},
 })
 return {run:(...args)=>(legado?api.eliminarMensajeSemanal:api.eliminarMensajeDirigido)(...args),consultas,paths}
}
test('eliminar requiere sesión, rol pastoral activo e identificación/revisión válidas',async()=>{
 for(const config of [{usuario:false},{rol:'servidor'},{activo:false}]){
 const p=preparar(config);assert.equal((await p.run(id,'r1')).success,false);assert.equal(p.consultas.filter(q=>q.ops.some(o=>o[0]==='delete')).length,0)
 }
 for(const args of [['no-uuid','r1'],[id,'']])assert.equal((await preparar().run(...args)).success,false)
})
test('borrado dirigido queda limitado a UUID, autor y revisión; revalida detalle sin notificar',async()=>{
 const p=preparar();assert.equal((await p.run(id,'r1')).success,true)
 const q=p.consultas.find(q=>q.ops.some(o=>o[0]==='delete'));assert.equal(q.tabla,'vida_devocionales')
 for(const [campo,valor] of [['id',id],['autor_id',autor],['updated_at','r1']])assert.ok(q.ops.some(o=>o[0]==='eq'&&o[1]===campo&&o[2]===valor))
 assert.ok(p.paths.includes(`/estudios/mensajes/${id}`))
})
test('RLS sin permiso, revisión concurrente o error no se presentan como eliminación correcta',async()=>{
 for(const config of [{vacio:true},{fallo:true}]){
 const p=preparar(config);assert.equal((await p.run(id,'r1')).success,false);assert.equal(p.paths.length,0)
 }
})
test('legado rechaza paquetes con recursos y revisión antigua; elimina solo video propio',async()=>{
 for(const config of [{paquete:true},{revision:'nueva'}]){
 const p=preparar({legado:true,...config});assert.equal((await p.run(id,'r1')).success,false);assert.equal(p.consultas.filter(q=>q.ops.some(o=>o[0]==='delete')).length,0)
 }
 const p=preparar({legado:true});assert.equal((await p.run(id,'r1')).success,true)
 const q=p.consultas.find(q=>q.ops.some(o=>o[0]==='delete'));assert.ok(q.ops.some(o=>o[0]==='eq'&&o[1]==='profile_id'&&o[2]===autor));assert.ok(q.ops.some(o=>o[0]==='eq'&&o[1]==='updated_at'&&o[2]==='r1'))
})
test('propuesta SQL habilita exclusivamente DELETE propio activo, sin cambiar lectura ni datos',()=>{
 const sql=fs.readFileSync('supabase/migrations/20261118000100_vida_devocionales_eliminacion_autor.sql','utf8')
 assert.match(sql,/for delete to authenticated/i);assert.match(sql,/autor_id = \(select auth.uid\(\)\)/i);assert.match(sql,/p.activo is true/);assert.match(sql,/p.estado_cuenta = 'activo'/);assert.match(sql,/pastor','administrador/)
 assert.doesNotMatch(sql,/for (select|update|insert)|delete from|truncate|security definer/i)
})
