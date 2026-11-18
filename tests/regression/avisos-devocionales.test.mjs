import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const actor='autor';const id='devocional'
function escenario(opciones={}) {
  const o={mensaje:{id,titulo:'Mensaje autorizado',autor_id:actor,publicado:true,audiencia_iglesia:false,roles_destino:[],ministerios_destino:['a','b'],lideres_ministerio:false,updated_at:'revision'},perfiles:[{id:'u1',rol:'servidor',activo:true,estado_cuenta:'activo'},{id:'u2',rol:'pastor',activo:true,estado_cuenta:'activo'},{id:'u3',rol:'servidor',activo:false,estado_cuenta:'activo'},{id:'u4',rol:'servidor',activo:true,estado_cuenta:'activo'}],miembros:[{profile_id:'u1',ministerio_id:'a',es_lider:false},{profile_id:'u1',ministerio_id:'b',es_lider:false},{profile_id:'u2',ministerio_id:'c',es_lider:true},{profile_id:'u3',ministerio_id:'a',es_lider:true},{profile_id:'u4',ministerio_id:'c',es_lider:false}],bajas:[],cambio:false,errorTabla:null,cero:false,...opciones}
  const envios=[];const registro=[];const consultas=[]
  const service={from(tabla){const ops=[];consultas.push({tabla,ops});return{select(...v){ops.push(['select',...v]);return this},eq(...v){ops.push(['eq',...v]);return this},in(...v){ops.push(['in',...v]);return this},order(){return this},async maybeSingle(){return{data:ops.some(v=>v[0]==='select'&&v[1]==='id')?(o.cambio?null:{id}):o.mensaje,error:null}},async range(desde,hasta){if(o.errorTabla===tabla)return{data:null,error:{message:'sin lectura'}};let datos=tabla==='profiles'?o.perfiles.filter(p=>p.activo&&p.estado_cuenta==='activo'):tabla==='ministerio_miembros'?o.miembros:tabla==='notificaciones_preferencias'?o.bajas:registro.map(profile_id=>({profile_id}));const filtro=ops.find(v=>v[0]==='in');if(filtro)datos=datos.filter(p=>filtro[2].includes(p[filtro[1]]));return{data:datos.slice(desde,hasta+1),error:null}}}}}
  const helper=cargarModulo('lib/estudios/notificar-mensaje-dirigido.ts',{'server-only':{},'@/lib/supabase/service':{createServiceClient:()=>service},'@/lib/webpush':{notifyUsersOnceByReference:async(ids,payload,ref)=>{envios.push({ids:[...ids],payload,ref});if(!o.cero)registro.push(...ids);return{users:o.cero?0:ids.length,devices:o.cero?0:ids.length}}}})
  return{helper,envios,registro,consultas}
}

test('dos ministerios y un rol forman una unión sin duplicados, sin incluir cuentas inactivas o ajenas',async()=>{
  const e=escenario();const r=await e.helper.notificarMensajeDirigido(id,actor)
  assert.ok(e.envios.length,JSON.stringify({r,consultas:e.consultas}));assert.deepEqual(e.envios[0].ids,['u1']);assert.match(r,/1 personas/)
  assert.equal(e.envios[0].payload.url,`/estudios/mensajes/${id}`)
  assert.equal(e.envios[0].ref.referenciaId,id)
  const membresias=e.consultas.find(q=>q.tabla==='ministerio_miembros')
  assert.ok(membresias.ops.some(v=>v[0]==='eq'&&v[1]==='ministerios.activo'&&v[2]===true))
})

test('respeta combinaciones de roles, ministerios, líderes contextuales y bajas',()=>{
  const {helper}=escenario()
  const perfiles=[{id:'a',rol:'servidor'},{id:'b',rol:'lider'},{id:'c',rol:'pastor'}]
  const miembros=[{profile_id:'a',ministerio_id:'uno',es_lider:true},{profile_id:'a',ministerio_id:'dos',es_lider:false},{profile_id:'b',ministerio_id:'uno',es_lider:false}]
  const audiencia={audiencia_iglesia:false,roles_destino:['pastor'],ministerios_destino:['dos'],lideres_ministerio:true}
  assert.deepEqual([...helper.elegirDestinatarios(audiencia,perfiles,miembros,[])],['a','c'])
  assert.deepEqual([...helper.elegirDestinatarios(audiencia,perfiles,miembros,[{profile_id:'a',ministerio_id:null}])],['c'])
  const soloMinisterios={...audiencia,roles_destino:[],lideres_ministerio:false,ministerios_destino:['uno','dos']}
  assert.deepEqual([...helper.elegirDestinatarios(soloMinisterios,perfiles,miembros,[{profile_id:'a',ministerio_id:'uno'}])],['a','b'])
})

test('un borrador o una publicación de otro autor nunca envían',async()=>{
  for(const alteracion of[{publicado:false},{autor_id:'otro'}]){
    const base=escenario({mensaje:{id,titulo:'No enviar',autor_id:actor,publicado:true,...alteracion}})
    await base.helper.notificarMensajeDirigido(id,actor);assert.equal(base.envios.length,0)
  }
})

test('el reintento solo envía a pendientes, conservando registros previos',async()=>{
  const e=escenario();await e.helper.notificarMensajeDirigido(id,actor);await e.helper.notificarMensajeDirigido(id,actor)
  assert.equal(e.envios.length,1);assert.deepEqual(e.registro,['u1'])
})

test('despublicar o cambiar audiencia durante la preparación cancela el aviso',async()=>{
  const e=escenario({cambio:true});await e.helper.notificarMensajeDirigido(id,actor);assert.equal(e.envios.length,0)
})

test('fallo de lectura no amplía audiencia ni devuelve un envío exitoso',async()=>{
  const e=escenario({errorTabla:'ministerio_miembros'});const r=await e.helper.notificarMensajeDirigido(id,actor)
  assert.equal(e.envios.length,0);assert.match(r,/No se pudo completar/)
})

test('cero dispositivos aceptados no se presenta como aviso entregado',async()=>{
  const e=escenario({cero:true});const r=await e.helper.notificarMensajeDirigido(id,actor)
  assert.match(r,/no se confirmó ningún envío/);assert.equal(e.registro.length,0)
})


test('la audiencia congregacional pagina todas las cuentas y no se trunca en mil',async()=>{
  const perfiles=Array.from({length:1001},(_,i)=>({id:`u${i}`,rol:'servidor',activo:true,estado_cuenta:'activo'}))
  const e=escenario({perfiles,mensaje:{id,titulo:'Congregación',autor_id:actor,publicado:true,audiencia_iglesia:true,roles_destino:[],ministerios_destino:[],lideres_ministerio:false,updated_at:'revision'}})
  await e.helper.notificarMensajeDirigido(id,actor)
  assert.equal(e.envios[0].ids.length,1001)
  assert.ok(e.envios[0].ids.includes('u1000'))
})

test('si no pueden leerse las preferencias no avisa ignorando las bajas',async()=>{
  const e=escenario({errorTabla:'notificaciones_preferencias'})
  await e.helper.notificarMensajeDirigido(id,actor)
  assert.equal(e.envios.length,0)
})
