import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const ranking=cargarModulo('lib/estudios/biblical-search-ranking.ts')
const sample={termId:'texto',term:'Odio y aborrecimiento',description:'RV1909',score:1,matches:[{reference:'1 Juan 2:9',bookCode:'1JN',chapter:2,verse:9,excerpt:'El que dice que está en luz, y aborrece á su hermano, el tal aun está en tinieblas todavía.',relevance:1,relationKind:'direct'}]}
function query(table,resolver,calls){const q={table,ops:[],then(a,b){return Promise.resolve(resolver(q)).then(a,b)}};calls.push(q);for(const k of ['select','eq','gt','in','or','order','limit','maybeSingle'])q[k]=(...args)=>{q.ops.push([k,...args]);return q};return q}
function textReader({user=true,unapproved=false,failed=false,verses=[{book_code:'1JN',chapter:2,verse:9,original_text:sample.matches[0].excerpt}]}={}){
 const calls=[],db={auth:{getUser:async()=>({data:{user:user?{id:'actor'}:null}})},from:table=>query(table,q=>table==='biblical_sources'?{data:unapproved?null:{id:'rv1909',name:'Reina-Valera 1909'},error:null}:table==='biblical_books'?{data:[{code:'1JN',name_es:'1 Juan'}],error:null}:{data:failed?null:verses,error:failed?{message:'no disponible'}:null},calls)}
 return{calls,api:cargarModulo('lib/estudios/biblical-text-search.ts',{'server-only':{},'@/lib/neon/biblical-client':{createClient:async()=>db},'./biblical-search-ranking':ranking})}
}
test('odio y preguntas sobre odiar se buscan como odio/aborrecer; nunca como amor',()=>{
 const{api}=textReader()
 for(const q of ['odio','Dime algo del odio','¿Qué dice la Biblia sobre odiar a alguien?','aborrecer']){
  const plan=api.planBusquedaLiteral(q);assert.equal(plan.odio,true);assert.deepEqual([...plan.patrones],['%odio%','%aborre%'])
  assert.equal(api.coincidePalabraBuscada('Amaos unos a otros.',plan),false)
  assert.equal(api.coincidePalabraBuscada('Herodías',plan),false)
  assert.equal(api.coincidePalabraBuscada('Un comienzo muy largo. '.repeat(20)+'Aborrece a su hermano.',plan),true)
 }
 assert.equal(api.planBusquedaLiteral('odio y amor'),null)
 assert.equal(api.planBusquedaLiteral('%_\' OR 1=1 --'),null)
 assert.equal(api.planBusquedaLiteral('x'.repeat(181)),null)
})
test('devuelve referencia y texto reales con fuente aprobada, filtros y límite acotado',async()=>{
 const{api,calls}=textReader();const r=await api.buscarTextoBiblico('odio')
 assert.equal(r[0].term,'Odio y aborrecimiento');assert.equal(r[0].matches[0].reference,'1 Juan 2:9');assert.equal(r[0].matches[0].excerpt,sample.matches[0].excerpt)
 const source=calls.find(q=>q.table==='biblical_sources'),verses=calls.find(q=>q.table==='biblical_verse_texts')
 for(const pair of [['slug','rv1909-ebible'],['review_status','approved'],['license_status','verified'],['enabled',true]])assert.ok(source.ops.some(([op,k,v])=>op==='eq'&&k===pair[0]&&v===pair[1]))
 assert.ok(verses.ops.some(([op,k,v])=>op==='eq'&&k==='source_id'&&v==='rv1909'));assert.ok(verses.ops.some(([op,n])=>op==='limit'&&n===80))
 assert.ok(calls.every(q=>['biblical_sources','biblical_verse_texts','biblical_books'].includes(q.table)))
})
test('sin sesión, fuente aprobada o lectura disponible no inventa resultados',async()=>{
 for(const options of [{user:false},{unapproved:true},{failed:true},{verses:[{book_code:'1JN',chapter:2,verse:9,original_text:'Dios es amor.'}]}]){
  const{api,calls}=textReader(options);assert.equal((await api.buscarTextoBiblico('odio')).length,0);if(options.user===false)assert.equal(calls.length,0)
 }
})
function action({user=true,direct=[],text=[],suggestions=null,place=null,study=null}={}){
 const reads=[],db={auth:{getUser:async()=>({data:{user:user?{id:'actor'}:null}})}}
 const api=cargarModulo('app/actions/estudio-interno.ts',{
  '@/lib/supabase/server':{createClient:async()=>db},
  '@/lib/estudios/internal-study':{obtenerEstudioInterno:()=>study},
  '@/lib/estudios/biblical-concordance':{buscarConcordanciasBiblicas:async(q)=>{reads.push(q);return{results:direct}},buscarConcordanciasParaReferencia:async()=>({results:[]})},
  '@/lib/estudios/biblical-place-search':{buscarLugarBiblico:async()=>place},
  '@/lib/estudios/biblical-search-assist':{asistirTemaBiblico:async()=>{reads.push('assist');return suggestions}},
  '@/lib/estudios/biblical-text-search':{buscarTextoBiblico:async(q)=>{reads.push('text:'+q);return text}},
  '@/lib/estudios/biblical-context-corpus':{getInternalBiblicalContext:async()=>null},
  '@/lib/estudios/multilingual-biblical-textual-study':{getVidaBiblicalTextualStudy:async()=>null},
  '@/lib/estudios/biblical-chronology-maps':{},'@/app/actions/traduccion-espanola-estudio':{cargarTraduccionEspanolaEstudio:async()=>null},'@/app/actions/estudio':{},
 });const run=async q=>{const f=new FormData();f.set('pasaje',q);return api.analizarPasaje({status:'idle'},f)};return{run,reads}
}
test('el recorrido completo conserva odio y sus pasajes antes de cualquier alternativa',async()=>{
 const{run,reads}=action({text:[sample]});const r=await run('odio');assert.equal(r.status,'success');assert.equal(r.query,'odio');assert.equal(r.resultSource,'text');assert.equal(r.results[0].matches[0].bookCode,'1JN');assert.equal(reads.includes('assist'),false)
})
test('amor y perdón relacionados requieren selección explícita; no ejecuta sus búsquedas',async()=>{
 const suggestions=['Amor','Perdón'].map(label=>({label,query:label,detail:'Relacionado',score:.74}))
 const{run,reads}=action({suggestions:{kind:'suggestions',suggestions}});const r=await run('odio');assert.equal(r.status,'suggestions');assert.equal(r.query,'odio');assert.equal(r.suggestionKind,'related');assert.equal('interpretedAs' in r,false);assert.deepEqual(reads,['odio','text:odio','assist'])
})
test('mantiene concordancias directas, lugares, pasajes y autenticación',async()=>{
 const direct=action({direct:[sample]});assert.equal((await direct.run('perdón')).kind,'concordance');assert.deepEqual(direct.reads,['perdón'])
 const geo=action({place:{kind:'place',place:{name:'Patmos'}}});assert.equal((await geo.run('Patmos')).status,'place');assert.equal(geo.reads.length,0)
 const passage=action({study:{pasaje:'Juan 3:16',resultado:{}}});assert.equal((await passage.run('Juan 3:16')).kind,'study');assert.equal(passage.reads.length,0)
 const guest=action({user:false});assert.equal((await guest.run('odio')).status,'error');assert.equal(guest.reads.length,0)
})
test('una elección primary de IA tampoco reemplaza automáticamente una consulta no equivalente',async()=>{
 const calls=[]
 const db={auth:{getUser:async()=>({data:{user:{id:'actor'}}})},from:table=>query(table,()=>({data:table==='biblical_concordance_terms'?[{id:'amor',canonical_term:'Amor',normalized_term:'amor',description:null}]:[],error:null}),calls)}
 const relations=cargarModulo('lib/estudios/biblical-search-relations.ts',{'@/lib/estudios/biblical-search-ranking':ranking})
 const api=cargarModulo('lib/estudios/biblical-search-assist.ts',{'server-only':{},'@/lib/neon/biblical-client':{createClient:async()=>db},'@/lib/ai/vida-ai':{VidaAiError:class extends Error{},vidaAI:async()=>({text:'{"primary":"Amor","alternatives":[]}'})},'@/lib/estudios/biblical-search-ranking':ranking,'@/lib/estudios/biblical-search-relations':relations})
 const r=await api.asistirTemaBiblico('rechazo');assert.equal(r.kind,'suggestions');assert.equal(r.suggestions[0].label,'Amor')
})
