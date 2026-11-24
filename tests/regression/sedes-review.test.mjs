import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source=ts.transpileModule(fs.readFileSync('lib/admin/sedes-review.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
const exports={};new Function('exports',source)(exports)
const {reviewRecipients,REVIEW_PEOPLE}=exports
const all={sedes:[],roles:[],people:[],ministry:'',all:true}
test('selección por sede y rol no incluye pastores de otra sede',()=>{
 assert.deepEqual(reviewRecipients({...all,all:false,sedes:['chalchuapa'],roles:['pastor']}).map(p=>p.id),['ch-pastor'])
 assert.equal(reviewRecipients({...all,all:false}).length,0)
})
test('uniones deduplicadas conservan selección individual explícita',()=>{
 const rows=reviewRecipients({...all,all:false,roles:['pastor'],people:['sa-pastor','sa-pastor'],ministry:'alabanza'})
 assert.equal(rows.length,4);assert.equal(new Set(rows.map(p=>p.id)).size,4)
})
test('alcance autorizado limita incluso personas explícitas de un grupo',()=>{
 const allowed=REVIEW_PEOPLE.filter(p=>p.sede==='santa-ana').map(p=>p.id)
 const rows=reviewRecipients({...all,people:['ch-pastor','ch-musico']},REVIEW_PEOPLE,allowed)
 assert.equal(rows.length,3);assert.ok(rows.every(p=>p.sede==='santa-ana'))
})
test('rutas de revisión tienen retorno fijo y recuperación accesible sin Analytics',()=>{
 const photos=fs.readFileSync('app/(app)/admin/fotos/page.tsx','utf8')
 assert.match(photos,/href="\/admin"/);assert.match(photos,/<RecuperarFotosButton/)
 const analytics=fs.readFileSync('app/(app)/admin/analisis/page.tsx','utf8')
 assert.match(analytics,/href="\/admin\/fotos"/);assert.doesNotMatch(analytics,/<BackButton/)
 const ui=fs.readFileSync('components/admin/SedesReviewWorkspace.tsx','utf8')
 assert.match(ui,/No envía mensajes/);assert.doesNotMatch(ui,/<details[^>]+\bopen[ =>]/)
})
