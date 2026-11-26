import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { cargarModulo } from './seguridad-real-loader.mjs'

const index = JSON.parse(fs.readFileSync('tests/fixtures/estudio-indice-editorial.json', 'utf8'))
const ranking = cargarModulo('lib/estudios/biblical-search-ranking.ts')
const intent = cargarModulo('lib/estudios/biblical-query-intent.ts', { './biblical-search-ranking': ranking })
const books = [{code:'JHN',canonical_order:43,name_es:'Juan',name_en:'John',chapter_count:21,testament:'new',canonical_section:'gospels',original_languages:['greek'],aliases:['Jn'],metadata:{}}]
books.push({...books[0],code:'1JN',name_es:'1 Juan',name_en:'1 John',chapter_count:5,aliases:[]})
books.push({...books[0],code:'PSA',name_es:'Salmos',name_en:'Psalms',chapter_count:150,aliases:['Salmo','Ps'],testament:'old',original_languages:['hebrew']})
const source = {id:'rv',slug:'rv1909-ebible',name:'Reina-Valera 1909',provider_version:'fixture',attribution:null}
const verse = (chapter, n) => ({source_id:'rv',book_code:'JHN',chapter,verse:n,language:'spanish',enabled:true,review_status:'approved',original_text:`Texto de prueba ${chapter}:${n}`,content_hash:'fixture'})
const rows = [...Array.from({length:36},(_,i)=>verse(3,i+1)),...Array.from({length:54},(_,i)=>verse(4,i+1))]
rows.push({...verse(2,9),book_code:'1JN',original_text:'El que dice que está en luz, y aborrece á su hermano, el tal aun está en tinieblas todavía.'})
const context = chapter => ({slug:`context-${chapter}`,scope_kind:'chapter',chapter_start:chapter,chapter_end:chapter,title:`Contexto ${chapter}`,summary:`Resumen ${chapter}`,historical_context:`Historia ${chapter}`,jewish_context:'',literary_context:'',authorial_intent:'',theological_reflection:'',interpretive_cautions:'',key_terms:[],people_groups:[],places:[],source_locator:'fixture',provider_version:'fixture',content_hash:`context-${chapter}`})

function environment({user=true,failed=null,textRows=rows,terms=index.terms,aliases=index.aliases}={}) {
 const calls=[]
 const db={auth:{getUser:async()=>({data:{user:user?{id:'test-only'}:null}})},from(table){
  const q={table,ops:[],then(a,b){
   if(table===failed)return Promise.resolve({data:null,error:{message:'offline'}}).then(a,b)
   let data=table==='biblical_books'?books:table==='biblical_sources'?[source]:table==='biblical_verse_texts'?textRows:table==='biblical_context_units'?[context(3),context(4)]:table==='biblical_concordance_terms'?terms:table==='biblical_concordance_aliases'?aliases:table==='biblical_concordance_occurrences'?terms.map(t=>({term_id:t.id,book_code:'JHN',chapter:3,verse:16,reference_label:'Prueba de ranking',verse_excerpt:'Fixture de concordancia',relevance:1,relation_kind:'direct',enabled:true,review_status:'approved'})):[]
   for(const [op,key,val]of q.ops){
    if(['eq','gt','gte','lte','in'].includes(op))data=data.filter(r=>!(key in r)||({eq:()=>r[key]===val,gt:()=>r[key]>val,gte:()=>r[key]>=val,lte:()=>r[key]<=val,in:()=>val.includes(r[key])}[op]()))
    if(op==='or'){const patterns=key.split(',').map(x=>x.replace('original_text.ilike.','').replaceAll('%','').toLowerCase());data=data.filter(r=>patterns.some(p=>String(r.original_text??'').toLowerCase().includes(p)))}
    if(op==='range')data=data.slice(key,val+1)
    if(op==='limit')data=data.slice(0,key)
   }
   if(q.ops.some(([op])=>op==='maybeSingle'))data=data[0]??null
   return Promise.resolve({data,error:null}).then(a,b)
  }}
  calls.push(q)
  for(const op of ['select','eq','gt','gte','lte','in','order','limit','maybeSingle','range','or'])q[op]=(...args)=>{q.ops.push([op,...args]);return q}
  return q
 }}
 const deps={'server-only':{},'node:crypto':crypto,'@/lib/neon/biblical-client':{createClient:async()=>db},'./biblical-query-intent':intent}
 const parser=cargarModulo('lib/estudios/biblical-context-corpus.ts',deps)
 const concordance=cargarModulo('lib/estudios/biblical-concordance.ts',deps)
 const textual=cargarModulo('lib/estudios/biblical-text-search.ts',{...deps,'./biblical-search-ranking':ranking})
 const scripture=cargarModulo('lib/estudios/study-scripture.ts',{...deps,'./biblical-context-corpus':parser})
 return{db,calls,parser,concordance,scripture,textual}
}

