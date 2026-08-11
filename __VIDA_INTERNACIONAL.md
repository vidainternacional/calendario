# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-11

Fase / prioridad activa: **FASE D — BLOQUE 5: CRONOLOGÍAS Y MAPAS**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro técnico acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

La evidencia del piloto operativo iniciado el 2026-08-04 se conserva en:

- `docs/PILOTO_IGLESIA_ACTIVO_2026-08-04.md`;
- `docs/MANUAL_PILOTO_POR_ROLES_2026-08-04.md`;
- `docs/PILOTO_P1_PRODUCCION_Y_CALENDARIO_2026-08-04.md`.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la prioridad activa.
2. No reanudar una fase o prioridad en pausa mientras este documento no lo autorice expresamente.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar el bloque activo.
5. No borrar datos, migraciones o estructuras de una fase pausada cuando basta con desactivar su experiencia visible.
6. Los cambios de permisos, roles, liderazgo o datos sensibles requieren una decisión explícita y recuperación definida.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **ACTIVA — BLOQUE 5: CRONOLOGÍAS Y MAPAS** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDAD CERRADA — PROGRAMACIÓN MINISTERIAL: ALABANZA Y EQUIPOS DE SERVICIO

Cerrada el 2026-08-11 tras validación funcional del usuario, endurecimiento de permisos de reemplazos, protección del historial y despliegue READY en producción.

Estado consolidado del cierre:

- capacidades ministeriales y responsabilidades especiales conectadas a la ficha de miembro;
- programación mensual reutiliza eventos reales del Calendario y no crea un calendario paralelo;
- asignaciones por función conservan estados válidos al editar el equipo;
- repertorio, enlaces y paleta permanecen vinculados al servicio;
- dashboard del músico muestra función, preparación y estado;
- confirmación, no disponibilidad, solicitud de reemplazo y resolución por liderazgo operan de extremo a extremo;
- candidatos de reemplazo se limitan por ministerio, capacidad y disponibilidad;
- historial de reemplazos se consulta desde botón independiente `Historial` en sheet/modal y no se mezcla con solicitudes pendientes;
- las acciones de edición/quitar función bloquean el borrado de una asignación cuando destruiría historial relacionado;
- RLS de `intercambios` fue endurecida para que un servidor común no pueda leer ni modificar solicitudes abiertas ajenas por `destinatario_id IS NULL`;
- Administrador/Pastor conservan acceso autorizado global y Líder queda restringido a los ministerios que lidera;
- índice único parcial evita dos solicitudes pendientes simultáneas para la misma asignación;
- migración versionada: `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`;
- commits finales del cierre: `4d63d04`, `19fed817` y `251ce679`;
- `main` y producción quedaron alineados en `251ce679ad7845ca3f4e330697bf1ce2772edcd5`;
- build y producción Vercel quedaron READY;
- el usuario confirmó el 2026-08-11 que el flujo está correcto y autorizó avanzar.

El motor queda preparado para reutilizarse posteriormente en Fotografía, Kids, Multimedia y otros ministerios. No ampliar ahora este bloque salvo bug comprobable.

# PRIORIDAD CERRADA — ADMINISTRACIÓN: CONTROL Y ELIMINACIÓN PERMANENTE

Cerrada el 2026-08-09 tras validar eliminación permanente, panel administrativo modular, fichas de usuario, Centro de Análisis, navegación de Administración y gestión de Avisos.

El usuario pausó temporalmente las pruebas finales de notificaciones el 2026-08-09 y priorizó convertir Administración en un centro de control real. El primer objetivo fue permitir que un Administrador pudiera eliminar definitivamente usuarios y ministerios cuando lo decidiera, sin confundir esta acción con suspender/desactivar.

## Objetivo inmediato

Dar al rol `administrador` control explícito y seguro sobre eliminación permanente, conservando protecciones críticas y evitando operaciones parciales o ambiguas.

## Alcance autorizado

