import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync('lib/sedes/store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const exports={};new Function('exports',code)(exports)
const {crearSedesStore}=exports
const data=(ids=['sa'])=>({sedes:[{id:'sa'},{id:'ch'}],seleccion:{definida:true,congregacion:ids,visibles:['sa','ch']}})
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)}}
test('error conserva selección confirmada y nunca simula guardado local',async()=>{
 const calls=[]
 const store=crearSedesStore('dueño',{load:async owner=>{calls.push(owner);return data()},save:async(tipo,ids,owner)=>{calls.push(owner);return {error:'Sin conexión'}}})
 await store.refresh();assert.deepEqual(store.getSnapshot().seleccion.congregacion,['sa'])
 assert.deepEqual(await store.guardar('congregacion',['ch']),{error:'Sin conexión'})
 assert.deepEqual(store.getSnapshot().seleccion.congregacion,['sa']);assert.deepEqual(calls,['dueño','dueño'])
})
test('lectura antigua no pisa elección nueva y las dos superficies comparten estado',async()=>{
 let load=async()=>data(),saves=0
 const store=crearSedesStore('a',{load:()=>load(),save:async()=>{saves++;return {success:true}}})
 let updates=0;const unsubscribe=store.subscribe(()=>updates++)
 await store.refresh()
 const slow=deferred();load=()=>slow.promise;const refresh=store.refresh()
 await store.guardar('congregacion',['ch'])
 slow.resolve(data(['sa']));await refresh
 assert.deepEqual(store.getSnapshot().seleccion.congregacion,['ch']);assert.equal(saves,1);assert.ok(updates>=3)
 unsubscribe()
})
test('aislamiento entre cuentas, sin sobrescribir vistas al guardar congregación',async()=>{
 const a=crearSedesStore('a',{load:async()=>data(),save:async()=>({success:true})})
 const b=crearSedesStore('b',{load:async()=>data(['ch']),save:async()=>({success:true})})
 await Promise.all([a.refresh(),b.refresh()]);await a.guardar('congregacion',[])
 assert.deepEqual(a.getSnapshot().seleccion.congregacion,[]);assert.deepEqual(a.getSnapshot().seleccion.visibles,['sa','ch'])
 assert.deepEqual(b.getSnapshot().seleccion.congregacion,['ch'])
})
test('doble toque no produce guardados simultáneos; sin carga no permite guardar',async()=>{
 const wait=deferred();let saves=0
 const store=crearSedesStore('a',{load:async()=>data(),save:()=>{saves++;return wait.promise}})
 assert.ok((await store.guardar('visibles',['ch'])).error)
 await store.refresh();const first=store.guardar('visibles',['ch'])
 assert.ok((await store.guardar('visibles',['sa'])).error);assert.equal(saves,1)
 wait.resolve({success:true});await first;assert.deepEqual(store.getSnapshot().seleccion.visibles,['ch'])
})
test('guardado y lectura del servidor comprueban el dueño esperado de la pantalla',()=>{
 const source=fs.readFileSync('app/actions/sedes.ts','utf8')
 assert.equal((source.match(/user.id !== ownerId/g)||[]).length,3)
 assert.doesNotMatch(fs.readFileSync('lib/sedes/useMisSedes.ts','utf8'),/localStorage|sessionStorage/)
})