for(const query of ['ira','clamor','amor y odio','¿Qué dice la Biblia sobre odiar a alguien?','no quiero perdonar'])test(`No responde otra pregunta por coincidencias parciales: ${query}`,async()=>{
 const e=environment();assert.equal((await e.concordance.buscarConcordanciasBiblicas(query)).results.length,0)
})
for(const [query,expected]of [['amor','Amor'],['¿Qué dice la Biblia del perdón?','Perdón'],['qué hacer cuando tengo miedo','Miedo y valentía'],['mentira','Palabras y comunicación'],['¿Qué es la fe?','Fe']])test(`Conserva el tema aprobado: ${query}`,async()=>{
 const e=environment();const r=await e.concordance.buscarConcordanciasBiblicas(query);assert.ok(r.results.some(x=>x.term===expected),JSON.stringify(r))
})
test('Los 305 alias editoriales conservan su tema aprobado, incluyendo tildes',async()=>{
 for(const alias of index.aliases){const term=index.terms.find(t=>t.id===alias.term_id);const e=environment({terms:[term],aliases:index.aliases.filter(a=>a.term_id===term.id)});const r=await e.concordance.buscarConcordanciasBiblicas(alias.alias);assert.equal(r.results[0]?.term,term.canonical_term,alias.alias)}
})
for(const [query,label,endChapter,endVerse]of [['Juan 3:16-18','Juan 3:16-18',3,18],['Juan 3:16–18','Juan 3:16-18',3,18],['Juan 3:16—18','Juan 3:16-18',3,18],['Juan 3-4','Juan 3-4',4,null],['Juan 3:36-4:2','Juan 3:36-4:2',4,2]])test(`Conserva rango y referencia: ${query}`,async()=>{
 const e=environment();const r=await e.parser.parseInternalBibleReference(query);assert.equal(r.canonicalReference,label);assert.equal(r.endChapter,endChapter);assert.equal(r.endVerse,endVerse)
})
for(const query of ['Juan 3:18-16','Juan 4-3','Juan 21-22','Juan 3-4:2','Juan 3:0','Juan 22:1'])test(`No acepta rango o referencia mal formada: ${query}`,async()=>assert.equal(await environment().parser.parseInternalBibleReference(query),null))
test('La lectura incluye todo el rango, sin confundirlo con un único versículo',async()=>{
 const e=environment();const r=await e.scripture.readStudyScripture('Juan 3:16-18');assert.equal(r.status,'ready');assert.deepEqual([...r.translation.verses.map(v=>v.verse)],[16,17,18]);assert.equal(r.translation.canonicalReference,'Juan 3:16-18')
})
test('Dos capítulos completos y un rango que cruza capítulo conservan sus números',async()=>{
 const e=environment();const a=await e.scripture.readStudyScripture('Juan 3-4');assert.equal(a.translation.verses.length,90)
 const b=await e.scripture.readStudyScripture('Juan 3:36-4:2');assert.deepEqual([...b.translation.verses.map(v=>`${v.chapter}:${v.verse}`)],['3:36','4:1','4:2'])
 const c=await e.parser.getInternalBiblicalContext('Juan 3-4');assert.deepEqual([...c.rangeContexts.map(x=>x.title)],['Contexto 3','Contexto 4'])
})
test('Paginación recupera más de 500 versículos sin truncar',async()=>{
 const textRows=Array.from({length:650},(_,i)=>verse(3,i+1));const e=environment({textRows});const r=await e.scripture.readStudyScripture('Juan 3');assert.equal(r.status,'ready');assert.equal(r.translation.verses.length,650);assert.equal(e.calls.filter(x=>x.table==='biblical_verse_texts').length,2)
})
test('Cita inexistente, servicio caído y hueco interno son estados distintos',async()=>{
 const missing=await environment().scripture.readStudyScripture('Juan 3:99');assert.equal(missing.status,'missing')
 const offline=await environment({failed:'biblical_verse_texts'}).scripture.readStudyScripture('Juan 3:16');assert.equal(offline.status,'unavailable')
 const sourceOffline=await environment({failed:'biblical_sources'}).scripture.readStudyScripture('Juan 3:16');assert.equal(sourceOffline.status,'unavailable')
 const gap=await environment({textRows:rows.filter(r=>r.chapter!==3||r.verse!==17)}).scripture.readStudyScripture('Juan 3:16-18');assert.equal(gap.status,'unavailable')
})
test('No lee textos sin sesión ni escribe datos o añade fuentes',async()=>{
 const e=environment({user:false});assert.equal((await e.scripture.readStudyScripture('Juan 3:16')).status,'not_reference');assert.equal(e.calls.length,0)
 const ok=environment();await ok.scripture.readStudyScripture('Juan 3:16');assert.ok(ok.calls.every(q=>['biblical_books','biblical_sources','biblical_verse_texts'].includes(q.table)))
 const sourceQuery=ok.calls.find(q=>q.table==='biblical_sources');assert.ok(sourceQuery.ops.some(x=>x[0]==='eq'&&x[1]==='license_status'&&x[2]==='verified'))
})

