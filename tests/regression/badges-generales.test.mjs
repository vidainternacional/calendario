import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { setTimeout as esperar } from 'node:timers/promises'
import { cargarModulo } from './seguridad-real-loader.mjs'
const atencion=cargarModulo('lib/notificaciones/atencion.ts')
test('suma pendientes reales sin restar visitas o cantidades vistas y rechaza conteos inválidos',()=>{
 assert.equal(atencion.sumarAtencion({servicios:2,contactos:1,avisos:3}),6)
 for(const n of [-1,NaN,Infinity])assert.equal(atencion.conteoAtencion(n),0)
})
test('gestiones locales solicitan un refresco inmediato después de confirmar guardado',()=>{
 const rutas=[
  'components/contactos/ContactosClient.tsx',
  'app/(app)/admin/preguntas/ResponderPreguntaForm.tsx',
  'app/(app)/admin/preguntas/ArchivarPreguntaBoton.tsx',
  'app/(app)/avisos/pendientes-aprobacion/BotonesAprobacionAviso.tsx',
  'components/solicitudes/BotonesAprobacion.tsx',
  'components/discipulado/DiscipuladoGestionClient.tsx',
  'components/solidaridad/SolidarityAdminBoard.tsx',
 ];
 for(const ruta of rutas){
  const codigo=fs.readFileSync(ruta,'utf8');
  assert.match(codigo,/requestPendingIndicatorsRefresh\(\)/,'Falta refresco en '+ruta);
 }
 assert.match(fs.readFileSync(rutas[0],'utf8'),/if \(!respuesta\.error\) requestPendingIndicatorsRefresh\(\)/);
 assert.match(fs.readFileSync(rutas[4],'utf8'),/if \(respuesta\?\.success\) requestPendingIndicatorsRefresh\(\)/);
 assert.match(fs.readFileSync(rutas[5],'utf8'),/if \(resultado\) requestPendingIndicatorsRefresh\(\)/);
})
function preparar() {
 let sesion={user:{id:'a'}},auth,cleanup;const listeners=new Map(),queryErrors=new Set();let retener=false,resolver;const values={a:2,b:0};
 const cliente={auth:{getSession:async()=>({data:{session:sesion}}),onAuthStateChange(fn){auth=fn;return{data:{subscription:{unsubscribe(){}}}}}},rpc:async(name)=>name==='puede_gestionar_discipulado'?{data:true}:{data:[{no_leidos:sesion?.user.id==='a'?3:0}]} ,from(tabla){let cuenta=false;const usuario=sesion?.user.id;const q={select(_cols,opts){cuenta=!!opts?.count;return q},then(ok,bad){if(tabla==='evento_asignaciones'&&retener&&usuario==='a')return new Promise(r=>{resolver=()=>r({data:[{evento_id:'evento-a'}]})}).then(ok,bad);const resultado=queryErrors.has(tabla)?{error:{message:'fallo'}}:tabla==='profiles'?{data:{rol:'administrador',activo:true,estado_cuenta:'activo'}}:tabla==='evento_asignaciones'?{data:usuario==='a'?[{evento_id:'evento-a'}]:[]}:cuenta?{count:values[usuario]||0}:{data:[]};return Promise.resolve(resultado).then(ok,bad)}};for(const m of ['eq','in','gte','maybeSingle'])q[m]=()=>q;return q}}
 const deps={'react':{useSyncExternalStore(sub,get){if(!cleanup)cleanup=sub(()=>{});return get()}},'@/lib/supabase/client':{createClient:()=>cliente},'@/components/avisos/usePublicationReads':{useUnreadPublicationsCount:()=>0},'@/app/actions/centro-solicitudes-ministerio':{obtenerResumenSolicitudesGestionables:async()=>({total:0,href:null})},'@/lib/notificaciones/atencion':atencion}
 const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/notificaciones/usePendingIndicators.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>deps[n],console,Date,Set,Map,Promise,Event,document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},navigator:{onLine:true},window:{setInterval(){return 1},clearInterval(){},addEventListener(n,fn){listeners.set(n,fn)},removeEventListener(){},dispatchEvent(e){listeners.get(e.type)?.()}}})
 return {leer:()=>module.exports.usePendingIndicators(),refrescar:()=>module.exports.requestPendingIndicatorsRefresh(),salir:()=>{sesion=null;auth('SIGNED_OUT',null)},cambiar:()=>{sesion={user:{id:'b'}};auth('SIGNED_IN',sesion)},retener:()=>{retener=true},resolver:()=>resolver?.(),errores:queryErrors,limpiar:()=>cleanup?.()}
}
const estabilizar=()=>esperar(15)
test('incluye revisión de avisos/discipulado y mensajes solidarios con destino del servicio',async()=>{
 const p=preparar();p.leer();await estabilizar();const r=p.leer();assert.equal(r.pendingAvisosAprobacion,2);assert.equal(r.pendingDiscipuladoRevision,2);assert.equal(r.pendingMensajesSolidarios,3);assert.equal(r.servicioPendienteHref,'/eventos/evento-a');assert.ok(r.total>=7);p.limpiar()
})
test('un fallo de consulta conserva pendientes; cerrar sesión los limpia inmediatamente',async()=>{
 const p=preparar();p.leer();await estabilizar();p.errores.add('contactos');p.refrescar();await estabilizar();assert.equal(p.leer().pendingContactos,2);p.salir();assert.equal(p.leer().pendingContactos,0);assert.equal(p.leer().total,0);p.limpiar()
})
test('respuesta lenta de otra cuenta nunca restaura sus badges después del cambio de usuario',async()=>{
 const p=preparar();p.retener();p.leer();await estabilizar();p.cambiar();assert.equal(p.leer().total,0);p.resolver();await estabilizar();assert.equal(p.leer().pendingServicios,0);assert.equal(p.leer().pendingMensajesSolidarios,0);p.limpiar()
})
test('la barra global usa recuentos reales aunque se navegue y suma videos por abrir',()=>{
 const source=fs.readFileSync('components/notificaciones/useAttentionBadgeCount.ts','utf8');assert.doesNotMatch(source,/destinationFor|readSeen|writeSeen|localStorage|usePathname/)
})

