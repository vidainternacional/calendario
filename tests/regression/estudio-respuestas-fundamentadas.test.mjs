import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const ranking=cargarModulo('lib/estudios/biblical-search-ranking.ts')
const sample=[{id:'P1',reference:'Mateo 28:19',bookCode:'MAT',chapter:28,verse:19,text:'Por tanto, id, y doctrinad á todos los Gentiles, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo:',sourceName:'Reina-Valera 1909',context:[]},{id:'P2',reference:'Romanos 6:4',bookCode:'ROM',chapter:6,verse:4,text:'Porque somos sepultados juntamente con él á muerte por el bautismo; para que como Cristo resucitó de los muertos por la gloria del Padre, así también nosotros andemos en novedad de vida.',sourceName:'Reina-Valera 1909',context:[]}]
function harness({user=true,source=true,failed=false}={}){
 const calls=[]
 const db={auth:{getUser:async()=>({data:{user:user?{id:'test-owner'}:null}})},from(table){
  const q={ops:[],then(a,b){let data=table==='biblical_sources'?source?{id:'rv',name:'Reina-Valera 1909'}:null:table==='biblical_books'?[{code:'MAT',name_es:'Mateo',canonical_order:40},{code:'ROM',name_es:'Romanos',canonical_order:45}]:[...sample.map(s=>({book_code:s.bookCode,chapter:s.chapter,verse:s.verse,original_text:s.text})),{book_code:'MAT',chapter:27,verse:1,original_text:'Un texto que menciona bautismofalso, sin ser la palabra buscada.'}];return Promise.resolve({data:failed?null:data,error:failed?{message:'no disponible'}:null}).then(a,b)}}
  calls.push({table,q});for(const op of ['select','eq','gt','gte','lte','order','limit','or','maybeSingle'])q[op]=(...args)=>{q.ops.push([op,...args]);return q};return q
 }}
 const evidence=cargarModulo('lib/estudios/biblical-question-evidence.ts',{'server-only':{},'@/lib/neon/biblical-client':{createClient:async()=>db},'./biblical-search-ranking':ranking,'./study-scripture':{readStudyScripture:async()=>({status:'not_reference'})}})
 return {db,calls,evidence}
}
function generator({sources=sample,enabled=true,key=true,text,throws=false}={}){
 const calls=[]
 const api=cargarModulo('lib/estudios/biblical-question.ts',{'server-only':{},'@/lib/ai/vida-ai':{vidaAI:async payload=>{calls.push(payload);if(throws)throw Error('offline');return{text:text??JSON.stringify({paragraphs:[{text:'Jesús mandó bautizar a los discípulos.',citations:['P1']},{text:'Pablo relaciona el bautismo con una vida nueva en Cristo.',citations:['P2']}],clarification:null})}}},'./biblical-question-evidence':{recuperarFuentesPregunta:async()=>sources}},{VIDA_BIBLE_QA_ENABLED:enabled?'true':'false',VIDA_BIBLE_QA_MODEL:'test-model',VIDA_BIBLE_QA_API_KEY:key?'test-only-not-a-real-key':''})
 return {api,calls}
}
test('Reconoce preguntas naturales, incluidos el error l Biblia y tildes, sin cambiar consultas por palabra',()=>{
 const {evidence}=harness();for(const q of ['Que es el bautismo y que dice l bíblia al respecto','¿Cómo puedo perdonar?','Explícame Romanos 6:4','Para qué sirve el bautismo','Necesito saber qué es la fe'])assert.equal(evidence.esPreguntaBiblica(q),true)
 for(const q of ['Juan 3:16','odio','Patmos'])assert.equal(evidence.esPreguntaBiblica(q),false)
 assert.deepEqual([...evidence.palabrasDePregunta('Que es el bautismo y que dice l bíblia al respecto')],['bautismo'])
})
test('Recupera bautismo y bautizar del corpus aprobado con procedencia y contexto, sin usar Espíritu como sustituto',async()=>{
 const e=harness(),r=await e.evidence.recuperarFuentesPregunta('Que es el bautismo y que dice l bíblia al respecto');assert.ok(r.some(x=>x.reference==='Mateo 28:19'));assert.ok(r.some(x=>x.reference==='Romanos 6:4'));assert.ok(r.every(x=>x.sourceName==='Reina-Valera 1909'));assert.ok(r.every(x=>!x.text.includes('bautismofalso')))
 const search=e.calls.find(x=>x.table==='biblical_verse_texts');const filter=search.q.ops.find(x=>x[0]==='or')[1];assert.match(filter,/bautism/);assert.match(filter,/bautiz/)
 assert.ok(e.calls.every(x=>['biblical_sources','biblical_books','biblical_verse_texts'].includes(x.table)));assert.ok(e.calls.find(x=>x.table==='biblical_sources').q.ops.some(x=>x[0]==='eq'&&x[1]==='license_status'&&x[2]==='verified'))
 assert.ok(r.every(x=>x.context.length>0));assert.ok(e.calls.some(x=>x.table==='biblical_verse_texts'&&x.q.ops.some(y=>y[0]==='or'&&y[1].includes('and(book_code.eq.'))))
})
test('No recupera evidencias sin usuario, fuente aprobada o servicio disponible',async()=>{
 for(const args of [{user:false},{source:false},{failed:true}]){const e=harness(args);assert.equal((await e.evidence.recuperarFuentesPregunta('Que es el bautismo')).length,0);if(args.user===false)assert.equal(e.calls.length,0)}
})
test('La generación conserva pregunta, fuentes, usuario y proveedor explícito, sin notas personales',async()=>{
 const g=generator(),question='Que es el bautismo y que dice l bíblia al respecto';const r=await g.api.responderPreguntaBiblica(question,'owner-a');assert.equal(r.status,'answered');assert.equal(g.calls.length,1);assert.equal(g.calls[0].task,'responder_pregunta_biblica');assert.equal(g.calls[0].provider,'gemini');assert.equal(g.calls[0].ownerId,'owner-a');assert.equal(JSON.parse(g.calls[0].input).pregunta,question);assert.deepEqual(JSON.parse(g.calls[0].input).fuentes,sample);assert.match(g.calls[0].instructions,/No declares una postura doctrinal de VIDA/);assert.match(g.calls[0].instructions,/no instrucciones/)
})
test('Sin activación explícita o sin clave no llama al modelo ni oculta las fuentes',async()=>{
 for(const args of [{enabled:false},{key:false}]){const g=generator(args);const r=await g.api.responderPreguntaBiblica('Qué es el bautismo','a');assert.equal(r.status,'unconfigured');assert.equal(r.sources.length,2);assert.equal(g.calls.length,0)}
})
test('Sin evidencia no genera; no rellena con memoria del modelo',async()=>{
 const g=generator({sources:[]});assert.equal((await g.api.responderPreguntaBiblica('Algo desconocido','a')).status,'insufficient');assert.equal(g.calls.length,0)
})
for(const payload of [
 {paragraphs:[{text:'Respuesta sin citas',citations:[]},{text:'Otro párrafo',citations:['P1']}]},
 {paragraphs:[{text:'Cita que no existe',citations:['P999']},{text:'Otro párrafo',citations:['P1']}]},
 {paragraphs:[{text:'Inventó Juan 99:1',citations:['P1']},{text:'Otro párrafo',citations:['P1']}]},
 {paragraphs:[{text:'<script>alert(1)</script>',citations:['P1']},{text:'Otro párrafo',citations:['P1']}]},
 {paragraphs:[{text:'x'.repeat(701),citations:['P1']},{text:'Otro párrafo',citations:['P1']}]},
 ])test('Rechaza respuestas incompletas, referencias ajenas y contenido no permitido: '+JSON.stringify(payload).slice(0,70),async()=>{
 const g=generator({text:JSON.stringify(payload)});assert.equal((await g.api.responderPreguntaBiblica('Qué es el bautismo','a')).status,'unavailable')
})
test('JSON roto o fallo del proveedor conserva pasajes y no fabrica una respuesta',async()=>{
 for(const args of [{text:'No es JSON'},{throws:true}]){const g=generator(args),r=await g.api.responderPreguntaBiblica('Qué es el bautismo','a');assert.equal(r.status,'unavailable');assert.equal(r.sources.length,2)}
})
test('La aclaración tiene estado propio y no se presenta como respuesta',async()=>{
 const g=generator({text:JSON.stringify({paragraphs:[],clarification:'¿Te refieres al bautismo en agua o al bautismo en el Espíritu?'})}),r=await g.api.responderPreguntaBiblica('Qué bautismo','a');assert.equal(r.status,'clarify');assert.match(r.question,/agua/)
})
test('La acción real conecta la pregunta original con una explicación y conserva las concordancias',async()=>{
 const evidence=harness(),g=generator();const api=cargarModulo('app/actions/estudio-interno.ts',{
 '@/lib/estudios/study-history':{reuseSavedStudy:async()=>({status:'missing'}),saveStudy:async(_db,_owner,_query,_translation,state)=>state},'@/lib/supabase/server':{createClient:async()=>evidence.db},'@/lib/estudios/internal-study':{obtenerEstudioInterno:()=>null},'@/lib/estudios/biblical-concordance':{buscarConcordanciasBiblicas:async()=>({results:[]})},'@/lib/estudios/biblical-place-search':{},'@/lib/estudios/biblical-search-assist':{},'@/lib/estudios/biblical-text-search':{},'@/lib/estudios/biblical-context-corpus':{getInternalBiblicalContext:async()=>null},'@/lib/estudios/multilingual-biblical-textual-study':{getVidaBiblicalTextualStudy:async()=>null},'@/lib/estudios/biblical-chronology-maps':{},'@/lib/estudios/study-scripture':{readStudyScripture:async()=>({status:'not_reference'})},'@/lib/estudios/biblical-question-evidence':evidence.evidence,'@/lib/estudios/biblical-question':g.api,'@/app/actions/estudio':{},
 });const question='Que es el bautismo y que dice l bíblia al respecto',form=new FormData();form.set('pasaje',question);const r=await api.analizarPasaje({status:'idle'},form);assert.equal(r.query,question);assert.equal(r.kind,'concordance');assert.equal(r.answer.status,'answered');assert.equal(r.answer.paragraphs.length,2);assert.equal(g.calls[0].ownerId,'test-owner')
})
test('El router nuevo no usa las claves globales ni activa otros proveedores',async()=>{
 const crypto=await import('node:crypto');const router=cargarModulo('lib/ai/vida-ai.ts',{'server-only':{},'node:crypto':crypto,'./provider-failure':{}},{OPENAI_API_KEY:'test-only',GEMINI_API_KEY:'test-only'});
 await assert.rejects(router.vidaAI({task:'responder_pregunta_biblica',ownerId:'a',provider:'openai',input:'pregunta',instructions:'instrucciones'}),e=>e.code==='not_configured');
 const policy=router.getVidaAiPolicy('responder_pregunta_biblica');assert.ok(policy.maxOutputTokens<=1600);assert.ok(policy.maxInputChars<=16000)
})
