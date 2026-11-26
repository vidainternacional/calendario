import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import { cargarModulo } from './seguridad-real-loader.mjs'
const deps={'server-only':{},'node:crypto':crypto,'node:buffer':{Buffer}}
const history=cargarModulo('lib/estudios/study-history.ts',deps)
const A='71000000-0000-4000-8000-000000000001',B='71000000-0000-4000-8000-000000000002',ID='61000000-0000-4000-8000-000000000001'
const answer={status:'success',kind:'concordance',query:'Qué es el bautismo',results:[],answer:{status:'answered',paragraphs:[{text:'Respuesta guardada',citations:['P1']}],sources:[{id:'P1',reference:'Mateo 28:19',bookCode:'MAT',chapter:28,verse:19,text:'Texto fixture',sourceName:'RV1909',context:[]}]}}
function dbFixture({user=A,unavailable=false,rows=[]}={}){
 const stored=rows.map(r=>({...r})),calls=[]
 const db={auth:{getUser:async()=>({data:{user:user?{id:user}:null}})},from(table){
  const q={table,ops:[],then(a,b){if(unavailable)return Promise.resolve({data:null,error:{message:'no disponible'},count:null}).then(a,b);let selected=stored;
   for(const[op,key,value]of q.ops)if(op==='eq')selected=selected.filter(r=>r[key]===value)
   const mutation=q.ops.find(x=>x[0]==='upsert');if(mutation){let row=stored.find(r=>r.profile_id===mutation[1].profile_id&&r.consulta_key===mutation[1].consulta_key&&r.version===mutation[1].version);if(!row){row={id:ID,created_at:'2026-11-26T00:00:00Z'};stored.push(row)}Object.assign(row,mutation[1]);selected=[row]}
   if(q.ops.some(x=>x[0]==='delete')){for(const row of selected)stored.splice(stored.indexOf(row),1);selected=[]}
   const count=selected.length;const range=q.ops.find(x=>x[0]==='range');if(range)selected=selected.slice(range[1],range[2]+1)
   const data=q.ops.some(x=>['single','maybeSingle'].includes(x[0]))?selected[0]??null:selected
   return Promise.resolve({data,error:null,count}).then(a,b)
  }};calls.push(q);for(const op of ['select','eq','order','range','maybeSingle','single','upsert','delete'])q[op]=(...args)=>{q.ops.push([op,...args]);return q};return q
 }};return{db,stored,calls}
}
const row=(owner=A,state=answer)=>({id:ID,profile_id:owner,consulta:state.query,consulta_key:history.historyQueryKey(state.query),version:history.STUDY_HISTORY_VERSION,tipo:'concordance',resultado:structuredClone(state),created_at:'2026-11-26T00:00:00Z'})
function core(e){let generated=0;const api=cargarModulo('app/actions/estudio-interno.ts',{
 '@/lib/supabase/server':{createClient:async()=>e.db},'@/lib/estudios/study-history':history,
 '@/lib/estudios/internal-study':{obtenerEstudioInterno:()=>null},'@/lib/estudios/biblical-concordance':{buscarConcordanciasBiblicas:async()=>({results:[]})},'@/lib/estudios/biblical-place-search':{},'@/lib/estudios/biblical-search-assist':{},'@/lib/estudios/biblical-text-search':{},'@/lib/estudios/biblical-context-corpus':{getInternalBiblicalContext:async()=>null},'@/lib/estudios/multilingual-biblical-textual-study':{getVidaBiblicalTextualStudy:async()=>null},'@/lib/estudios/biblical-chronology-maps':{},'@/lib/estudios/study-scripture':{readStudyScripture:async()=>({status:'not_reference'})},'@/lib/estudios/biblical-question-evidence':{esPreguntaBiblica:()=>true},'@/lib/estudios/biblical-question':{responderPreguntaBiblica:async()=>{generated++;return answer.answer}},'@/app/actions/estudio':{},
 });return {run:async(query=answer.query)=>{const f=new FormData();f.set('pasaje',query);return api.analizarPasaje({status:'idle'},f)},generated:()=>generated}
}
const actions=e=>cargarModulo('app/actions/estudio-historial.ts',{'@/lib/supabase/server':{createClient:async()=>e.db},'@/lib/estudios/study-history':history})
test('La clave conserva negaciones, tildes y traducción, tolerando solo mayúsculas/espacios',()=>{
 assert.equal(history.historyQueryKey(' QUÉ   ES EL BAUTISMO '),history.historyQueryKey(answer.query));assert.notEqual(history.historyQueryKey('Quiero perdonar'),history.historyQueryKey('No quiero perdonar'));assert.notEqual(history.historyQueryKey('si'),history.historyQueryKey('sí'));assert.notEqual(history.historyQueryKey('Juan 3:16','spa_r09'),history.historyQueryKey('Juan 3:16','otra'))
})
test('La primera pregunta genera una vez y se guarda; repetirla recupera exactamente la respuesta sin IA',async()=>{
 const e=dbFixture(),c=core(e);const first=await c.run();assert.equal(c.generated(),1);assert.equal(first.history.reused,false);assert.equal(e.stored.length,1);const second=await c.run(' QUÉ   ES EL BAUTISMO ');assert.equal(c.generated(),1);assert.equal(second.history.reused,true);assert.deepEqual(second.answer,first.answer);assert.equal(e.stored.length,1)
})
test('Una respuesta ajena no se reutiliza y el guardado queda ligado al usuario autenticado',async()=>{
 const e=dbFixture({rows:[row(B)]}),c=core(e);await c.run();assert.equal(c.generated(),1);assert.equal(e.stored.length,2);assert.equal(e.stored[1].profile_id,A)
})
test('Sin sesión no lee historial, no guarda y no genera',async()=>{
 const e=dbFixture({user:null}),c=core(e);assert.equal((await c.run()).status,'error');assert.equal(c.generated(),0);assert.equal(e.calls.length,0)
})
test('Si no se puede comprobar el historial no vuelve a consumir IA',async()=>{
 const e=dbFixture({unavailable:true}),c=core(e),result=await c.run();assert.equal(result.status,'error');assert.match(result.error,/no enviamos/i);assert.equal(c.generated(),0)
})
test('No cachea fallos, aclaraciones, sugerencias o ausencia de conexión',async()=>{
 const e=dbFixture();for(const state of [{status:'error',error:'error'},{status:'suggestions',query:'a',suggestions:[]},{...answer,answer:{status:'unavailable',sources:[]}},{...answer,answer:{status:'clarify',question:'Cuál',sources:[]}}])assert.deepEqual(await history.saveStudy(e.db,A,'a','spa_r09',state),state);assert.equal(e.calls.length,0)
})
test('Un fallo al guardar conserva la respuesta y advierte; no la vuelve a generar',async()=>{
 const e=dbFixture({unavailable:true}),saved=await history.saveStudy(e.db,A,answer.query,'spa_r09',answer);assert.deepEqual(saved.answer,answer.answer);assert.match(saved.historyWarning,/no pudimos guardarla/)
})
test('Snapshots demasiado grandes no se truncan ni se guardan parcialmente',async()=>{
 const e=dbFixture(),state={status:'success',kind:'study',query:'Juan 3',pasaje:'Juan 3',resultado:{explicacion:'x'.repeat(525000)}};const saved=await history.saveStudy(e.db,A,state.query,'spa_r09',state);assert.match(saved.historyWarning,/supera el tamaño/);assert.equal(saved.resultado.explicacion.length,525000);assert.equal(e.calls.length,0)
})
test('Abrir historial devuelve el snapshot sin enlazar el generador',async()=>{
 const e=dbFixture({rows:[row()]}),r=await actions(e).abrirEstudioHistorial(ID);assert.equal(r.history.reused,true);assert.deepEqual(r.answer,answer.answer);assert.ok(e.calls.every(q=>q.table==='estudio_historial_privado'));assert.ok(e.calls[0].ops.some(x=>x[0]==='eq'&&x[1]==='profile_id'&&x[2]===A))
})
test('No abre ni elimina respuestas ajenas y rechaza identificadores arbitrarios',async()=>{
 const e=dbFixture({rows:[row(B)]}),a=actions(e);assert.equal((await a.abrirEstudioHistorial(ID)).status,'error');await a.eliminarEstudioHistorial(ID);assert.equal(e.stored.length,1);const n=e.calls.length;assert.equal((await a.abrirEstudioHistorial('no-id')).status,'error');assert.equal(e.calls.length,n)
})
test('El listado pagina metadatos y no descarga las respuestas ni se limita a diez registros',async()=>{
 const e=dbFixture({rows:Array.from({length:31},(_,i)=>({...row(),id:`61000000-0000-4000-8000-${String(i).padStart(12,'0')}`}))}),a=actions(e),first=await a.listarEstudiosHistorial(),second=await a.listarEstudiosHistorial(25);assert.equal(first.items.length,25);assert.equal(first.hasMore,true);assert.equal(first.total,31);assert.equal(second.items.length,6);assert.equal(second.hasMore,false);assert.ok(e.calls.every(q=>q.ops.find(x=>x[0]==='select')[1]==='id,consulta,created_at,tipo'));assert.equal((await a.listarEstudiosHistorial(-1)).success,false)
})
test('Reutilizar no incluye recibos anteriores dentro del snapshot que se guarda',async()=>{
 const e=dbFixture(),saved=await history.saveStudy(e.db,A,answer.query,'spa_r09',{...answer,history:{id:ID,createdAt:'ayer',reused:true},historyWarning:'anterior'});assert.equal(saved.history.reused,false);assert.equal(e.stored[0].resultado.history,undefined);assert.equal(e.stored[0].resultado.historyWarning,undefined)
})