function action(e){return cargarModulo('app/actions/estudio-interno.ts',{
'@/lib/supabase/server':{createClient:async()=>e.db},'@/lib/estudios/internal-study':{obtenerEstudioInterno:()=>null},
'@/lib/estudios/biblical-concordance':{...e.concordance,buscarConcordanciasParaReferencia:async()=>({results:[]})},
'@/lib/estudios/biblical-place-search':{buscarLugarBiblico:async()=>null},'@/lib/estudios/biblical-search-assist':{asistirTemaBiblico:async()=>null},
'@/lib/estudios/biblical-text-search':e.textual,
'@/lib/estudios/biblical-context-corpus':e.parser,'@/lib/estudios/study-scripture':e.scripture,
'@/lib/estudios/multilingual-biblical-textual-study':{getVidaBiblicalTextualStudy:async()=>null},
'@/lib/estudios/biblical-chronology-maps':{listarCronologiaBiblicaParaReferencia:async()=>null},'@/app/actions/estudio':{},
})}
async function run(e,query){const f=new FormData();f.set('pasaje',query);return action(e).analizarPasaje({status:'idle'},f)}
test('Pregunta natural sobre odiar alcanza texto y conserva la pregunta original',async()=>{
 const query='¿Qué dice la Biblia sobre odiar a alguien?';const r=await run(environment(),query);assert.equal(r.resultSource,'text');assert.equal(r.query,query);assert.equal(r.results[0].term,'Odio y aborrecimiento')
})
test('La acción no genera un estudio para Juan 3:99 ni confunde una avería con ausencia',async()=>{
 const bad=await run(environment(),'Juan 3:99');assert.equal(bad.status,'error');assert.match(bad.error,/No encontramos Juan 3:99/)
 const offline=await run(environment({failed:'biblical_verse_texts'}),'Juan 3:16');assert.equal(offline.status,'error');assert.match(offline.error,/este momento/);assert.doesNotMatch(offline.error,/No encontramos/)
})
test('El estudio de rango muestra todos los versículos y contextos; no afirma evidencia de un solo versículo',async()=>{
 const r=await run(environment(),'Juan 3-4');assert.equal(r.pasaje,'Juan 3-4');assert.match(r.resultado.comparacion_versiones,/3:36\./);assert.match(r.resultado.comparacion_versiones,/4:54\./);assert.match(r.resultado.explicacion,/Resumen 3/);assert.match(r.resultado.explicacion,/Resumen 4/);assert.equal(r.textualEvidence,undefined)
})

test('Conserva citas del AT y detecta un versículo inexistente con el mismo criterio',async()=>{
 const textRows=Array.from({length:6},(_,i)=>({...verse(23,i+1),book_code:'PSA'}));const e=environment({textRows});
 const valid=await e.scripture.readStudyScripture('Salmo 23:1–6');assert.equal(valid.status,'ready');assert.equal(valid.translation.verses.length,6);assert.equal(valid.reference.book.testament,'old');
 const invalid=await e.scripture.readStudyScripture('Salmos 23:99');assert.equal(invalid.status,'missing');
})
test('La asistencia conserva las correcciones como opciones sin abrir Amor por clamor o por una pregunta compuesta',async()=>{
 const e=environment();const relations=cargarModulo('lib/estudios/biblical-search-relations.ts',{'@/lib/estudios/biblical-search-ranking':ranking});
 const assist=cargarModulo('lib/estudios/biblical-search-assist.ts',{'server-only':{},'@/lib/neon/biblical-client':{createClient:async()=>e.db},'@/lib/ai/vida-ai':{VidaAiError:class extends Error{},vidaAI:async()=>({text:'{"primary":null,"alternatives":[]}'})},'@/lib/estudios/biblical-search-ranking':ranking,'@/lib/estudios/biblical-search-relations':relations,'./biblical-query-intent':intent});
 for(const q of ['clamor','amor y odio','no quiero perdonar','perodnar']){const r=await assist.asistirTemaBiblico(q);assert.notEqual(r?.kind,'resolved',q)}
})
