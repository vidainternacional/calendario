# FASE G — Matriz de validación integral

Fecha de inicio: 2026-08-17  
Actualización de modelo: 2026-08-18  
Rama de trabajo: `agent/fase-g-validacion-integral`  
Estado: **BLOQUE 1 — EN CURSO**

## Objetivo

Validar VIDA como un solo sistema, por permisos efectivos y por flujo real, sin reabrir fases cerradas salvo bug comprobable.

## Regla de estado

Cada recorrido termina únicamente en uno de estos estados:

- `VALIDADO`: recorrido ejecutado y comportamiento correcto.
- `BUG`: fallo reproducible con evidencia suficiente.
- `NO APLICA`: el permiso o flujo no corresponde.
- `PENDIENTE DE CUENTA/DATO`: falta interacción, cuenta, membresía, evento o dato real para cerrar la prueba.

La lectura de código, CI o una prueba RLS pueden cerrar una deuda técnica concreta, pero **no sustituyen una prueba interactiva** cuando el recorrido depende de sesión, iPhone/PWA o interacción humana.

## Modelo real de acceso — vigente

- `administrador`: único rol global con acceso al **Administrador general** y a cambios globales de usuarios, roles y liderazgos.
- `pastor`: rol global pastoral. Tiene Centro Pastoral y capacidades pastorales específicas, pero **no obtiene `/admin` ni gestión global de ministerios por ser Pastor**.
- `lider`: existe como rol global en `profiles.rol`, pero no concede liderazgo automático en todos los ministerios.
- `ministerio_miembros.es_lider=true`: fuente de verdad para liderazgo contextual de un ministerio. Puede haber múltiples líderes por ministerio y una persona puede liderar varios ministerios.
- `servidor`: rol global común; sus capacidades dependen de membresías, asignaciones y permisos explícitos.
- `acceso_centro_pastoral`: puede habilitar Centro Pastoral a una cuenta activa sin convertirla en Pastor ni Administrador.
- `es_pastor_general`: elevación específica solo en superficies que la contemplan; no equivale a Administrador general.

Por ello, las pruebas se registran como **rol global + capacidad efectiva + contexto**.

## Leyenda de acceso esperado

- `SÍ`: acceso esperado por rol/capacidad global.
- `CTX`: depende de membresía, `es_lider`, asignación, `acceso_centro_pastoral`, `es_pastor_general` u otro contexto explícito.
- `NO`: no debe acceder; la URL directa debe bloquear/redirigir.

## Matriz maestra

