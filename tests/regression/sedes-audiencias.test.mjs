import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
function load(file){const exp={};new Function('exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exp);return exp}
const {normalizarAudiencia,audienciaDesdeForm,coincideAudiencia,puedeEnviarAudiencia,visibleEnInicio}=load('lib/sedes/audiencias.ts')
const {notificacionSedes}=load('lib/sedes/notificacion.ts')
const {nombreMinisterioConSede}=load('lib/sedes/nombre-ministerio.ts')
const id=n=>`73000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const [SA,CH,MA,MC,USER]=[1,2,3,4,5].map(id)
const audience=changes=>({version:1,sedes:[SA],todos:false,roles:[],ministerios:[MA],personas:[],lideres:false,...changes})
const person=changes=>({id:USER,activo:true,rol:'servidor',general:false,sedesDeclaradas:[SA],visibles:[CH],responsabilidades:[],ministerios:[],...changes})
test('normaliza UUID y deduplica sin transformar destinatarios vacíos en público',()=>{
 const value=normalizarAudiencia(audience({ministerios:[MA,MA],personas:[USER.toUpperCase()]}));assert.deepEqual(value.ministerios,[MA]);assert.deepEqual(value.personas,[USER])
 for(const data of [null,{},audience({version:'1'}),audience({roles:['superadmin']}),audience({sedes:[]}),audience({ministerios:[],personas:[]}),audience({personas:[null]}),audience({personas:Array(501).fill(USER)})])assert.throws(()=>normalizarAudiencia(data))
})
test('FormData malformado no se considera configuración histórica',()=>{
 const form=new FormData();assert.equal(audienciaDesdeForm(form),null);form.set('vida_audiencia','{');assert.throws(()=>audienciaDesdeForm(form));form.set('vida_audiencia',JSON.stringify(audience({})));assert.deepEqual(audienciaDesdeForm(form),audience({}))
})
test('la congregación declarada no concede pertenencia a equipos ni rol pastoral',()=>{
 assert.equal(coincideAudiencia(audience({}),person({})),false)
 assert.equal(coincideAudiencia(audience({ministerios:[],roles:['pastor']}),person({rol:'pastor'})),false)
 assert.equal(coincideAudiencia(audience({ministerios:[],roles:['pastor']}),person({rol:'pastor',responsabilidades:[{sede:CH,rol:'pastor'}]})),false)
 assert.equal(coincideAudiencia(audience({}),person({ministerios:[{id:MA,sede:SA,lider:false}]})),true)
})
test('una responsabilidad antigua deja de autorizar cuando se pierde el rol',()=>{
 const a=audience({ministerios:[],roles:['pastor']});assert.equal(coincideAudiencia(a,person({rol:'servidor',responsabilidades:[{sede:SA,rol:'pastor'}]})),false);assert.equal(coincideAudiencia(a,person({rol:'pastor',responsabilidades:[{sede:SA,rol:'pastor'}]})),true)
})
test('públicos visibles por sede y privados por destinatario son independientes',()=>{
 const p=person({});assert.equal(coincideAudiencia(audience({todos:true}),p),true);assert.equal(visibleEnInicio(audience({todos:true}),p),false);assert.equal(visibleEnInicio(audience({personas:[USER]}),p),true);assert.equal(coincideAudiencia(audience({personas:[USER]}),p),true);assert.equal(coincideAudiencia(audience({todos:true}),person({activo:false})),false)
})
test('líder no publica a roles o personas globales, pastor no cruza su alcance',()=>{
 const scope={global:false,pastoral:false,sedes:[SA],ministerios:[MA],personas:[]};assert.equal(puedeEnviarAudiencia(audience({}),scope),true);assert.equal(puedeEnviarAudiencia(audience({todos:true}),scope),false);assert.equal(puedeEnviarAudiencia(audience({roles:['pastor']}),scope),false);assert.equal(puedeEnviarAudiencia(audience({sedes:[CH]}),{...scope,pastoral:true}),false)
})
test('push privado conserva enlace y deduplicación pero no contenido en pantalla bloqueada',()=>{
 const payload={title:'Tema privado',body:'Detalle privado',url:'/avisos/1',tag:'aviso-1'};const privatePush=notificacionSedes(audience({}),payload);assert.equal(privatePush.url,payload.url);assert.equal(privatePush.tag,payload.tag);assert.equal(JSON.stringify(privatePush).includes('Detalle privado'),false);assert.deepEqual(notificacionSedes(audience({todos:true}),payload),payload)
})
test('dos ministerios con el mismo nombre se distinguen sin alterar su identidad',()=>{
 assert.equal(nombreMinisterioConSede({nombre:'Alabanza',vida_ministerio_sedes:{vida_sedes:{nombre:'VIDA Santa Ana'}}}),'Alabanza · VIDA Santa Ana')
 assert.equal(nombreMinisterioConSede({nombre:'Alabanza',vida_ministerio_sedes:[{vida_sedes:[{nombre:'VIDA Chalchuapa'}]}]}),'Alabanza · VIDA Chalchuapa')
 assert.equal(nombreMinisterioConSede({nombre:'Alabanza'}),'Alabanza')
})
