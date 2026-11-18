import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const { distanciaTonos, transportarCifrado } = cargarModulo('lib/musica/transponer.ts')
test('el cifrado parte de la biblioteca y sigue el tono de servicio sin acumular transportes', () => {
 const base='Intro: D - A/C# - Bm7 - G'
 assert.equal(transportarCifrado(base,distanciaTonos('D','E')),'Intro: E - B/D# - C#m7 - A')
 assert.equal(transportarCifrado(base,distanciaTonos('D','D')),base)
 assert.equal(distanciaTonos('Bb','A#'),0)
})
function preparar(lider=true) {
 const writes=[]
 const admin={from(tabla){const q={order(){return this},limit(){return this},select(){return this},eq(){return this},update(datos){writes.push({tabla,datos});return this},maybeSingle(){return this},then(ok,bad){return Promise.resolve({error:null,data:tabla==='calendars'?[{id:'calendario'}]:tabla==='profiles'?{activo:true,estado_cuenta:'activo',rol:'servidor'}:tabla==='ministerio_miembros'?{es_lider:lider}:tabla==='ministerio_responsabilidad_asignaciones'?[]:tabla==='eventos'?{id:'evento',ministerio_id:'ministerio'}:{id:'fila',cancion_id:'cancion'}}).then(ok,bad)}};return q}}
 const api=cargarModulo('app/actions/programacion-alabanza.ts',{'next/cache':{revalidatePath(){}},'@/lib/supabase/server':{createAdminClient:()=>admin,createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'lider'}}})}})}})
 const data=new FormData();for(const [key,value] of Object.entries({repertorio_id:'fila',titulo:'Canción propia',tonalidad:'E',notas:'Entrada original',solo_servicio:'true',youtube_url:'https://example.com/video'}))data.set(key,value)
 return {api,writes,data}
}
test('guardar tono del servicio conserva indicación y no escribe en biblioteca',async()=>{
 const p=preparar();await p.api.actualizarCancionAlabanza('ministerio','evento',p.data)
 assert.equal(p.writes.length,1);assert.equal(p.writes[0].tabla,'evento_repertorio');assert.equal(p.writes[0].datos.tonalidad,'E');assert.equal(p.writes[0].datos.notas,'Entrada original')
})
test('el modo solo servicio no concede permisos a un músico',async()=>{
 const p=preparar(false);await assert.rejects(p.api.actualizarCancionAlabanza('ministerio','evento',p.data),/permiso/);assert.equal(p.writes.length,0)
})
