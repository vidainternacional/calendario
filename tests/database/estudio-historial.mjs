import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const{PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite')
const db=new PGlite()
const A='71000000-0000-4000-8000-000000000001',B='71000000-0000-4000-8000-000000000002',INACTIVE='71000000-0000-4000-8000-000000000003',ADMIN='71000000-0000-4000-8000-000000000004'
const KEY='a'.repeat(64),DATA=JSON.stringify({status:'success',kind:'concordance',query:'Pregunta fixture',results:[{term:'fixture'}]})
async function asUser(id,sql){await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);try{return await db.query(sql)}finally{await db.exec('reset role')}}
await test('Historial privado: políticas SQL reales con identidades ficticias',async t=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function public.cuenta_activa() returns boolean language sql stable as $$select auth.uid() <> '${INACTIVE}'::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid(),public.cuenta_activa() to authenticated;insert into auth.users values('${A}'),('${B}'),('${INACTIVE}'),('${ADMIN}');`)
 await db.exec(await readFile(new URL('../../docs/sql/estudio-historial-privado.sql',import.meta.url),'utf8'))
 await t.test('crea solo tabla y políticas nuevas, sin filas personales',async()=>assert.equal((await db.query('select count(*)::int n from estudio_historial_privado')).rows[0].n,0))
 const insert=(owner,key=KEY)=>`insert into estudio_historial_privado(profile_id,consulta,consulta_key,version,tipo,resultado)values('${owner}','Pregunta fixture','${key}','v1','concordance','${DATA}'::jsonb)`
 await t.test('usuario activo guarda y lee su respuesta',async()=>{await asUser(A,insert(A));assert.equal((await asUser(A,'select consulta from estudio_historial_privado')).rows.length,1)})
 await t.test('otra cuenta no ve, edita ni elimina las respuestas ajenas',async()=>{assert.equal((await asUser(B,'select * from estudio_historial_privado')).rows.length,0);assert.equal((await asUser(B,"update estudio_historial_privado set consulta='no' returning id")).rows.length,0);assert.equal((await asUser(B,'delete from estudio_historial_privado returning id')).rows.length,0)})
 await t.test('administración de aplicación tampoco recibe acceso al historial de otra cuenta',async()=>assert.equal((await asUser(ADMIN,'select * from estudio_historial_privado')).rows.length,0))
 await t.test('no permite guardar para otra persona ni cambiar el dueño de una fila propia',async()=>{await assert.rejects(asUser(B,insert(A,'b'.repeat(64))));await assert.rejects(asUser(A,`update estudio_historial_privado set profile_id='${B}'`))})
 await t.test('cuenta inactiva no guarda ni lee aunque sea propietaria',async()=>{await assert.rejects(asUser(INACTIVE,insert(INACTIVE)));assert.equal((await asUser(INACTIVE,'select * from estudio_historial_privado')).rows.length,0)})
 await t.test('anon no obtiene acceso a la tabla',async()=>{await db.exec('set role anon');try{await assert.rejects(db.query('select * from estudio_historial_privado'))}finally{await db.exec('reset role')}})
 await t.test('la misma consulta solo ocupa una fila por usuario y versión',async()=>{await assert.rejects(asUser(A,insert(A)));await asUser(B,insert(B));assert.equal((await db.query('select count(*)::int n from estudio_historial_privado')).rows[0].n,2)})
 await t.test('rechaza snapshots demasiado grandes sin aceptar datos truncados',async()=>{
  await assert.rejects(asUser(A,`insert into estudio_historial_privado(profile_id,consulta,consulta_key,version,tipo,resultado)values('${A}','Grande','${'c'.repeat(64)}','v1','study',jsonb_build_object('text',repeat('x',524289)))`))
 })
 await t.test('el dueño elimina solo su respuesta y las otras permanecen',async()=>{await asUser(A,'delete from estudio_historial_privado');assert.equal((await asUser(A,'select * from estudio_historial_privado')).rows.length,0);assert.equal((await asUser(B,'select * from estudio_historial_privado')).rows.length,1)})
 await t.test('la reversión deshabilita acceso sin borrar los datos',async()=>{await db.exec(await readFile(new URL('../../docs/sql/estudio-historial-reversion.sql',import.meta.url),'utf8'));await assert.rejects(asUser(B,'select * from estudio_historial_privado'));assert.equal((await db.query('select count(*)::int n from estudio_historial_privado')).rows[0].n,1)})
})
await db.close()