1. Solo `administrador` puede ejecutar eliminación permanente.
2. Usuario: eliminar la cuenta real de Supabase Auth, no únicamente `profiles`.
3. Proteger la cuenta administradora principal y bloquear la autoeliminación accidental desde la sesión activa.
4. Limpiar avatar del usuario de forma best-effort después de borrar correctamente la cuenta.
5. Ministerio: permitir `DELETE` real además de activar/desactivar.
6. Si una FK o dato histórico impide eliminar un ministerio, cancelar la operación completa y explicar el bloqueo; no dejar borrados parciales.
7. Toda acción destructiva requiere confirmación fuerte escrita (`ELIMINAR`).
8. La acción destructiva debe estar dentro de la ficha/modal correspondiente, separada visualmente de las acciones habituales.
9. Después de estabilizar la eliminación permanente, rediseñar el dashboard administrativo con accesos directos desde métricas superiores, Analytics visible y eliminación de herramientas duplicadas.
10. Mantener mobile first, safe areas, jerarquía premium y no degradar permisos o módulos aprobados.
11. Verificar TypeScript/build y producción antes de probar borrados reales.

## Estado implementado del bloque

- `createAdminClient()` ya existía con `SUPABASE_SERVICE_ROLE_KEY` y se reutiliza exclusivamente en servidor.
- acción `eliminarUsuarioDefinitivamente()` exige Administrador, bloquea autoeliminación y protege el superadministrador; usa Supabase Auth Admin para borrar la cuenta real.
- acción `eliminarMinisterioDefinitivamente()` exige Administrador y ejecuta un borrado real atómico; si la base lo bloquea por integridad referencial no elimina parcialmente.
- la ficha de usuario muestra la zona destructiva solo al Administrador y exige escribir `ELIMINAR`.
- la ficha de edición de ministerio muestra la zona destructiva solo al Administrador y exige escribir `ELIMINAR`.
- Administración cuenta con accesos dedicados a Usuarios, Ministerios, Solicitudes, Avisos, Buzón, Análisis, Ayuda Solidaria, Accesos pastorales y Configuración.
- Centro de Análisis quedó validado visualmente en móvil.
- Avisos dispone de superficie administrativa propia con navegación de regreso.
- ficha administrativa del usuario incorpora identidad, rol, estado, actividad, ministerios, liderazgos y ficha integral de miembro.

## Criterio de cierre

- Administrador puede borrar permanentemente un usuario de prueba no protegido y desaparece de Auth/perfiles/listados;
- Administrador puede borrar permanentemente un ministerio de prueba cuando sus relaciones permiten eliminación segura;
- cuenta principal y autoeliminación quedan protegidas;
- Pastor/Líder/Servidor no pueden ejecutar ni visualizar la acción destructiva;
- errores de integridad no producen eliminación parcial;
- build y producción quedan READY;
- el usuario validó el flujo y el panel administrativo antes de pasar a la siguiente prioridad.

# PRIORIDAD CERRADA — NOTIFICACIONES Y BADGES REALES

Cerrada el 2026-08-11 tras validación funcional en iPhone del flujo push, destinos directos, solicitudes de ingreso, bienvenida ministerial y badges derivados de estado real.

El usuario aprobó el 2026-08-08 continuar desde la identidad comunitaria hacia una lógica transversal de elementos pendientes y no leídos. VIDA ya contaba con lectura real de avisos, suscripciones push, preferencias por ministerio, App Badge y contadores de solicitudes de ingreso; el bloque consolidó esas fuentes sin inventar cifras ni construir contadores paralelos.

## Estado consolidado del cierre

- `6a1ce22` consolidó Avisos no leídos y solicitudes de ingreso gestionables en una fuente transversal de badges reales;
- `notificaciones_enviadas` se reutiliza como control único por `tipo + referencia_id + profile_id`, evitando reenvíos duplicados al mismo usuario;
- los pushes de Avisos apuntan a una ficha directa `/avisos/[id]`, protegida por RLS y marcada como leída al abrirse;
- una nueva solicitud de ingreso genera push únicamente a líderes reales del ministerio que mantengan activas sus notificaciones y abre `/ministerios/[id]/solicitudes-ingreso`;
- aprobar o rechazar una solicitud de ingreso notifica al solicitante sin crear contadores artificiales y abre el ministerio correspondiente;
- la bienvenida de ingreso se presenta como modal glass centrado sobre el dashboard, con fondo inmóvil y explicación breve de las herramientas ministeriales;
- el badge de Avisos representa exclusivamente publicaciones visibles no leídas; los servicios pendientes no se mezclan en ese contador;
- el App Badge general conserva el total transversal de elementos que requieren atención sin dobles conteos;
- confirmar/no poder servir/solicitar reemplazo/resolver reemplazo/aprobar o rechazar ingreso disparan refresco explícito de indicadores;
- al recibir un push con VIDA abierta, el service worker avisa al cliente para recalcular indicadores sin esperar únicamente al polling;
- el botón de regreso de un Aviso abierto desde push retorna de forma explícita a Inicio;
- los encabezados de subpáginas ministeriales reservan un espacio seguro común bajo los controles flotantes;
- Avisos permite seleccionar identidad visible del remitente: nombre personal, ministerio, `Líder de [Ministerio]`, etiqueta personalizada o VIDA Internacional cuando el permiso lo permite;
- la identidad elegida se conserva en push, listado y detalle;
- migración aditiva versionada para etiquetas de remitente: `supabase/migrations/20260811144500_remitente_personalizado_avisos.sql`;
- build, TypeScript y producción quedaron READY en `48efda443e719279fac267e64931b1c5f36e8a07`;
- el usuario confirmó que pushes, apertura y funcionamiento general son correctos y autorizó avanzar.

