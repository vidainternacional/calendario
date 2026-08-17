# FASE G — Matriz de validación integral

Fecha de inicio: 2026-08-17
Rama de trabajo: `agent/fase-g-validacion-integral`
Estado: **BLOQUE 1 — EN CURSO**

## Objetivo

Validar VIDA como un solo sistema en producción, por permisos efectivos y por flujo real, sin reabrir fases cerradas salvo que aparezca un bug comprobable.

## Regla de estado

Cada recorrido terminará únicamente en uno de estos estados:

- `VALIDADO`: recorrido ejecutado y comportamiento correcto.
- `BUG`: fallo reproducible con evidencia suficiente.
- `NO APLICA`: el permiso o flujo no corresponde a ese perfil/capacidad.
- `PENDIENTE DE CUENTA/DATO`: falta una cuenta, membresía, evento o dato real para ejecutar la prueba.

## Modelo real de acceso

La validación no se basará únicamente en cuatro etiquetas de rol.

- `administrador`: rol global con acceso administrativo y pastoral.
- `pastor`: rol global con acceso administrativo/pastoral según las guardias existentes.
- `lider`: **sí existe como rol global** en `profiles.rol`.
- `es_lider`: además del rol global `lider`, existe una capacidad contextual e independiente por ministerio en `ministerio_miembros.es_lider`; muchas acciones de gestión ministerial dependen de esta capacidad contextual y no solo del rol global.
- `servidor`: rol global de usuario común; sus capacidades dependen de membresías, asignaciones y permisos adicionales.
- `acceso_centro_pastoral`: una cuenta activa puede recibir acceso pastoral explícito aunque su rol no sea pastor/administrador.
- `es_pastor_general`: eleva acceso en superficies que lo contemplan.

Por ello, las pruebas se registrarán como **rol global + capacidad efectiva + contexto**.

## Leyenda de acceso esperado

- `SÍ`: acceso esperado por rol global.
- `CTX`: depende de membresía, liderazgo contextual, asignación o permiso explícito.
- `NO`: no debe acceder; una URL directa debe bloquear/redirigir.

## Matriz maestra

