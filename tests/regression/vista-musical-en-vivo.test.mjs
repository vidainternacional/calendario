import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'
const min='11111111-1111-4111-8111-111111111111',evt='22222222-2222-4222-8222-222222222222',a='33333333-3333-4333-8333-333333333333',b='44444444-4444-4444-8444-444444444444'
function preparar({rol='servidor',lider=true,activo=true,usuario=true,eventoAjeno=false,rpcError=null}={}) {
 const llamadas=[],reval=[]
 const admin={from(tabla){const q={then(ok,fail){return Promise.resolve({data:tabla==='profiles'?{rol,activo,estado_cuenta:activo?'activo':'suspendido'}:tabla==='ministerio_miembros'?{es_lider:lider}:tabla==='eventos'?{id:evt,ministerio_id:eventoAjeno?'ajeno':min}:[],error:null}).then(ok,fail)}};for(const k of ['select','eq','in','limit','maybeSingle'])q[k]=()=>q;return q},rpc:async(...args)=>{llamadas.push(args);return {error:rpcError}}}
 const api=cargarModulo('app/actions/repertorio-programacion.ts',{'next/cache':{revalidatePath:p=>reval.push(p)},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:usuario?{id:a}:null}})}}),createAdminClient:()=>admin}})
 return {api,llamadas,reval}
}
test('reordenar exige sesión, cuenta activa y liderazgo o administración',async()=>{
 for(const config of [{usuario:false},{lider:false},{rol:'administrador',activo:false}]){const p=preparar(config);assert.equal((await p.api.reordenarCancionesServicio(min,evt,[a,b],[b,a])).success,false);assert.equal(p.llamadas.length,0)}
})
test('rechaza eventos ajenos, duplicados, canciones añadidas y listas incompletas',async()=>{
 const p=preparar({eventoAjeno:true});assert.equal((await p.api.reordenarCancionesServicio(min,evt,[a,b],[b,a])).success,false);assert.equal(p.llamadas.length,0)
 for(const nuevo of [[a],[a,a],[b,min],[]])assert.equal((await preparar().api.reordenarCancionesServicio(min,evt,[a,b],nuevo)).success,false)
})
test('guarda orden completo en una operación y revalida setlist y programación',async()=>{
 const p=preparar();assert.equal((await p.api.reordenarCancionesServicio(min,evt,[a,b],[b,a])).success,true)
 assert.equal(p.llamadas.length,1);assert.equal(p.llamadas[0][0],'vida_reordenar_repertorio');assert.deepEqual([...p.llamadas[0][1].p_nuevo],[b,a]);assert.deepEqual([...p.llamadas[0][1].p_esperado],[a,b]);assert.equal(p.llamadas[0][1].p_ministerio,min);assert.equal(p.llamadas[0][1].p_evento,evt);assert.ok(p.reval.includes(`/ministerios/${min}/setlist`))
})
test('conflicto o fallo de función no se presentan como orden guardado',async()=>{
 for(const code of ['40001','42883']){const p=preparar({rpcError:{code}});const r=await p.api.reordenarCancionesServicio(min,evt,[a,b],[b,a]);assert.equal(r.success,false);assert.equal(p.reval.length,0);if(code==='40001')assert.match(r.error,/Otra persona/)}
})
test('propuesta bloquea filas y solo admite la misma lista; ejecución exclusiva del servidor',()=>{
 const sql=fs.readFileSync('docs/sql-candidates/ORDEN_REPERTORIO_2026-11-18.sql','utf8')
 assert.match(sql,/security invoker/);assert.match(sql,/for update/);assert.match(sql,/actual is distinct from p_esperado/);assert.match(sql,/grant execute[\s\S]*to service_role/);assert.match(sql,/from public,anon,authenticated/)
 assert.doesNotMatch(sql,/delete from|truncate|set (titulo|tonalidad|notas|acordes)|create policy|security definer/i)
 const migracion=fs.readFileSync('supabase/migrations/20261118130000_orden_repertorio_atomico.sql','utf8')
 const sinComentarios=s=>s.replace(/^--.*$/gm,'').trim()
 assert.equal(sinComentarios(sql),sinComentarios(migracion))
})
