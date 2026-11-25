import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync('lib/sedes/modelo.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const exports={};new Function('exports',code)(exports)
const { validarSeleccionSedes, esGestorGlobalSedes }=exports
const id='61000000-0000-4000-8000-000000000001'
test('elección admite ninguna congregación pero exige una sede visible',()=>{
 assert.deepEqual(validarSeleccionSedes([],true),[])
 assert.throws(()=>validarSeleccionSedes([],false))
 assert.deepEqual(validarSeleccionSedes([id,id],false),[id])
 for(const value of [null,{},'ambas',[null],['santa-ana'],Array(101).fill(id)]) assert.throws(()=>validarSeleccionSedes(value,true))
})
test('pertenencia o rol pastoral local no conceden gestión global',()=>{
 assert.equal(esGestorGlobalSedes({activo:true,estado_cuenta:'activo',rol:'pastor'}),false)
 assert.equal(esGestorGlobalSedes({activo:false,estado_cuenta:'activo',rol:'administrador'}),false)
 assert.equal(esGestorGlobalSedes({activo:true,estado_cuenta:'pendiente',rol:'administrador'}),false)
 assert.equal(esGestorGlobalSedes({activo:true,estado_cuenta:'activo',rol:'administrador'}),true)
 assert.equal(esGestorGlobalSedes({activo:true,estado_cuenta:'activo',rol:'pastor',es_pastor_general:true}),true)
})