| Área / recorrido | Administrador | Pastor | Líder global | Servidor | Estado FASE G | Evidencia / criterio |
|---|---:|---:|---:|---:|---|---|
| Inicio / carga principal | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Carga, próximos eventos, avisos y accesos sin error |
| Navegación inferior Inicio/Calendario/Avisos/Estudios/Perfil | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Navegación estable; teclado no levanta la barra |
| Login / sesión válida | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Entrar y llegar a estado permitido |
| Recuperación/restablecimiento de contraseña | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Flujo completo sin sesión cruzada |
| Estado de cuenta pendiente/inactivo | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Bloqueo coherente y sin acceso residual |
| Cierre de sesión / cambio de cuenta | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Limpia marcadores locales sensibles y no mezcla cuentas |
| Perfil / datos personales / avatar | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Lectura/edición permitida y persistente |
| Contactos | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Solicitud, aceptación y visibilidad correctas |
| Calendario / vistas y navegación | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Año/Mes/Compacto/Apilado/Detalles/Lista sin regresión |
| Calendario / evento → detalle | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Abre evento correcto y conserva fecha/contexto |
| Avisos / listado y detalle | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Visibilidad real por destinatario |
| Avisos / badge no leído | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Conteo converge con contenido visible |
| Avisos / reconexión, focus, visibilitychange | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Actualiza sin recarga manual |
| Push / recepción con app activa | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Aviso y destino correctos |
| Push / segundo plano + retorno | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Contenido/badge convergen al volver |
| Estudios / hub | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Biblia, Estudio Profundo y Cuaderno visibles |
| Biblia / lectura y navegación exacta | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Libro/capítulo/versículo correcto |
| Biblia / favoritos, escuchar, estudiar, profundo | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Acciones circulares y destinos correctos |
| Biblia / búsqueda y concordancias | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | No inventa referencias; deep-link exacto |
| Estudio Profundo / consulta determinística | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Capas reales, sin placeholders falsos |
| Estudio Profundo / ayuda IA Gemini | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Gemini responde o falla de forma controlada |
| Estudio Profundo → guardar en Cuaderno | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F; revalidar solo si aparece regresión |
| Cuaderno / origen Biblia | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / origen Estudio Profundo | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / filtros, búsqueda y editor largo | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / offline cold-start y misma UI | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F/iPhone |
| Cuaderno / sincronización entre dispositivos | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Cuaderno / predicación correlativa | SÍ | SÍ | SÍ | SÍ | VALIDADO | Validado en FASE F |
| Ministerios / listado visible | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Admin/Pastor pueden inspeccionar; otros según membresía/visibilidad |
| Ministerio / acceso por URL directa | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | No miembro común debe ser redirigido |
| Ministerio / personalización | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Rol `lider` no basta por sí solo: requiere `es_lider` en ese ministerio |
| Ministerio / miembros | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Visibilidad y acciones según permiso |
| Solicitud de ingreso a ministerio | SÍ | SÍ | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Crear/recibir/aprobar sin duplicados |
| Solicitudes del ministerio | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Solo gestor contextual resuelve; servidor ve lo propio |
| Avisos de ministerio / lectura | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Miembro recibe lo correspondiente |
| Avisos de ministerio / creación | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Permiso de gestión contextual requerido |
| Aprobación de avisos | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Solo responsables autorizados |
| Programación ministerial / vista mensual | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Equipo y eventos correctos |
| Programación / asignar integrante por función | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Gestor contextual programa; servidor no modifica equipo ajeno |
| Programación / repertorio, tonos, enlaces, colores | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Datos persisten y llegan al evento correcto |
| Asignación / confirmar asistencia | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Solo asignado confirma su estado |
| Asignación / no puedo servir | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Estado se sincroniza en todas las superficies |
| Solicitar reemplazo | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Solicitud queda limitada al equipo correcto |
| Resolver reemplazo | SÍ | SÍ | CTX | NO | PENDIENTE DE CUENTA/DATO | Gestor contextual ve solo solicitudes autorizadas |
| Nuevo reemplazo / confirmación | CTX | CTX | CTX | SÍ | PENDIENTE DE CUENTA/DATO | Nuevo integrante queda pendiente y confirma |
| Historial de programación/reemplazos | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Editar/quitar no destruye historial aprobado |
| Solicitudes globales / contador | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Contador coincide con elementos accionables |
| Intercambios | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Lectura/acción limitada al ámbito autorizado |
| Preguntas / crear | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Pregunta personal se crea correctamente |
| Preguntas / responder/archivar | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Superficie administrativa protegida |
| Recordatorios / detalle/destino | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Abre elemento correcto desde notificación |
| Materiales compartidos / detalle | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Solo material visible/autorizado |
| Centro Pastoral / acceso por rol | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Cuenta activa + rol o permiso explícito |
| Centro Pastoral / acceso explícito a no-pastor | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | `acceso_centro_pastoral=true` funciona solo con cuenta activa |
| Pastoral / paquetes | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Datos privados del autor/alcance correcto |
| Pastoral / bosquejos | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Crear/editar/abrir según acceso |
| Pastoral / colecciones de versículos | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Asociación y navegación correctas |
| Pastoral / biblioteca | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Archivos/enlaces visibles a quien corresponde |
| Pastoral / materiales | SÍ | SÍ | CTX | CTX | PENDIENTE DE CUENTA/DATO | Publicación/lectura según permiso |
| Administración / entrada por URL | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Líder/Servidor redirigidos a Inicio |
| Administración / usuarios | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Pastor puede gestionar con límites; destrucción definitiva solo Administrador |
| Administración / ministerios | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Gestión global Pastor/Admin; destrucción definitiva solo Administrador |
| Administración / solicitudes de ministerios | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Acceso administrativo/pastoral |
| Administración / avisos | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Gestión protegida |
| Administración / preguntas | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Responder/archivar protegido |
| Administración / Ayuda Solidaria | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Gestión protegida; piloto sigue pausado |
| Administración / accesos pastorales | SÍ | CTX | NO | NO | PENDIENTE DE CUENTA/DATO | Cambios de permisos requieren especial cuidado |
| Administración / Centro de Análisis | SÍ | SÍ | NO | NO | PENDIENTE DE CUENTA/DATO | Métricas existentes cargan sin exponer datos indebidos |
| Diagnóstico IA | SÍ | NO | NO | NO | PENDIENTE DE CUENTA/DATO | Solo Administrador; errores controlados; Gemini operativo |
| Configuración administrativa | SÍ | CTX | NO | NO | PENDIENTE DE CUENTA/DATO | Solo capacidades autorizadas |
| Error boundary global | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Error recuperable sin pantalla rota |
| Loaders / transiciones | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Sin flashes de UI vieja ni bloqueos |
| PWA / actualización de service worker | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Nueva versión toma control sin perder estado |
| PWA / offline fuera del Cuaderno | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Comportamiento coherente con capacidades reales de cada módulo |
| Seguridad / URL directa sin permiso | CTX | CTX | CTX | CTX | PENDIENTE DE CUENTA/DATO | Redirección/denegación correcta, no solo ocultar botones |
| Privacidad / cambio entre dos cuentas en el mismo dispositivo | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | No aparecen notas, ministerios o datos de la cuenta anterior |
| Latencia transversal Avisos/badge/push | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Medir tiempos app-controlables vs iOS/Web Push/red |
| Warning Node `DEP0169` | SÍ | SÍ | SÍ | SÍ | PENDIENTE DE CUENTA/DATO | Identificar dependencia exacta y eliminar sin romper push |

