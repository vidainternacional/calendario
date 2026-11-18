import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
function entorno(bloqueado=false) {
 const datos=new Map(),eventos=new Map();let getSnapshot,getServerSnapshot
 const window={addEventListener:(k,fn)=>{if(!eventos.has(k))eventos.set(k,new Set());eventos.get(k).add(fn)},removeEventListener:(k,fn)=>eventos.get(k)?.delete(fn),dispatchEvent:e=>eventos.get(e.type)?.forEach(fn=>fn())}
 const module={exports:{}}
 const code=ts.transpileModule(fs.readFileSync('lib/ministerios/ministerio-reciente.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 vm.runInNewContext(code,{module,exports:module.exports,window,Event,Map,localStorage:{getItem(k){if(bloqueado)throw Error();return datos.get(k)||null},setItem(k,v){if(bloqueado)throw Error();datos.set(k,v)}},require:()=>({useSyncExternalStore:(subscribe,get,server)=>{getSnapshot=get;getServerSnapshot=server;return {subscribe}}})})
 return {api:module.exports,datos,window,snapshot:()=>getSnapshot(),server:()=>getServerSnapshot()}
}
const miembros=[{ministerio_id:'live'},{ministerio_id:'alabanza'},{ministerio_id:'danza'}]
test('regresar a Inicio encabeza el último abierto sin mutar ni perder otras membresías',()=>{
 const {api}=entorno();api.registrarMinisterioReciente('a','alabanza')
 const orden=api.ordenarMinisteriosRecientes(miembros,api.leerMinisterioReciente('a'))
 assert.deepEqual([...orden].map(m=>m.ministerio_id),['alabanza','live','danza']);assert.equal(miembros[0].ministerio_id,'live')
 api.registrarMinisterioReciente('a','danza');assert.equal(api.ordenarMinisteriosRecientes(miembros,api.leerMinisterioReciente('a'))[0].ministerio_id,'danza')
})
test('no incorpora ministerios ajenos o membresías retiradas; lista vacía segura',()=>{
 const {api}=entorno();assert.equal(api.ordenarMinisteriosRecientes(miembros,'otro'),miembros);assert.equal(api.ordenarMinisteriosRecientes([], 'live').length,0)
})
test('preferencia queda separada por usuario; SSR no expone el dato del navegador',()=>{
 const e=entorno();e.api.registrarMinisterioReciente('a','alabanza');e.api.registrarMinisterioReciente('b','live')
 e.api.useMinisterioReciente('a');assert.equal(e.snapshot(),'alabanza');assert.equal(e.server(),null)
 e.api.useMinisterioReciente('b');assert.equal(e.snapshot(),'live')
})
test('Inicio reacciona en la misma pestaña y al restaurar historial; desmontar retira listeners',()=>{
 const e=entorno();let cambios=0;const {subscribe}=e.api.useMinisterioReciente('a');const fin=subscribe(()=>cambios++)
 e.api.registrarMinisterioReciente('a','alabanza');assert.equal(e.snapshot(),'alabanza');assert.equal(cambios,1)
 e.window.dispatchEvent(new Event('pageshow'));assert.equal(cambios,2);fin();e.window.dispatchEvent(new Event('pageshow'));assert.equal(cambios,2)
})
test('almacenamiento bloqueado conserva la preferencia durante la visita sin romper navegación',()=>{
 const {api}=entorno(true);api.registrarMinisterioReciente('a','alabanza');assert.equal(api.leerMinisterioReciente('a'),'alabanza');assert.equal(api.leerMinisterioReciente('b'),null)
})
