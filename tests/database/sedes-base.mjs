import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const A='71000000-0000-4000-8000-000000000001', B='71000000-0000-4000-8000-000000000002', ADMIN='71000000-0000-4000-8000-000000000003', INACTIVE='71000000-0000-4000-8000-000000000004', PASTOR='71000000-0000-4000-8000-000000000005'
const SA='61000000-0000-4000-8000-000000000001', CH='61000000-0000-4000-8000-000000000002'
async function asUser(id, sql) {
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`)
  try { return await db.query(sql) } finally { await db.exec('reset role') }
}
await test('Base de sedes: SQL real y fronteras RLS con identidades ficticias', async t => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema public,auth to authenticated,anon,service_role; grant execute on function auth.uid() to authenticated,anon,service_role;
  create table public.profiles(id uuid primary key,activo boolean,estado_cuenta text,rol text,es_pastor_general boolean default false);
  create table public.ministerios(id uuid primary key);
  grant select on public.profiles,public.ministerios to authenticated;
  insert into public.profiles(id,activo,estado_cuenta,rol) values
  ('${A}',true,'activo','servidor'),('${B}',true,'activo','servidor'),('${ADMIN}',true,'activo','administrador'),('${INACTIVE}',false,'activo','administrador'),('${PASTOR}',true,'activo','pastor');`)
  const before=(await db.query('select * from profiles order by id')).rows
  await db.exec(await readFile(new URL('../../docs/sql/sedes-base.sql',import.meta.url),'utf8'))
  await t.test('crea dos sedes, ninguna persona asignada', async()=> {
    assert.equal((await db.query('select count(*)::int n from vida_sedes')).rows[0].n,2)
    assert.equal((await db.query('select count(*)::int n from vida_sede_preferencias')).rows[0].n,0)
    assert.equal((await db.query('select count(*)::int n from vida_sede_responsables')).rows[0].n,0)
  })
  await t.test('guardar congregación y vistas son operaciones independientes',async()=>{
    await asUser(A,`select vida_guardar_mis_sedes(array['${SA}'::uuid],null)`)
    await asUser(A,`select vida_guardar_mis_sedes(null,array['${CH}'::uuid])`)
    const rows=(await asUser(A,'select sede_id,pertenece,visible from vida_sede_selecciones order by sede_id')).rows
    assert.deepEqual(rows,[{sede_id:SA,pertenece:true,visible:false},{sede_id:CH,pertenece:false,visible:true}])
  })
  await t.test('otras cuentas no leen ni cambian preferencias ajenas',async()=>{
    assert.equal((await asUser(B,'select * from vida_sede_selecciones')).rows.length,0)
    assert.equal((await asUser(B,`update vida_sede_selecciones set pertenece=true where profile_id='${A}' returning *`)).rows.length,0)
    await assert.rejects(asUser(B,`insert into vida_sede_preferencias(profile_id) values('${ADMIN}')`))
    await assert.rejects(asUser(A,`update vida_sede_preferencias set profile_id='${ADMIN}' where profile_id='${A}'`))
  })
  await t.test('permite ambas y ninguna congregación sin cambiar vistas',async()=>{
    await asUser(A,`select vida_guardar_mis_sedes(array['${SA}'::uuid,'${CH}'::uuid],null)`)
    assert.equal((await asUser(A,'select * from vida_sede_selecciones where pertenece')).rows.length,2)
    await asUser(A,`select vida_guardar_mis_sedes('{}'::uuid[],null)`)
    assert.equal((await asUser(A,'select * from vida_sede_selecciones where pertenece')).rows.length,0)
    assert.equal((await asUser(A,'select * from vida_sede_selecciones where visible')).rows.length,1)
    assert.equal((await asUser(A,'select congregacion_definida from vida_sede_preferencias')).rows[0].congregacion_definida,true)
  })
  await t.test('rechaza vacío visible, sedes inexistentes y nulls sin cambiar datos',async()=>{
    const before=(await asUser(A,'select * from vida_sede_selecciones order by sede_id')).rows
    await assert.rejects(asUser(A,`select vida_guardar_mis_sedes(null,'{}'::uuid[])`))
    await assert.rejects(asUser(A,`select vida_guardar_mis_sedes(array['${SA}'::uuid],array['${A}'::uuid])`))
    await assert.rejects(asUser(A,`select vida_guardar_mis_sedes(array[null::uuid],null)`))
    assert.deepEqual((await asUser(A,'select * from vida_sede_selecciones order by sede_id')).rows,before)
  })
  await t.test('cuenta inactiva no ve catálogo ni guarda',async()=>{
    assert.equal((await asUser(INACTIVE,'select * from vida_sedes')).rows.length,0)
    await assert.rejects(asUser(INACTIVE,`select vida_guardar_mis_sedes(array['${SA}'::uuid],null)`))
  })
  await t.test('elegir pertenencia no concede gestión de sedes o ministerios',async()=>{
    await assert.rejects(asUser(A,`insert into vida_sede_responsables values('${A}','${CH}','administrador')`))
    await assert.rejects(asUser(PASTOR,`insert into vida_sedes(slug,nombre,pais,zona_horaria) values('prueba','Sede prueba','SV','America/El_Salvador')`))
    assert.deepEqual((await db.query('select * from profiles order by id')).rows,before)
  })
  await t.test('administrador crea sede y asociación de responsabilidad explícita',async()=>{
    await asUser(ADMIN,`insert into vida_sedes(slug,nombre,pais,zona_horaria) values('guatemala','VIDA Guatemala','GT','America/Guatemala')`)
    await asUser(ADMIN,`insert into vida_sede_responsables values('${PASTOR}','${CH}','pastor')`)
    assert.equal((await asUser(PASTOR,'select * from vida_sede_responsables')).rows.length,1)
    assert.equal((await asUser(A,'select * from vida_sede_responsables')).rows.length,0)
  })
  await t.test('anon no puede leer ni invocar guardado',async()=>{
    await db.exec('set role anon')
    try {
      await assert.rejects(db.query('select * from vida_sedes'))
      await assert.rejects(db.query(`select vida_guardar_mis_sedes('{}'::uuid[],null)`))
    } finally { await db.exec('reset role') }
  })
  await t.test('reversión deshabilita escrituras sin borrar filas ni perfiles',async()=>{
    const counts=(await db.query('select count(*)::int n from vida_sede_selecciones')).rows
    await db.exec(await readFile(new URL('../../docs/sql/sedes-base-reversion.sql',import.meta.url),'utf8'))
    await assert.rejects(asUser(A,`select vida_guardar_mis_sedes(array['${SA}'::uuid],null)`))
    await assert.rejects(asUser(ADMIN,`update vida_sedes set activa=false where id='${CH}'`))
    assert.deepEqual((await db.query('select count(*)::int n from vida_sede_selecciones')).rows,counts)
    assert.deepEqual((await db.query('select * from profiles order by id')).rows,before)
  })
  await db.close()
})