| Área / recorrido | Administrador | Pastor | Líder global | Servidor | Estado FASE G | Evidencia / criterio |
|---|---:|---:|---:|---:|---|---|
| Inicio / carga principal | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Admin y Servidor ya recorrieron Inicio en iPhone; Líder/Pastor pendientes |
| Navegación inferior Inicio/Calendario/Avisos/Estudios/Perfil | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Admin y Servidor validados; teclado no levantó barra en Admin |
| Login / sesión válida | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Completar por cuentas restantes |
| Recuperación/restablecimiento de contraseña | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Requiere interacción real |
| Estado de cuenta pendiente/inactivo | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | No existe actualmente cuenta de prueba pendiente/inactiva |
| Cierre de sesión / cambio de cuenta | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Debe limpiar estado local sin mezclar cuentas |
| Perfil / datos personales / avatar | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Admin/Servidor parcialmente recorridos |
| Contactos / solicitar, aceptar, eliminar | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | RLS endurecida; flujo real aún requiere dos cuentas |
| Contactos / seguridad de respuesta | SÍ | SÍ | SÍ | SÍ | VALIDADO | Prueba RLS: remitente no puede autoaceptar; destinatario sí |
| Calendario / vistas y navegación | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Año/Mes/Compacto/Apilado/Detalles/Lista sin regresión |
| Calendario / evento → detalle | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Abre evento correcto y conserva contexto |
| Avisos / listado y detalle | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Visibilidad real por destinatario |
| Avisos / badge no leído | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Conteo converge con contenido visible |
| Avisos / reconexión, focus, visibilitychange | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Código y regresión actualizados; falta interacción completa |
| Push / recepción con app activa | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Cualquier push refresca estado compartido; falta medición real |
| Push / segundo plano + retorno | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Validar convergencia real en iPhone |
| Para ti / acciones por responsabilidad | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Incluye servicios, ingresos, solicitudes, contactos, Buzón y Ayuda según rol |
| Estudios / hub | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Biblia, Estudio Profundo y Cuaderno visibles |
| Biblia / lectura y navegación exacta | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Libro/capítulo/versículo correcto |
| Biblia / favoritos, escuchar, estudiar, profundo | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Acciones y destinos correctos |
| Biblia / búsqueda y concordancias | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | No inventa referencias; deep-link exacto |
| Estudio Profundo / consulta determinística | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Capas reales, sin placeholders falsos |
| Estudio Profundo / ayuda IA Gemini | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Respuesta o fallo controlado |
| Estudio Profundo → guardar en Cuaderno | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F; revalidar solo ante regresión |
| Cuaderno / origen Biblia | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / origen Estudio Profundo | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / filtros, búsqueda y editor largo | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / offline cold-start y misma UI | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F/iPhone |
| Cuaderno / sincronización entre dispositivos | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / predicación correlativa | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Ministerios / listado visible | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Pastor no recibe gestión global; contexto real manda |
| Ministerio / acceso por URL directa | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | No miembro común debe ser redirigido |
| Ministerio / personalización | SÍ | CTX | CTX | NO | PENDIENTE DE CUENTA/DATO | Pastor/Líder requieren `es_lider`; Admin conserva alcance global |
| Ministerio / miembros | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Servidor ya validó experiencia sin controles de líder |
| Solicitud de ingreso a ministerio | SÍ | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Admin o líder contextual resuelven; Pastor solo si lidera |
| Solicitudes del ministerio | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Resolución: Admin o líder contextual; propia visible según política |
| Avisos de ministerio / lectura | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Miembro recibe lo correspondiente; Pastor conserva publicación pastoral global |
| Avisos de ministerio / creación | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Pastor puede publicar; líder crea para ministerios liderados |
| Aprobación/revisión de avisos | SÍ | CTX | NO | NO | PENDIENTE DE CUENTA/DATO | Admin o `es_pastor_general`; Pastor común no revisa |
| Programación ministerial / vista mensual | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Pastor gestiona solo donde `es_lider`; servidor puede ver su contexto |
| Programación / asignar integrante por función | SÍ | CTX | CTX | NO | PENDIENTE DE CUENTA/DATO | Admin o líder contextual |
| Programación / repertorio, tonos, enlaces, colores | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Biblioteca histórica y cambio mensual corregidos; validar interacción |
| Asignación / confirmar asistencia | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Solo asignado confirma su estado |
| Asignación / no puedo servir | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Estado sincronizado en superficies |
| Solicitar reemplazo | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Limitado al equipo correcto |
| Resolver reemplazo | SÍ | CTX | CTX | NO | PENDIENTE DE CUENTA/DATO | Admin o líder contextual |
| Nuevo reemplazo / confirmación | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Nuevo integrante pendiente y luego confirma |
| Historial de programación/reemplazos | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | No destruir historial aprobado |
| Solicitudes globales / contador | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Solo elementos accionables por esa cuenta |
| Intercambios | SÍ | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Acción limitada al ámbito autorizado |
| Preguntas / crear | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Pregunta personal y anónima |
| Preguntas / responder/archivar | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Función pastoral accesible desde Centro Pastoral, no desde `/admin` para Pastor |
| Preguntas anónimas / privacidad de identidad | SÍ | SÍ | NO | NO | VALIDADO | RLS simulada: Pastor ve pregunta con `profile_id=NULL`; identidad separada sin grant a `authenticated` |
| Ayuda Solidaria / solicitar o aportar | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Piloto sigue pausado; no ejecuta telemetría exclusiva |
| Ayuda Solidaria / gestión pastoral | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Centro Pastoral; acceso según función pastoral autorizada |
| Recordatorios / detalle/destino | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Abre elemento correcto desde notificación |
| Materiales compartidos / detalle | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Solo material visible/autorizado |
| Centro Pastoral / acceso por rol | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Cuenta activa + Pastor/Admin o permiso explícito |
| Centro Pastoral / acceso explícito a no-pastor | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Existe un caso real de acceso explícito; falta recorrido interactivo |
| Pastoral / paquetes | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Datos privados del autor/alcance correcto |
| Pastoral / bosquejos | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Crear/editar/abrir según acceso |
| Pastoral / colecciones de versículos | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Asociación y navegación correctas |
| Pastoral / biblioteca | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Archivos/enlaces visibles según permiso |
| Pastoral / materiales | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Publicación/lectura según permiso |
| Administración / entrada por URL | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | `/admin` reservado a Administrador; probar Pastor/Líder/Servidor por URL |
| Administración / usuarios | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Cambios globales de rol/usuario solo Administrador |
| Administración / ministerios | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Liderazgos globales y configuración administrativa solo Administrador |
| Administración / solicitudes de ministerios | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Admin global; líder usa su superficie contextual |
| Administración / avisos | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Pastor publica desde Avisos, no desde Admin |
| Administración / preguntas | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Pastor responde desde Centro Pastoral |
| Administración / Ayuda Solidaria | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Pastor gestiona desde Centro Pastoral |
| Administración / accesos pastorales | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Asignación/retiro solo Administrador |
| Administración / Centro de Análisis | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Administrador general únicamente mientras el layout sea Admin-only |
| Diagnóstico IA | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Solo Administrador |
| Configuración administrativa | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Escritura global solo Administrador |
| Error boundary global | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Recuperable sin pantalla rota |
| Loaders / transiciones | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Theme flash Biblia→Cuaderno corregido y protegido |
| PWA / actualización de service worker | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Nueva versión toma control sin perder estado |
| PWA / offline fuera del Cuaderno | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Coherente con capacidades reales del módulo |
| Seguridad / URL directa sin permiso | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Debe denegar por servidor/RLS, no solo ocultar botones |
| Privacidad / cambio entre dos cuentas en mismo dispositivo | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Sin datos residuales de cuenta anterior |
| Latencia transversal Avisos/badge/push | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Capa controlable optimizada; falta medición interactiva final |
| Warning Node `DEP0169` | SÍ | SÍ | SÍ | SÍ | VALIDADO | `web-push` parcheado según upstream + Actions actuales; CI limpio sin DEP0169 |

