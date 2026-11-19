import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { setTimeout as esperar } from 'node:timers/promises'
import { cargarModulo } from './seguridad-real-loader.mjs'
const {destinoSolidario,pendienteSolidario}=cargarModulo('lib/notificaciones/solidaridad-atencion.ts')
test('separa pendientes de atención de lectura y dirige a pestaña/caso exactos',()=>{
 assert.equal(pendienteSolidario('solicitud','enviada'),true);assert.equal(pendienteSolidario('aporte','ofrecido'),true)
 for(const estado of ['cancelada','rechazada','revisando','entregada','completado','contactando']){assert.equal(pendienteSolidario('solicitud',estado),false);assert.equal(pendienteSolidario('aporte',estado),false)}
 const u=new URL(destinoSolidario('aporte','semilla'), 'https://vida.test');assert.equal(u.searchParams.get('vista'),'siembras');assert.equal(u.searchParams.get('contexto'),'aporte');assert.equal(u.searchParams.get('item'),'semilla');assert.equal(u.hash,'#caso-semilla')
 assert.equal(new URL(destinoSolidario('aporte',undefined,true),'https://vida.test').searchParams.get('pendientes'),'1')
})
function lectura({fallo=false,excepcion=false}={}) {
 const listeners=new Map();let estado=new Set(),resolver,eventos=0,auth
 const client={rpc:async(nombre)=>{if(nombre==='get_unread_publication_ids')return new Promise(r=>{resolver=r});if(excepcion)throw Error('offline');return fallo?{error:{message:'fallo'}}:{error:null}},auth:{onAuthStateChange(fn){auth=fn;return{data:{subscription:{unsubscribe(){}}}}}}}
 const deps={'react':{useState:inicial=>[inicial,n=>{estado=typeof n==='function'?n(estado):n}],useEffect:fn=>fn()},'@/lib/supabase/client':{createClient:()=>client}}
 const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/avisos/usePublicationReads.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>deps[n],console:{error(){}},Date,Set,Map,Promise,Event,CustomEvent:class extends Event{constructor(n,opts){super(n);this.detail=opts.detail}},window:{dispatchEvent(e){eventos++;listeners.get(e.type)?.(e)},addEventListener(n,fn){listeners.set(n,fn)},removeEventListener(){}}})
 return {api:module.exports,resultado:()=>estado,eventos:()=>eventos,resolver:data=>resolver({data}),cambiar:()=>auth('SIGNED_IN',{})}
}
test('la respuesta antigua de no leídos no restaura un aviso que se acaba de abrir',async()=>{
 const p=lectura();p.api.useUnreadPublicationIds(['aviso']);assert.equal((await p.api.markPublicationRead('aviso')).success,true);p.resolver([{publicacion_id:'aviso'}]);await esperar(10);assert.equal(p.resultado().has('aviso'),false);assert.equal(p.eventos(),1)
})
test('error o desconexión al guardar lectura no emite evento de leído ni finge éxito',async()=>{
 for(const config of [{fallo:true},{excepcion:true}]){const p=lectura(config);const r=await p.api.markPublicationRead('aviso');assert.equal(r.success,false);assert.match(r.error,/conexión/);assert.equal(p.eventos(),0)}
})
