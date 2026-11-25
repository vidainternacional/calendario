import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
import ts from 'typescript'
function load(file, imports) {
 const exports={};const code=ts.transpileModule(fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 vm.runInNewContext(code,{exports,require:n=>{if(!(n in imports))throw Error(n);return imports[n]},URL,Uint8Array,Buffer});return exports
}
const helpers=load('lib/admin/recuperar-fotos.ts',{'server-only':{},'node:crypto':crypto})
test('URL conserva encuadre y cambia solo origen/ruta autorizados',()=>{
 const path='00000000-0000-0000-0000-000000000001/source.webp'
 const old='https://atjtjpchslxbseayzflz.supabase.co/storage/v1/object/public/avatars/'+path+'?cx=.5&cz=2'
 assert.equal(helpers.replacePhotoUrl(old,path,'recovered.webp'),'https://lnkrojvyiwnlcoponxud.supabase.co/storage/v1/object/public/avatars/recovered.webp?cx=.5&cz=2')
 assert.equal(helpers.replacePhotoUrl(old.replace('atjtjpchslxbseayzflz','lnkrojvyiwnlcoponxud'),path,'x'),null)
 assert.equal(helpers.replacePhotoUrl(old,path+'other','x'),null)
 assert.equal(helpers.replacePhotoUrl('https://example.com/'+path,path,'x'),null)
})
test('contenido no certificado se conserva sin copiar ni eliminar',async()=>{
 let writes=0
 const store={list:async()=>({data:[{id:'test',name:'source.webp'}]}),download:async()=>({data:new Blob(['no autorizado'])}),upload:()=>{writes++;},remove:()=>{writes++;}}
 const source={storage:{from:()=>({list:async(prefix)=>prefix?store.list():{data:[{id:null,name:'00000000-0000-0000-0000-000000000001'}]},download:store.download})}}
 const target={storage:{from:()=>store},from:()=>({select:()=>({not:()=>({limit:async()=>({data:[]})})})})}
 const result=await helpers.recoverPhotos(source,target)
 assert.equal(result.copied,0);assert.equal(result.removed,0);assert.equal(writes,0)
})
test('fallo de inventario no escribe ni elimina',async()=>{
 const source={storage:{from:()=>({list:async()=>({error:new Error('no autorizado')})})}}
 await assert.rejects(helpers.recoverPhotos(source,{}),/inventariar/)
})
test('sin sesión, pastor e inactivo no obtienen clientes privilegiados',async()=>{
 let privileged=0
 for(const profile of [null,{rol:'pastor',estado_cuenta:'activo'},{rol:'administrador',estado_cuenta:'suspendido'}]){
  const action=load('app/actions/recuperar-fotos.ts',{'@supabase/supabase-js':{createClient:()=>{privileged++}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:profile?{id:'test'}:null}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:profile})})})})})},'@/lib/supabase/service':{createServiceClient:()=>{privileged++}},'@/lib/admin/recuperar-fotos':helpers,'next/cache':{revalidatePath:()=>{}}})
  assert.ok((await action.recuperarFotosAnteriores()).error)
 }
 assert.equal(privileged,0)
})
test('copia verificada antes de retirar original y foto nueva preservada',async()=>{
 const owner='00000000-0000-0000-0000-000000000001';let saved;let removed=false;let reads=0;let profileWrites=0
 const allowed='20b7d44fd4a173588b43580f4d6d8c93208d0d236869a51faac4ca481e8fffe8'
 const h=load('lib/admin/recuperar-fotos.ts',{'server-only':{},'node:crypto':{createHash:()=>({update:bytes=>({digest:()=>Buffer.from(bytes).toString()==='A'?allowed:'different'})})}})
 const source={storage:{from:()=>({list:async(prefix)=>({data:prefix?[{id:'test',name:'source.webp'}]:[{id:null,name:owner}]}),download:async()=>({data:new Blob(['A'],{type:'image/webp'})}),remove:async()=>{assert.ok(reads>=2);removed=true;return{error:null}}})}}
 const target={storage:{from:()=>({upload:async(path,bytes,opts)=>{assert.equal(opts.upsert,false);saved=bytes;return{error:null}},download:async()=>{reads++;return{data:new Blob([saved])}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{avatar_url:'https://lnkrojvyiwnlcoponxud.supabase.co/new-photo'}})}),not:()=>({limit:async()=>({data:[{avatar_url:'https://lnkrojvyiwnlcoponxud.supabase.co/new-photo'}]})})}),update:()=>{profileWrites++;throw Error('No debe editar foto nueva')}})}
 const result=await h.recoverPhotos(source,target)
 assert.equal(result.copied,1);assert.equal(result.removed,1);assert.equal(result.updated,0);assert.equal(removed,true);assert.equal(profileWrites,0)
})