## Evidencia estructural — Bloque 1A

Estado: **AUDITORÍA DE CÓDIGO INICIAL COMPLETADA; VALIDACIÓN INTERACTIVA PENDIENTE**.

1. `lib/supabase/middleware.ts` autentica con `getUser()` y aplica una guardia global de `estado_cuenta`: una cuenta no activa es redirigida a `/pendiente` antes de entrar a rutas privadas.
2. `app/(app)/admin/layout.tsx` bloquea por servidor las URLs administrativas para perfiles que no sean Pastor/Administrador ni Pastor General.
3. `app/actions/admin.ts` vuelve a comprobar permisos en acciones de servidor. Pastor puede realizar gestión permitida, pero no puede otorgar Administrador ni modificar otro Administrador; las eliminaciones definitivas requieren Administrador.
4. `app/(app)/ministerios/[id]/layout.tsx` exige membresía para un usuario común y usa `ministerio_miembros.es_lider` para capacidades de gestión contextual. Administrador/Pastor pueden inspeccionar aunque no sean miembros.
5. `lib/pastoral/access.ts` exige cuenta activa y concede Centro Pastoral a Pastor/Administrador o a quien tenga `acceso_centro_pastoral=true`.
6. Las regresiones de FASE E protegen por código la guardia de estado de cuenta, navegación por intención, refresco de badges, recuperación online y reanudación de Inicio/Avisos.
7. No se ha confirmado todavía un bug de guardias en esta primera pasada. Las URLs directas deben probarse con sesiones reales antes de marcarse `VALIDADO`.

## Orden de ejecución

### Bloque 1A — Guardias y mapa de permisos

1. Autenticación y estado de cuenta.
2. Guardias de Administración.
3. Rol global `lider` frente a liderazgo contextual `es_lider` por ministerio.
4. Membresía y gestión contextual de Ministerios.
5. Acceso al Centro Pastoral por rol o permiso explícito.
6. URLs directas de superficies restringidas.

### Bloque 1B — Recorrido común

1. Inicio.
2. Navegación inferior.
3. Perfil.
4. Calendario.
5. Avisos + badges.
6. Estudios/Biblia/Estudio Profundo/Cuaderno.

### Bloque 1C — Operación ministerial

1. Membresía e ingreso.
2. Avisos ministeriales.
3. Programación.
4. Confirmación/no disponibilidad.
5. Reemplazos/intercambios.
6. Contadores e historial.

### Bloque 1D — Pastoral y Administración

1. Centro Pastoral completo.
2. Administración completa.
3. Acciones destructivas y permisos sensibles se validan sin ejecutarlas sobre datos importantes salvo que exista un caso de prueba seguro.

### Bloque 1E — Transversal

1. Reconexión y reanudación.
2. Push/badges y medición de latencia.
3. Cambio de cuenta y privacidad local.
4. Error/loading/service worker.
5. `DEP0169` y dependencia Web Push.

## Reglas durante la validación

- No usar la matriz como excusa para rediseñar superficies ya aprobadas.
- Un hallazgo visual solo se convierte en bug si contradice una decisión aprobada o impide el uso correcto.
- No modificar Supabase/RLS/grants/esquema sin propuesta exacta y aprobación previa.
- No borrar datos reales para facilitar una prueba.
- No marcar `VALIDADO` por lectura de código únicamente cuando el flujo requiera interacción real.
- Conservar evidencia de validaciones anteriores y repetirlas solo si una integración posterior pudo afectarlas.
- No iniciar FASE H hasta cerrar formalmente FASE G.
