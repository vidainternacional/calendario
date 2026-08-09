# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-09

Fase / prioridad activa: **PULIDO DE EXPERIENCIA — Administración: control y eliminación permanente**

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
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **EN PAUSA OPERATIVA — BLOQUE 5 CONSERVADO** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDAD ACTIVA — ADMINISTRACIÓN: CONTROL Y ELIMINACIÓN PERMANENTE

El usuario pausó temporalmente las pruebas finales de notificaciones el 2026-08-09 y priorizó convertir Administración en un centro de control real. El primer objetivo es permitir que un Administrador pueda eliminar definitivamente usuarios y ministerios cuando lo decida, sin confundir esta acción con suspender/desactivar.

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

## Criterio de cierre

- Administrador puede borrar permanentemente un usuario de prueba no protegido y desaparece de Auth/perfiles/listados;
- Administrador puede borrar permanentemente un ministerio de prueba cuando sus relaciones permiten eliminación segura;
- cuenta principal y autoeliminación quedan protegidas;
- Pastor/Líder/Servidor no pueden ejecutar ni visualizar la acción destructiva;
- errores de integridad no producen eliminación parcial;
- build y producción quedan READY;
- el usuario valida el flujo antes de pasar al rediseño completo del panel.

# PRIORIDAD EN PAUSA — NOTIFICACIONES Y BADGES REALES

Pausada temporalmente el 2026-08-09 por decisión explícita del usuario antes de ejecutar las pruebas finales en iPhone. No reiniciar esas pruebas ni avanzar aprobación/rechazo hasta que el usuario reactive este bloque.

El usuario aprobó el 2026-08-08 continuar desde la identidad comunitaria hacia una lógica transversal de elementos pendientes y no leídos. VIDA ya cuenta con lectura real de avisos, suscripciones push, preferencias por ministerio, App Badge y contadores de solicitudes de ingreso; el objetivo es consolidarlos sin inventar cifras ni construir fuentes paralelas innecesarias.

## Objetivo conservado

Crear una fuente coherente de estado pendiente para cada usuario y reutilizarla en badges, Inicio, navegación y notificaciones push cuando corresponda, manteniendo cada contador derivado del estado real en Supabase.

## Alcance conservado

1. Reutilizar `publicacion_lecturas` y las RPC existentes para avisos no leídos; no reemplazar su lógica por contadores locales.
2. Reutilizar `ministerio_solicitudes_ingreso` para pendientes visibles únicamente a líderes/pastores/administradores con permisos reales.
3. Auditar y reutilizar `push_subscriptions`, `notificaciones_preferencias` y `notificaciones_enviadas` antes de crear nuevas tablas.
4. Consolidar en una capa común los contadores que hoy se consultan de forma separada, evitando que Inicio, navegación y módulos muestren números distintos para el mismo estado.
5. Mantener el badge de Avisos como contador real de publicaciones visibles no leídas.
6. Mantener los badges de solicitudes de ingreso en el ministerio correspondiente y permitir que el estado transversal los incorpore para usuarios con liderazgo.
7. Incorporar otros pendientes solo cuando exista una definición inequívoca de “requiere acción” o “no leído” en sus datos; no convertir estados informativos en notificaciones arbitrarias.
8. El App Badge del dispositivo debe representar elementos pendientes reales definidos por esta prioridad, sin dobles conteos.
9. Cuando una notificación represente una acción de una persona, reutilizar nombre y `avatar_url` de la identidad comunitaria cuando la plataforma lo permita.
10. Las notificaciones push deben abrir directamente la superficie relacionada y respetar roles/RLS; no enviar datos sensibles en el cuerpo del push.
11. Mantener navegación, safe areas, diseño móvil premium y componentes ya aprobados.
12. Verificar TypeScript/build y producción agrupando cambios; evitar deployments de prueba innecesarios.

## Estado implementado de notificaciones

- `6a1ce22` consolidó Avisos no leídos y solicitudes de ingreso gestionables en una fuente transversal de badges reales.
- `notificaciones_enviadas` se reutiliza como control único por `tipo + referencia_id + profile_id`, evitando reenvíos duplicados al mismo usuario.
- los pushes de Avisos apuntan a una ficha directa `/avisos/[id]`, protegida por RLS y marcada como leída al abrirse.
- una nueva solicitud de ingreso genera push únicamente a líderes reales del ministerio que mantengan activas sus notificaciones; el push abre directamente `/ministerios/[id]/solicitudes-ingreso`.
- el cuerpo del push de ingreso no expone identidad ni datos sensibles en la pantalla bloqueada.
- el service worker ya soportaba navegación por `payload.url` y no fue modificado.
- commit funcional del bloque: `41353b4` — `feat(notificaciones): conectar push a destinos directos`.