## Evidencia estructural — Bloque 1A

Estado: **MODELO DE PERMISOS ACTUALIZADO; VALIDACIÓN INTERACTIVA TODAVÍA EN CURSO**.

1. `lib/supabase/middleware.ts` autentica con `getUser()` y conserva la guardia global de estado de cuenta.
2. `/admin` quedó reservado al rol global `administrador`; las server actions administrativas relevantes repiten la autorización en servidor.
3. `pastor` conserva funciones pastorales, pero no se interpreta como Administrador ni como líder global de ministerios.
4. El liderazgo contextual se resuelve por `ministerio_miembros.es_lider=true`; se eliminó el límite histórico de dos liderazgos por persona.
5. Las migraciones aprobadas de FASE G endurecieron perfiles/membresías/ministerios, capacidades, solicitudes, asignaciones y gestión contextual según el nuevo modelo.
6. Contactos fue endurecido para que solo el destinatario pueda responder una solicitud pendiente; la prueba RLS confirmó 0 filas modificables por el remitente y 1 por el destinatario en el caso simulado.
7. El Buzón anónimo separa la identidad del autor en `preguntas_congregacion_identidad`; la tabla pastoral conserva `profile_id=NULL` para preguntas anónimas y la identidad privada no tiene grants para `authenticated`.
8. Ayuda Solidaria dejó de escribir telemetría exclusiva del Piloto mientras el Piloto continúa formalmente pausado.
9. `Para ti` reúne pendientes accionables por responsabilidad y refresca con push/focus/reconexión mediante estado compartido.
10. `DEP0169` dejó de aparecer en CI tras mantener `web-push 3.6.7` con parche reproducible equivalente al fix upstream y actualizar las GitHub Actions del workflow.
11. Las pruebas interactivas de Administrador y Servidor ya aportaron evidencia parcial; Líder y Pastor deben repetirse sobre el head actual porque el modelo de permisos cambió después de sus primeros intentos.

## Validación interactiva ya conservada

### Administrador — lote confirmado en iPhone

- Inicio carga correctamente.
- Navegación inferior Inicio → Calendario → Avisos → Estudios → Perfil.
- La barra inferior no se levanta sobre el teclado.
- Perfil muestra Centro Pastoral y Panel de Administración.
- Panel de Administración abre correctamente.
- Sin flashes/pantallas blancas/saltos reportados en ese recorrido.

### Servidor — lote confirmado en iPhone

- Navegación común correcta.
- No muestra Panel de Administración.
- Centro Pastoral solo cuando existe permiso correspondiente.
- Ministerio visible sin controles de líder.
- Acciones propias de asignación disponibles sin capacidad de modificar equipos.

Estas validaciones no equivalen a validar todas las funciones de esos roles.

## Orden de ejecución restante

### Bloque 1A — Guardias y mapa de permisos

- Modelo estructural corregido.
- Pendiente: revalidación real de **Líder** y **Pastor** sobre el head actual y URLs negativas principales.

### Bloque 1B — Recorrido común

1. Completar Líder/Pastor en Inicio, navegación, Perfil, Calendario y Avisos.
2. Cerrar badges/push con un evento real de prueba cuando exista.
3. Estudios/Biblia/Estudio Profundo: revalidar solo recorridos no cubiertos por FASE F.

### Bloque 1C — Operación ministerial

1. Líder real: Programación, repertorio/biblioteca, solicitudes, avisos y reemplazos.
2. Pastor que es líder en un ministerio: mismas capacidades únicamente en ese contexto.
3. Pastor/Servidor no líderes: ausencia de controles de líder.
4. Contadores e historial.

### Bloque 1D — Pastoral y Administración

1. Pastor: Centro Pastoral, Buzón y Ayuda Solidaria; `/admin` debe denegar.
2. Administrador: superficies globales sin repetir el lote común ya validado.
3. Acciones destructivas se validan sin ejecutar sobre datos importantes salvo caso seguro.

### Bloque 1E — Transversal

1. Reconexión y reanudación.
2. Medición final de push/badges.
3. Cambio de cuenta y privacidad local.
4. Error/loading/service worker.
5. Revisar únicamente hallazgos de seguridad/dependencias que tengan impacto comprobable y autorización correspondiente.

## Reglas durante la validación

- No usar la matriz como excusa para rediseñar superficies aprobadas.
- Un hallazgo visual solo es bug si contradice una decisión aprobada o impide el uso correcto.
- No modificar Supabase/RLS/grants/esquema sin propuesta exacta y aprobación previa.
- No borrar datos reales para facilitar una prueba.
- No marcar `VALIDADO` por lectura de código cuando el flujo requiera interacción real.
- Conservar evidencia anterior y repetir únicamente recorridos afectados por cambios posteriores.
- No iniciar FASE H hasta cerrar formalmente FASE G.