## Pendiente transversal diferido a optimización final

La actualización visual de algunos badges puede mostrar latencia ocasional aunque el estado termine corrigiéndose. La lógica funcional queda validada; la optimización final deberá medir y reducir latencia entre Supabase, refresco/revalidación del cliente, segundo plano de la PWA, service worker, red y comportamiento de iOS, evitando parches aislados por pantalla.

# PRIORIDAD CERRADA — IDENTIDAD COMUNITARIA Y PERFIL

Cerrada el 2026-08-08 tras validación del usuario y despliegue de la versión final de encuadre en producción. La ficha integral de miembro fue ampliada el 2026-08-09.

Estado consolidado:

- `profiles.avatar_url` es la referencia única de la identidad visual activa y del encuadre;
- bucket `avatars` separado, protegido por RLS y limitado a una fotografía completa optimizada por usuario;
- `avatars/source.webp` reemplaza la fotografía anterior en lugar de acumular archivos;
- optimización adaptativa conserva proporción y limita almacenamiento a 512 KB;
- el usuario puede reemplazar, quitar y reencuadrar la fotografía guardada sin subir otra imagen para cada ajuste;
- editor sin zoom adicional: únicamente desplazamiento horizontal/vertical sobre la fotografía proporcional;
- preview grande muestra la fotografía completa;
- avatar reutilizado en Inicio, Perfil, Miembros, Contactos, Avisos y demás superficies comunitarias implementadas;
- fallback con inicial cuando no existe fotografía;
- privacidad de datos de contacto permanece sujeta a permisos existentes;
- `member_profile_details` conserva datos ampliados voluntarios de cada miembro con RLS;
- Mi Perfil permite completar datos personales, contacto de emergencia, vida espiritual, profesión, disponibilidad, habilidades y formación;
- Administración puede consultar esa ficha integral sin duplicar los datos.

Evidencia reciente:

- `71d2980` — `feat(perfil): extender identidad comunitaria y editor de foto`;
- `7c932a2` — `fix(perfil): conservar foto completa y separar encuadre`;
- `fab9b1c` — `fix(perfil): optimizar fotos de avatar de forma adaptativa`;
- `b7ac858` — `fix(perfil): simplificar encuadre de avatar sin zoom`;
- `817ffa3` — `fix(perfil): conservar proporción exacta al reencuadrar avatar` — READY / Production;
- `f6d8d25` — `feat(perfil): crear ficha integral de miembro`;
- `2795175` — `fix(perfil): pulir ficha de miembro y lenguaje visual` — READY / Production.

# PRIORIDAD CERRADA — PULIDO DE EXPERIENCIA / CALENDARIO E INICIO

El pulido de entrada, Calendario, Inicio, Ministerios y navegación móvil quedó estabilizado durante las validaciones del 2026-08-07, 2026-08-08 y cierre final del 2026-08-09. El Calendario conserva su base móvil aprobada y no debe degradarse. Los ajustes posteriores se limitaron a Inicio/Dashboard, solicitudes de ministerio, permisos de miembros, safe areas, navegación de regreso y consistencia de Ayuda Solidaria.

Evidencia reciente:

- `3f9b42e` — `feat(inicio): priorizar solicitudes, avisos y acceso directo a eventos`;
- `62f1e8e` — `fix(ministerios): mostrar solicitudes de ingreso al líder`;
- `78d3952` — `fix(ministerios): ajustar herramientas y navegación por rol`;
- `9036ed4` — `fix(navegacion): añadir regreso en pantallas secundarias`;
- `33e2894` — `fix(inicio): corregir tipado de acceso directo a evento` — acceso Inicio → Evento directo estable en producción;
- `1ab70fe` — `fix(fase-a): cerrar consistencia móvil final` — READY / Production.