## Pendiente al reactivar

1. Validar en iPhone un Aviso push → ficha exacta.
2. Validar solicitud de ingreso → pantalla de revisión del ministerio.
3. Conectar aprobación/rechazo al usuario solicitante sin crear contadores artificiales.
4. Auditar las demás acciones que ya generan push y aplicar destino directo solo cuando exista una superficie inequívoca.

# PRIORIDAD CERRADA — IDENTIDAD COMUNITARIA Y PERFIL

Cerrada el 2026-08-08 tras validación del usuario y despliegue de la versión final de encuadre en producción.

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
- privacidad de datos de contacto permanece sujeta a permisos existentes.

Evidencia reciente:

- `71d2980` — `feat(perfil): extender identidad comunitaria y editor de foto`;
- `7c932a2` — `fix(perfil): conservar foto completa y separar encuadre`;
- `fab9b1c` — `fix(perfil): optimizar fotos de avatar de forma adaptativa`;
- `b7ac858` — `fix(perfil): simplificar encuadre de avatar sin zoom`;
- `817ffa3` — `fix(perfil): conservar proporción exacta al reencuadrar avatar` — READY / Production.

# PRIORIDAD CERRADA — PULIDO DE EXPERIENCIA / CALENDARIO E INICIO

El pulido de entrada, Calendario, Inicio, Ministerios y navegación móvil quedó estabilizado durante las validaciones del 2026-08-07 y 2026-08-08. El Calendario conserva su base móvil aprobada y no debe degradarse. Los ajustes posteriores se limitaron a Inicio/Dashboard, solicitudes de ministerio, permisos de miembros, safe areas y navegación de regreso.

Evidencia reciente:

- `3f9b42e` — `feat(inicio): priorizar solicitudes, avisos y acceso directo a eventos`;
- `62f1e8e` — `fix(ministerios): mostrar solicitudes de ingreso al líder`;
- `78d3952` — `fix(ministerios): ajustar herramientas y navegación por rol`;
- `9036ed4` — `fix(navegacion): añadir regreso en pantallas secundarias`;
- `33e2894` — `fix(inicio): corregir tipado de acceso directo a evento` — acceso Inicio → Evento directo estable en producción.

La navegación habitual continúa funcionando por rol y permisos existentes. No reabrir este bloque salvo bug comprobable.

# SIGUIENTE BLOQUE PROPUESTO — RECORRIDO GUIADO POR SECCIONES

Estado: **DOCUMENTADO, POSPUESTO HASTA CERRAR LAS PRIORIDADES DE ADMINISTRACIÓN Y NOTIFICACIONES**.

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

# FASE D — ESTADO CONSERVADO EN PAUSA

La FASE D permanece detenida en **Bloque 5 — Cronologías y Mapas**.

Estado preservado:

- esquema de lugares, periodos, eventos y relaciones aplicado con RLS;
- paquete `rome-pilot-v1` publicado y aprobado;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones habilitados;
- interfaz todavía no conectada;
- Bloque 6 no iniciado.

Cuando este documento reactive FASE D, el siguiente punto será integrar el servicio de cronologías y mapas en una superficie visual limitada a Roma. No ampliar el catálogo antes de validar ese piloto.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Evidencia histórica reciente del Calendario

- contrato visual de fechas y eventos aprobado durante el pulido anterior;
- icono inferior de Calendario refinado en commit `f7eda6c5c78e66ac09a21da5a15274745b2fa3e1`;
- primera transición Año → Mes con spring implementada en commit `d3ba0c2e04ec01f7695dd637c8451275c955b52f`;
- las iteraciones posteriores dejaron una base móvil estable, conservada como comportamiento aprobado.

# Siguiente punto autorizado

1. Verificar build y producción de eliminación permanente.
2. Probar con un usuario de prueba no protegido y un ministerio de prueba.
3. Confirmar que Pastor/Líder/Servidor no ven ni pueden ejecutar eliminación permanente.
4. Una vez estable, iniciar el rediseño compacto del panel de Administración con métricas navegables, Analytics y eliminación de duplicidades.

No reanudar Notificaciones, piloto operativo, FASE D, FASE E, FASE F ni el recorrido guiado mientras esta prioridad administrativa siga activa.