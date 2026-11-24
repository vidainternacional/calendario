import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite')
const db=new PGlite()
const uuid=n=>`72000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const [ADMIN,PA,PC,LA,MC,MA,EX,OFF]=[1,2,3,4,5,6,7,8].map(uuid)
const SA='61000000-0000-4000-8000-000000000001',CH='61000000-0000-4000-8000-000000000002'
const [MISA,MICH,LIVE,EVSA,EVCH,CASA,CACH,SONG,CAPSA,CAPCH]=[11,12,13,21,22,31,32,41,51,52].map(uuid)
const a=(sedes=[SA],other={})=>({version:1,sedes,todos:true,roles:[],ministerios:[],personas:[],lideres:false,...other})
async function asUser(id,sql,params=[]){await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}'`);try{return await db.query(sql,params)}finally{await db.exec('reset role')}}
async function fn(id,name,args=[]){return asUser(id,`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)}
const scalar=r=>r.rows[0]?.result
async function bootstrap(){
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('role',coalesce(nullif(current_setting('request.jwt.claim.role',true),''),case when nullif(current_setting('request.jwt.claim.sub',true),'') is not null then 'authenticated' else '' end))$$;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create table profiles(id uuid primary key,nombre_completo text default 'Persona ficticia',rol text,activo boolean default true,estado_cuenta text default 'activo',es_pastor_general boolean default false,avatar_url text);
 create table ministerios(id uuid primary key default gen_random_uuid(),nombre text,descripcion text,activo boolean default true,ministerio_padre_id uuid,emoji text,color_primario text,color_secundario text,orden int default 0);
 create table ministerio_miembros(id uuid primary key default gen_random_uuid(),ministerio_id uuid,profile_id uuid,es_lider boolean default false);
 create table calendars(id uuid primary key default gen_random_uuid(),nombre text,color text,ministerio_id uuid,owner_id uuid,es_publico boolean default false);
 create table calendar_subscriptions(calendar_id uuid,user_id uuid,visible boolean default true);
 create table calendar_reminders(id uuid,title text,remind_at timestamptz,calendar_id uuid);
 create table eventos(id uuid primary key,ministerio_id uuid,calendar_id uuid,titulo text,fecha_inicio timestamptz,fecha_fin timestamptz,ubicacion text);
 create table evento_calendarios(evento_id uuid,calendar_id uuid);
 create table evento_asignaciones(id uuid primary key default gen_random_uuid(),evento_id uuid,ministerio_id uuid,profile_id uuid,capacidad_id uuid,asignado_por uuid,estado text default 'asignado',unique(evento_id,ministerio_id,profile_id,capacidad_id));
 create table ministerio_capacidades(id uuid primary key,ministerio_id uuid,nombre text,activo boolean default true);
 create table ministerio_canciones(id uuid primary key,ministerio_id uuid,artista text,tonalidad_base text,acordes text,letra text,notas_permanentes text);
 create table evento_repertorio(id uuid primary key default gen_random_uuid(),evento_id uuid,ministerio_id uuid,cancion_id uuid,titulo text,tonalidad text,notas text,orden int);
 create table evento_repertorio_compartidos(evento_id uuid,ministerio_origen_id uuid,ministerio_destino_id uuid);
 create table app_settings(clave text primary key,valor jsonb);create table evento_asistencia_config(evento_id uuid primary key,activo boolean default true,latitud double precision,longitud double precision,radio_metros integer,minutos_antes integer,minutos_despues integer,configurado_por uuid,updated_at timestamptz default now(),ubicacion_tipo text);create table evento_asistencias(evento_id uuid,profile_id uuid,estado text,confirmado_en timestamptz,metodo text,primary key(evento_id,profile_id));create table evento_paletas(evento_id uuid,ministerio_id uuid);
 create table publicaciones(id uuid primary key default gen_random_uuid(),autor_id uuid,ministerio_id uuid,estado text default 'aprobado',titulo text,cuerpo text,tipo text default 'aviso');
 create table publicacion_lecturas(publicacion_id uuid,profile_id uuid,primary key(publicacion_id,profile_id));
 create table vida_devocionales(id uuid primary key default gen_random_uuid(),autor_id uuid,titulo text,publicado boolean default false,audiencia_iglesia boolean default true,roles_destino text[] default '{}',ministerios_destino uuid[] default '{}',lideres_ministerio boolean default false);
 create table pastoral_paquetes(id uuid primary key default gen_random_uuid(),profile_id uuid,titulo text,descripcion_publica text,instrucciones text,notas_privadas text,audiencia text default 'iglesia',publicado boolean default false,published_at timestamptz,updated_at timestamptz default now(),public_slug uuid,bosquejo_id uuid,coleccion_id uuid,recurso_ids uuid[] default '{}',destacado boolean default false,presentacion_diapositivas jsonb);
 create table pastoral_bosquejos(id uuid,profile_id uuid,titulo text,tema text,pasaje_base text,proposito text,introduccion text,puntos jsonb,conclusion text);
 create table pastoral_colecciones(id uuid,profile_id uuid,nombre text,descripcion text);
 create table pastoral_versiculos(id uuid,profile_id uuid,coleccion_id uuid,referencia text,texto text,traduccion text,created_at timestamptz,libro_nombre text,capitulo int,verso int);
 create table notificaciones_preferencias(id uuid default gen_random_uuid(),profile_id uuid,ministerio_id uuid,activo boolean default true);
 grant select,insert,update on all tables in schema public to authenticated;
 alter table publicaciones enable row level security;create policy antigua_pub_lectura on publicaciones for select to authenticated using(true);create policy antigua_pub_insert on publicaciones for insert to authenticated with check(true);create policy antigua_pub_update on publicaciones for update to authenticated using(true) with check(true);
 alter table vida_devocionales enable row level security;create policy antigua_video_lectura on vida_devocionales for select to authenticated using(autor_id=auth.uid() or publicado);create policy antigua_video_insert on vida_devocionales for insert to authenticated with check(autor_id=auth.uid());
 alter table pastoral_paquetes enable row level security;create policy antigua_paquete_lectura on pastoral_paquetes for select to authenticated using(profile_id=auth.uid());create policy antigua_paquete_insert on pastoral_paquetes for insert to authenticated with check(profile_id=auth.uid());
 alter table eventos enable row level security;create policy antigua_evento_lectura on eventos for select to authenticated using(true);
 `)
 for(const table of ['evento_asignaciones','evento_asistencia_config','evento_asistencias','evento_calendarios','evento_paletas','evento_repertorio','evento_repertorio_compartidos'])await db.exec(`alter table ${table} enable row level security;create policy antigua_hijo_lectura on ${table} for select to authenticated using(true)`)
 for(const [id,rol]of [[ADMIN,'administrador'],[PA,'pastor'],[PC,'pastor'],[LA,'lider'],[MC,'servidor'],[MA,'servidor'],[EX,'servidor'],[OFF,'administrador']])await db.query('insert into profiles(id,rol,activo) values($1,$2,$3)',[id,rol,id!==OFF])
 await db.exec(`insert into ministerios(id,nombre) values('${MISA}','Alabanza'),('${MICH}','Alabanza'),('${LIVE}','LiveStream');
 insert into ministerio_miembros(ministerio_id,profile_id,es_lider) values('${MISA}','${LA}',true),('${MISA}','${MA}',false),('${MICH}','${MC}',false);
 insert into calendars(id,nombre,ministerio_id) values('${CASA}','Servicio Santa Ana','${MISA}'),('${CACH}','Servicio Chalchuapa','${MICH}');
 insert into eventos(id,ministerio_id,calendar_id,titulo,fecha_inicio,fecha_fin) values('${EVSA}','${MISA}','${CASA}','Servicio SA',now()+interval '1 day',now()+interval '1 day 2 hours'),('${EVCH}','${MICH}','${CACH}','Servicio CH',now()+interval '2 days',now()+interval '2 days 2 hours');
 insert into evento_calendarios values('${EVSA}','${CASA}'),('${EVCH}','${CACH}');
 insert into ministerio_capacidades values('${CAPSA}','${MISA}','Bajo',true),('${CAPCH}','${MICH}','Bajo',true);
 insert into ministerio_canciones values('${SONG}','${MISA}','Autor ficticio','C','C F G','Letra ficticia','Indicaciones editoriales');
 insert into evento_repertorio(evento_id,ministerio_id,cancion_id,titulo,tonalidad,notas,orden) values('${EVSA}','${MISA}','${SONG}','Canción ficticia','D','Indicaciones del servicio',0);
 insert into publicaciones(autor_id,ministerio_id,titulo,cuerpo) values('${PA}',null,'Aviso histórico general','Contenido editorial'),('${PA}','${MISA}','Aviso histórico de equipo','Contenido de equipo');`)
 await db.exec(await readFile(new URL('../../docs/sql/sedes-base.sql',import.meta.url),'utf8'))
 await db.exec(await readFile(new URL('../../docs/sql/sedes-funciones-previas.sql',import.meta.url),'utf8'))
 const core=await readFile(new URL('../../docs/sql/sedes-integracion.sql',import.meta.url),'utf8'),ops=await readFile(new URL('../../docs/sql/sedes-operaciones.sql',import.meta.url),'utf8')
  await db.exec(`create function public.puede_gestionar_asistencia() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and activo and estado_cuenta='activo' and rol in ('administrador','pastor','lider'))$$;
 create function public.es_admin_o_pastor() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and rol in ('administrador','pastor'))$$;
 create function public.lidera(mid uuid) returns boolean language sql stable security definer as $$select exists(select 1 from public.ministerio_miembros mm join public.profiles p on p.id=mm.profile_id where mm.ministerio_id=mid and mm.profile_id=auth.uid() and mm.es_lider and p.activo and p.estado_cuenta='activo')$$;`)
 await db.exec(await readFile(new URL('../../docs/sql/sedes-asistencia-previa.sql',import.meta.url),'utf8'))
 const gps=await readFile(new URL('../../docs/sql/sedes-asistencia.sql',import.meta.url),'utf8'),funcs=await readFile(new URL('../../docs/sql/sedes-asistencia-funciones.sql',import.meta.url),'utf8')
 const completo=await readFile(new URL('../../docs/sql/sedes-integracion-completa.sql',import.meta.url),'utf8')
 assert.equal(completo,core.replace(/commit;\s*$/i,()=>[ops,gps,funcs].join('\n')+"\nnotify pgrst, 'reload schema';\ncommit;\n"))
 await db.exec(completo)
}
await test('Integración multisede: PostgreSQL, RLS, RPC y reversión con datos ficticios',async t=>{
 try {
 await bootstrap()
 await t.test('compila el paquete completo sin tocar cuentas ni asignar sedes',async()=>{assert.equal((await db.query('select count(*)::int n from vida_sede_responsables')).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from profiles')).rows[0].n,8)})
 await t.test('clasificación y responsabilidades solo por administración',async()=>{
  await fn(ADMIN,'vida_clasificar_ministerio',[MISA,SA,null]);await fn(ADMIN,'vida_clasificar_ministerio',[MICH,CH,null]);await fn(ADMIN,'vida_clasificar_ministerio',[LIVE,SA,null])
  await fn(ADMIN,'vida_asignar_pastor_sede',[PA,SA,true]);await fn(ADMIN,'vida_asignar_pastor_sede',[PC,CH,true])
  await assert.rejects(fn(LA,'vida_clasificar_ministerio',[MICH,SA,CH]));await assert.rejects(fn(ADMIN,'vida_clasificar_ministerio',[MISA,CH,null]))
  await assert.rejects(fn(ADMIN,'vida_asignar_pastor_sede',[EX,SA,true]))
  const nuevo=scalar(await fn(ADMIN,'vida_crear_ministerio_sede',[CH,'Intercesión','Equipo ficticio']))
  assert.equal((await db.query('select es_publico from calendars where ministerio_id=$1',[nuevo])).rows[0].es_publico,false)
  await assert.rejects(fn(ADMIN,'vida_crear_ministerio_sede',[CH,'Intercesión','Duplicado']))
 })
 await t.test('pastor local y líder no amplían alcance mediante UUID o JSON alterados',async()=>{
  assert.equal(scalar(await fn(PA,'vida_validar_audiencia',[a([SA])])),true)
  assert.equal(scalar(await fn(PA,'vida_validar_audiencia',[a([CH])])),false)
  assert.equal(scalar(await fn(LA,'vida_validar_audiencia',[a([SA],{todos:false,ministerios:[MISA]})])),true)
  assert.equal(scalar(await fn(LA,'vida_validar_audiencia',[a([SA],{todos:false,roles:['pastor']})])),false)
  assert.equal(scalar(await fn(LA,'vida_validar_audiencia',[a([SA],{todos:false,ministerios:[LIVE]})])),false)
  assert.equal(scalar(await fn(PA,'vida_validar_audiencia',[{version:1,todos:true,lideres:false,sedes:[SA]}])),false)
 })

 let pubPublic, pubPastores, pubPersonas, video, paquete
 async function crearAviso(actor,aud,min=null){const r=await asUser(actor,'insert into publicaciones(autor_id,ministerio_id,titulo,cuerpo,vida_audiencia) values($1,$2,$3,$4,$5) returning id',[actor,min,'Mensaje ficticio','Contenido de prueba',aud]);return r.rows[0].id}
 async function puedeLeer(actor,table,id){return (await asUser(actor,`select id from ${table} where id=$1`,[id])).rows.length>0}
 await t.test('seleccionar otra congregación no concede ministerios ni rol pastoral',async()=>{
  await fn(MC,'vida_guardar_mis_sedes',[[SA],null]);assert.equal((await asUser(MC,'select rol from profiles where id=$1',[MC])).rows[0].rol,'servidor')
  assert.equal(scalar(await fn(MC,'vida_validar_audiencia',[a([SA])])),false)
  assert.equal(await puedeLeer(MC,'eventos',EVSA),false)
 })
 await t.test('los avisos privados respetan sitio, rol y personas explícitas',async()=>{
  await fn(EX,'vida_guardar_mis_sedes',[[SA],[CH]])
  pubPublic=await crearAviso(PA,a())
  pubPastores=await crearAviso(PA,a([SA],{todos:false,roles:['pastor']}))
  pubPersonas=await crearAviso(PA,a([SA],{todos:false,personas:[EX]}))
  assert.equal(await puedeLeer(EX,'publicaciones',pubPublic),true)
  assert.equal(await puedeLeer(EX,'publicaciones',pubPastores),false)
  assert.equal(await puedeLeer(PC,'publicaciones',pubPastores),false)
  assert.equal(await puedeLeer(PA,'publicaciones',pubPastores),true)
  assert.equal(await puedeLeer(EX,'publicaciones',pubPersonas),true)
  assert.equal(await puedeLeer(MC,'publicaciones',pubPersonas),false)
 })
 await t.test('Inicio filtra públicos y conserva privados dirigidos, sin badges fantasma',async()=>{
  let rows=(await fn(EX,'vida_avisos_inicio')).rows.map(x=>x.result)
  // La función setof se consulta por sus columnas reales.
  rows=(await asUser(EX,'select id from vida_avisos_inicio()')).rows.map(x=>x.id)
  assert.equal(rows.includes(pubPublic),false);assert.equal(rows.includes(pubPersonas),true)
  const ids=(await fn(EX,'get_unread_publication_ids',[[pubPublic,pubPastores,pubPersonas]])).rows.map(x=>x.result?.publicacion_id||x.result)
  const direct=(await asUser(EX,'select publicacion_id from get_unread_publication_ids($1)',[[pubPublic,pubPastores,pubPersonas]])).rows.map(x=>x.publicacion_id)
  assert.deepEqual(direct,[pubPersonas])
  await fn(EX,'mark_publication_read',[pubPersonas])
  assert.equal((await asUser(EX,'select * from get_unread_publication_ids($1)',[[pubPersonas]])).rows.length,0)
  await fn(EX,'mark_publication_read',[pubPastores])
  assert.equal((await db.query('select * from publicacion_lecturas where profile_id=$1 and publicacion_id=$2',[EX,pubPastores])).rows.length,0)
 })
 await t.test('publicación y audiencia se guardan juntas y no se suplanta autor',async()=>{
  const before=(await db.query('select count(*)::int n from publicaciones')).rows[0].n
  await assert.rejects(crearAviso(PA,a([CH])))
  await assert.rejects(asUser(PA,'insert into publicaciones(autor_id,titulo,vida_audiencia) values($1,$2,$3)',[PC,'Suplantado',a()]))
  await assert.rejects(asUser(PA,'update publicaciones set autor_id=$1 where id=$2',[PC,pubPublic]))
  await assert.rejects(asUser(PA,'update publicaciones set vida_audiencia=null where id=$1',[pubPublic]))
  assert.equal((await db.query('select count(*)::int n from publicaciones')).rows[0].n,before)
 })
 await t.test('devocionales y paquetes no se exponen por RLS o RPC heredado',async()=>{
  video=(await asUser(PA,'insert into vida_devocionales(autor_id,titulo,publicado,vida_audiencia) values($1,$2,true,$3) returning id',[PA,'Video ficticio',a([SA],{todos:false,roles:['pastor']})])).rows[0].id
  assert.equal(await puedeLeer(PC,'vida_devocionales',video),false);assert.equal(await puedeLeer(MC,'vida_devocionales',video),false)
  paquete=(await asUser(PA,`insert into pastoral_paquetes(profile_id,titulo,instrucciones,notas_privadas,publicado,published_at,public_slug,vida_audiencia) values($1,'Material ficticio','https://www.youtube.com/watch?v=abcdefghijk','NOTA PRIVADA',true,now(),$2,$3) returning id`,[PA,uuid(61),a([SA],{todos:false,personas:[EX]})])).rows[0].id
  assert.equal(await puedeLeer(EX,'pastoral_paquetes',paquete),false) // Sigue sin SELECT sobre el paquete privado del autor.
  const permitido=scalar(await fn(EX,'get_public_pastoral_package',[paquete]));assert.equal(permitido.access,'granted');assert.equal(JSON.stringify(permitido).includes('NOTA PRIVADA'),false)
  const negado=scalar(await fn(MC,'get_public_pastoral_package',[paquete]));assert.ok(!negado||negado.access!=='granted')
  assert.equal((await asUser(MC,'select * from get_received_pastoral_packages() where id=$1',[paquete])).rows.length,0)
  const legado=scalar(await fn(EX,'vida_mensajes_legado_visibles',[13]));assert.equal(legado.length,1);assert.equal(JSON.stringify(legado).includes('NOTA PRIVADA'),false)
 })
 await t.test('grupos privados, intransferibles y sin ampliar alcance al usarlos',async()=>{
  const group=(await asUser(PA,"insert into vida_grupos_destino(owner_id,nombre,audiencia) values($1,'Mi grupo',$2) returning id",[PA,a([SA],{todos:false,roles:['pastor']})])).rows[0].id
  assert.equal((await asUser(PC,'select * from vida_grupos_destino where id=$1',[group])).rows.length,0)
  await assert.rejects(asUser(PA,'update vida_grupos_destino set owner_id=$1 where id=$2',[PC,group]))
  await assert.rejects(asUser(PA,'update vida_grupos_destino set audiencia=$1 where id=$2',[a([CH]),group]))
  await assert.rejects(asUser(EX,'select vida_privado.audiencia_coincide($1,$2)',[a(),PA]))
 })
 await t.test('push coincide con permisos actuales y respeta bajas y sedes visibles',async()=>{
  let ids=(await asUser(PA,'select profile_id from vida_destinatarios_contenido($1,$2)',['aviso',pubPastores])).rows.map(x=>x.profile_id)
  assert.deepEqual(ids,[PA])
  await db.query('insert into notificaciones_preferencias(profile_id,activo) values($1,false)',[PA])
  assert.equal((await asUser(PA,'select * from vida_destinatarios_contenido($1,$2)',['aviso',pubPastores])).rows.length,0)
  const publicIds=(await asUser(PA,'select profile_id from vida_destinatarios_contenido($1,$2)',['aviso',pubPublic])).rows.map(x=>x.profile_id)
  assert.equal(publicIds.includes(EX),false);assert.equal(publicIds.includes(OFF),false)
  await assert.rejects(asUser(PC,'select * from vida_destinatarios_contenido($1,$2)',['aviso',pubPastores]))
 })
 await t.test('retirar el rol deja ineficaces responsabilidades antiguas',async()=>{
  await db.query("update profiles set rol='servidor' where id=$1",[PA])
  assert.equal(scalar(await fn(PA,'vida_validar_audiencia',[a()])),false)
  await db.query("update profiles set rol='pastor' where id=$1",[PA])
  await db.query('update profiles set es_pastor_general=true where id=$1',[PC])
  assert.equal(scalar(await fn(PC,'vida_validar_audiencia',[a()])),true)
  await db.query('update profiles set es_pastor_general=false where id=$1',[PC])
 })
 await t.test('invitar y asignar músico no concede membresía ni chats de otro equipo',async()=>{
  const count=(await db.query('select count(*)::int n from ministerio_miembros')).rows[0].n
  await assert.rejects(fn(MC,'vida_invitar_musico',[EVSA,MISA,MC,true]))
  await assert.rejects(fn(LA,'vida_invitar_musico',[EVCH,MISA,MC,true]))
  await fn(LA,'vida_invitar_musico',[EVSA,MISA,MC,true])
  const servicio=scalar(await fn(MC,'vida_servicio_invitado',[EVSA,MISA]));assert.equal(servicio.canciones.length,1);assert.equal(servicio.canciones[0].chords,'C F G')
  await assert.rejects(fn(MC,'vida_servicio_invitado',[EVSA,LIVE]))
  const privado=await crearAviso(LA,a([SA],{todos:false,ministerios:[MISA]}),MISA)
  assert.equal(await puedeLeer(MC,'publicaciones',privado),false)
  await assert.rejects(fn(LA,'vida_asignar_invitado',[EVSA,MISA,MC,CAPCH]))
  assert.equal(scalar(await fn(LA,'vida_asignar_invitado',[EVSA,MISA,MC,CAPSA])),true)
  assert.equal((await db.query('select count(*)::int n from ministerio_miembros')).rows[0].n,count)
  await fn(LA,'vida_invitar_musico',[EVSA,MISA,MC,false]);await assert.rejects(fn(MC,'vida_servicio_invitado',[EVSA,MISA]))
  assert.equal((await db.query('select count(*)::int n from evento_asignaciones where profile_id=$1',[MC])).rows[0].n,1)
 })
 await t.test('eventos públicos no abren la programación privada de sus equipos',async()=>{
  await db.query('update calendars set es_publico=true where id=$1',[CASA])
  assert.equal(await puedeLeer(EX,'eventos',EVSA),true)
  assert.equal((await asUser(EX,'select * from evento_repertorio where evento_id=$1',[EVSA])).rows.length,0)
  assert.equal((await asUser(EX,'select * from evento_asignaciones where evento_id=$1',[EVSA])).rows.length,0)
 })
 await t.test('registro aplica solo preferencia propia y nunca pisa una elección posterior',async()=>{
  await fn(EX,'vida_aplicar_registro_sedes',[[CH]])
  assert.deepEqual((await asUser(EX,'select sede_id from vida_sede_selecciones where pertenece')).rows.map(x=>x.sede_id),[SA])
  await fn(MA,'vida_aplicar_registro_sedes',[[SA,CH]])
  assert.equal((await asUser(MA,'select * from vida_sede_selecciones where pertenece')).rows.length,2)
 })
 await t.test('anon ve solo catálogo activo y no ejecuta funciones de gestión o privacidad',async()=>{
  await db.exec('set role anon')
  try{assert.equal((await db.query('select * from vida_catalogo_registro()')).rows.length,2);await assert.rejects(db.query('select pais from vida_sedes'));await assert.rejects(db.query('select * from vida_sede_selecciones'));await assert.rejects(db.query('select vida_sedes_administracion()'));await assert.rejects(db.query('select vida_opciones_destinatarios()'))}finally{await db.exec('reset role')}
 })
 await t.test('una cuenta desactivada pierde también invitaciones y destinatarios privados',async()=>{
  await fn(LA,'vida_invitar_musico',[EVSA,MISA,MC,true]);await db.query('update profiles set activo=false where id=$1',[MC])
  await assert.rejects(fn(MC,'vida_servicio_invitado',[EVSA,MISA]));assert.equal(await puedeLeer(MC,'eventos',EVSA),false)
  await db.query('update profiles set activo=true where id=$1',[MC])
 })
 await t.test('GPS por templo: Chalchuapa no hereda Santa Ana y admite una vigilia conjunta',async()=>{
  await db.exec(`insert into app_settings values('ubicacion_principal_iglesia','{"latitud":13.9,"longitud":-89.5,"radio_metros":150}')`)
  assert.equal(scalar(await fn(PA,'asistencia_evento_estado',[EVSA])).ubicacion_principal_disponible,true)
  assert.equal(scalar(await fn(PC,'asistencia_evento_estado',[EVCH])).ubicacion_principal_disponible,false)
  await assert.rejects(fn(PA,'vida_guardar_ubicacion_sede',[CH,14,-89,150,null]))
  await fn(ADMIN,'vida_guardar_ubicacion_sede',[CH,14,-89,150,null])
  await assert.rejects(fn(ADMIN,'vida_guardar_ubicacion_sede',[CH,14.1,-89,150,null]))
  await assert.rejects(fn(PA,'asistencia_configurar_evento_principal',[EVCH]))
  await fn(PA,'vida_fijar_sede_evento',[EVSA,CH])
  assert.equal((await db.query('select sede_id from evento_asistencia_config where evento_id=$1',[EVSA])).rows[0].sede_id,CH)
  await db.query("update eventos set fecha_inicio=now(),fecha_fin=now()+interval '2 hours' where id=$1",[EVSA])
  await assert.rejects(fn(MA,'asistencia_confirmar_gps',[EVSA,13.9,-89.5,10]))
  assert.equal(scalar(await fn(MA,'asistencia_confirmar_gps',[EVSA,14,-89,10])).confirmado,true)
  await fn(PA,'asistencia_configurar_evento',[EVSA,13.8,-89.4,150,30,90])
  assert.equal((await db.query('select sede_id from evento_asistencia_config where evento_id=$1',[EVSA])).rows[0].sede_id,null)
 })
 await t.test('asistencia pública por congregación real, no por seguir avisos; historial limitado por evento',async()=>{
  await fn(MA,'vida_guardar_mis_sedes',[[SA],[SA,CH]])
  await fn(MC,'vida_guardar_mis_sedes',[[CH],[SA,CH]])
  await fn(LA,'vida_invitar_musico',[EVSA,MISA,MC,false])
  // Retirar una invitación conserva la asignación histórica y su asistencia esperada.
  assert.equal(scalar(await fn(PA,'asistencia_persona_esperada',[EVSA,MC])),true)
  assert.equal(scalar(await fn(PA,'asistencia_persona_esperada',[EVSA,EX])),true) // EX pertenece a SA.
  await fn(EX,'vida_guardar_mis_sedes',[[CH],[SA,CH]])
  assert.equal(scalar(await fn(PA,'asistencia_persona_esperada',[EVSA,EX])),false)
  await fn(PC,'asistencia_configurar_evento',[EVCH,14,-89,150,30,90])
  await db.query("update eventos set fecha_inicio=now()-interval '1 hour',fecha_fin=now()+interval '1 hour' where id=$1",[EVCH])
  await db.query("insert into evento_asistencias values($1,$2,'asistio',now(),'gps')",[EVCH,MA])
  const propio=(await asUser(MA,'select * from asistencia_historial_persona($1)',[MA])).rows
  assert.equal(propio.some(x=>x.evento_id===EVCH),true)
  const local=(await asUser(PA,'select * from asistencia_historial_persona($1)',[MA])).rows
  assert.equal(local.some(x=>x.evento_id===EVCH),false)
  await assert.rejects(fn(PA,'asistencia_resumen_evento',[EVCH]))
  await assert.rejects(fn(PA,'asistencia_desactivar_evento',[EVCH]))
  await assert.rejects(fn(PA,'asistencia_justificar',[EVCH,MC]))
  const assignment=(await db.query('select id from evento_asignaciones where evento_id=$1',[EVSA])).rows[0].id
  assert.equal(scalar(await fn(PC,'puede_gestionar_intercambio',[assignment])),false)
  assert.equal(scalar(await fn(PA,'puede_gestionar_intercambio',[assignment])),true)
  await db.exec("set request.jwt.claim.sub='';set request.jwt.claim.role='anon';set role anon")
  try{assert.equal((await db.query('select asistencia_consecutivos_sin_confirmar($1) n',[MA])).rows[0].n,0)}finally{await db.exec("reset role;set request.jwt.claim.role=''")}
 })
 await t.test('corte de compatibilidad y reversión conservan la privacidad sin borrar filas',async()=>{
  await db.exec('update vida_privado.config set exigir_sedes_legacy=true where id')
  await assert.rejects(asUser(PA,"insert into publicaciones(autor_id,titulo) values($1,'Ruta antigua')",[PA]))
  const before=(await db.query('select count(*)::int n from publicaciones')).rows[0].n
  await db.exec(await readFile(new URL('../../docs/sql/sedes-integracion-reversion.sql',import.meta.url),'utf8'))
  await assert.rejects(crearAviso(PA,a()))
  await assert.rejects(fn(LA,'vida_invitar_musico',[EVSA,MISA,MC,true]))
  await assert.rejects(fn(ADMIN,'vida_guardar_ubicacion_sede',[CH,14.1,-89,150,{latitud:14,longitud:-89,radio_metros:150}]))
  assert.equal(await puedeLeer(MC,'publicaciones',pubPersonas),false)
  assert.equal(await puedeLeer(EX,'publicaciones',pubPersonas),true)
  assert.equal((await db.query('select count(*)::int n from publicaciones')).rows[0].n,before)
  const denied=scalar(await fn(MC,'get_public_pastoral_package',[paquete]));assert.ok(!denied||denied.access!=='granted')
 })
 } finally { await db.close() }
})