La navegación habitual continúa funcionando por rol y permisos existentes. No reabrir este bloque salvo bug comprobable.

# SIGUIENTE BLOQUE PROPUESTO — RECORRIDO GUIADO POR SECCIONES

Estado: **DOCUMENTADO, POSPUESTO HASTA CERRAR LA FASE ACTIVA Y LAS PRIORIDADES EN PAUSA QUE CORRESPONDAN**.

Cuando corresponda, se construirá un recorrido de primera entrada que explique la aplicación por secciones.

Principios ya definidos:

- se mostrará a una persona en su primera entrada;
- explicará para qué sirve cada sección y qué acciones puede realizar según su rol;
- será recorrible por partes, evitando bloquear toda la aplicación con un único onboarding largo;
- podrá repetirse manualmente desde un punto de ayuda o perfil;
- la misma fuente estructurada de contenidos servirá para generar posteriormente el manual escrito de VIDA;
- el recorrido no dependerá del antiguo modo piloto ni de una cohorte de prueba.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

El piloto no se elimina de la base técnica. Se conserva para una futura reactivación controlada.

Se preserva:

- tablas de participantes, onboarding, eventos mínimos de uso y reportes;
- migraciones y políticas RLS;
- Centro de Análisis y código asociado;
- datos ya generados;
- Ayuda Solidaria, que es una función operativa independiente y no debe borrarse por pausar el piloto;
- evidencia técnica y manuales existentes.

Mientras esté en pausa:

- no debe aparecer onboarding automático del piloto;
- no debe ejecutarse telemetría exclusiva del piloto en la navegación normal;
- no debe bloquearse una sesión por pertenencia o estado de la cohorte;
- no avanzar P1, P2 ni P3;
- no modificar roles o liderazgo para completar una cohorte.

## Estado conservado del piloto

P1 había alcanzado producción con infraestructura de análisis, onboarding, selección de participantes, reporte de problemas y Ayuda Solidaria. La cohorte inicial contenía 1 administrador y 2 servidores. Faltaba validar una cuenta independiente de líder o pastor y completar pruebas reales por rol.

La reactivación futura deberá comenzar desde ese estado conservado, no desde cero.

# FASE D — ACTIVA — BLOQUE 5: CRONOLOGÍAS Y MAPAS

Reactivada el 2026-08-11 después del cierre formal de Notificaciones y Badges Reales. Continuar desde el estado conservado; no reiniciar Bloques 1–4 ni ampliar todavía el catálogo.

Estado preservado:

- esquema de lugares, periodos, eventos y relaciones aplicado con RLS;
- paquete `rome-pilot-v1` publicado y aprobado;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones habilitados;
- interfaz todavía no conectada;
- Bloque 6 no iniciado.

## Punto activo autorizado

Integrar el servicio de cronologías y mapas en una superficie visual limitada exclusivamente al piloto de **Roma**. Validar primero datos, servicio existente, permisos, interacción móvil y lenguaje visual antes de ampliar lugares, periodos o eventos. No iniciar Bloque 6 hasta cerrar formalmente este piloto visual.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Evidencia histórica reciente del Calendario

- contrato visual de fechas y eventos aprobado durante el pulido anterior;
- icono inferior de Calendario refinado en commit `f7eda6c5c78e66ac09a21da5a15274745b2fa3e1`;
- primera transición Año → Mes con spring implementada en commit `d3ba0c2e04ec01f7695dd637c8451275c955b52f`;
- las iteraciones posteriores dejaron una base móvil estable, conservada como comportamiento aprobado.

# Siguiente punto autorizado

1. Revisar el servicio y datos reales de `rome-pilot-v1` sin modificar fuentes aprobadas.
2. Identificar la superficie actual de Biblia/Estudios donde encaja el piloto sin degradar interfaces aprobadas.
3. Integrar una primera visualización limitada a Roma con cronología y mapa usando exclusivamente los datos habilitados.
4. Verificar móvil, permisos, estados vacíos y build/Preview antes de cualquier ampliación del catálogo.

No reanudar piloto operativo, FASE E, FASE F ni el recorrido guiado mientras FASE D — Bloque 5 siga activa.