test('el contador compartido de avisos se limpia al salir de la cuenta',async()=>{
 let session={user:{id:'a'}},auth,cleanup,ultimo=0
 const client={auth:{getSession:async()=>({data:{session}}),onAuthStateChange(fn){auth=fn;return{data:{subscription:{unsubscribe(){}}}}}},rpc:async()=>({data:4})}
 const deps={'react':{useState:()=>[0,n=>{ultimo=n}],useEffect:fn=>{cleanup=fn()}},'@/lib/supabase/client':{createClient:()=>client}}
 const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/avisos/usePublicationReads.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>deps[n],console,Date,Set,Map,Promise,Event,document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},window:{setInterval(){return 1},clearInterval(){},addEventListener(){},removeEventListener(){},dispatchEvent(){}}})
 module.exports.useUnreadPublicationsCount();await estabilizar();assert.equal(ultimo,4);session=null;auth('SIGNED_OUT',null);assert.equal(ultimo,0);await estabilizar();assert.equal(ultimo,0);cleanup()
})

test('resumen de solicitudes dirige reemplazos al ministerio autorizado y conserva el conteo anterior',async()=>{
 function preparar(lider){const consultas=[];const admin={from(tabla){consultas.push(tabla);const q={select(){return q},eq(){return q},in(){return q},maybeSingle(){return q},then(ok,bad){const data=tabla==='profiles'?{rol:'servidor',activo:true,estado_cuenta:'activo'}:tabla==='ministerio_miembros'?(lider?[{ministerio_id:'ministerio'}]:[]):tabla==='evento_asignaciones'?[{id:'a',evento_id:'e',ministerio_id:'ministerio',estado:'no_disponible'}]:tabla==='intercambios'?[{asignacion_origen_id:'a',solicitante_id:'u'}]:[];return Promise.resolve({data,count:tabla==='solicitudes'?1:null}).then(ok,bad)}};return q}};const api=cargarModulo('app/actions/centro-solicitudes-ministerio.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'yo'}}})}}),createAdminClient:()=>admin},'@/app/actions/reemplazos-ministeriales':{}});return{api,consultas}}
 const p=preparar(true);const r=await p.api.obtenerResumenSolicitudesGestionables();assert.equal(r.href,'/ministerios/ministerio/solicitudes');assert.equal(r.total,2);assert.equal(await p.api.obtenerConteoSolicitudesGestionables(),2)
 const no=preparar(false);assert.equal((await no.api.obtenerResumenSolicitudesGestionables()).total,0);assert.ok(!no.consultas.includes('evento_asignaciones'))
})
