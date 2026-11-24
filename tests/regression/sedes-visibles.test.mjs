import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync('lib/inicio/sedes-visibles.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
const exports={};new Function('exports',code)(exports)
const {toggleVisibleSede,normalizeVisibleSedes,visibleSedesKey}=exports

test('permite una sede o ambas y nunca deja cero activas',()=>{
 assert.equal(toggleVisibleSede('santa-ana','chalchuapa'),'ambas')
 assert.equal(toggleVisibleSede('ambas','santa-ana'),'chalchuapa')
 assert.equal(toggleVisibleSede('ambas','chalchuapa'),'santa-ana')
 assert.equal(toggleVisibleSede('chalchuapa','chalchuapa'),'chalchuapa')
})
test('preferencia aislada por usuario y valores desconocidos sin asignar pertenencia',()=>{
 assert.notEqual(visibleSedesKey('a'),visibleSedesKey('b'))
 for(const bad of [null,'guatemala','',{},false])assert.equal(normalizeVisibleSedes(bad),'ambas')
 assert.equal(normalizeVisibleSedes('santa-ana'),'santa-ana')
})
test('selector en header sin alterar portal de servicio ni avatar',()=>{
 const source=fs.readFileSync('components/inicio/InicioClient.tsx','utf8')
 const header=source.slice(source.indexOf('<header className="mb-5'),source.indexOf('</header>',source.indexOf('<header className="mb-5')))
 assert.ok(header.indexOf('<SedesVisiblesSelector')<header.indexOf('<UserAvatar'))
 assert.match(header,/userId=\{userId\}/)
 const selector=fs.readFileSync('components/inicio/SedesVisiblesSelector.tsx','utf8')
 assert.match(selector,/filtrado de publicaciones por sede está pendiente/)
 assert.match(selector,/No cambia tu pertenencia/)
 assert.doesNotMatch(selector,/supabase|\.from\(|\.rpc\(/)
})
