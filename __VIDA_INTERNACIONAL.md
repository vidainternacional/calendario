# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-09

Fase / prioridad activa: **PROGRAMACIÓN MINISTERIAL — ALABANZA Y EQUIPOS DE SERVICIO**

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

# PRIORIDAD ACTIVA — PROGRAMACIÓN MINISTERIAL: ALABANZA Y EQUIPOS DE SERVICIO

Activada el 2026-08-09 por decisión explícita del usuario después del cierre del pulido móvil y de la ficha integral de miembros.

El objetivo es convertir la organización de servidores en un flujo operativo real dentro de VIDA, comenzando por Alabanza y reutilizando los eventos existentes del Calendario. No se debe crear un calendario paralelo.

## Objetivo inmediato

Permitir que Administración defina capacidades y responsabilidades, que el liderazgo de Alabanza programe mensualmente a los músicos por servicio y que cada persona asignada reciba repertorio, paleta de colores y un flujo claro para confirmar, rechazar o solicitar cambio.

## Alcance autorizado

1. Crear un catálogo reutilizable de capacidades ministeriales por persona y ministerio, por ejemplo guitarra, bajo, batería, teclado, voz, fotografía, dirección y otras funciones configurables.
2. Permitir al Administrador asignar, modificar o retirar capacidades ministeriales cuando lo necesite.
3. Diferenciar capacidades de responsabilidades especiales. Una responsabilidad no debe convertir automáticamente a la persona en líder del ministerio.
4. Implementar como primer caso una responsabilidad especial `Gestión de paleta de colores para Alabanza`, asignable a una persona autorizada aunque pertenezca a Fotografía u otro ministerio.
5. Vincular toda programación de servicio a un `evento` real del Calendario existente; no duplicar fechas ni crear otro calendario.
6. Dar al líder de Alabanza una vista mensual de servicios/eventos donde pueda asignar músicos según sus capacidades.
7. Registrar la función concreta de cada persona en cada servicio: guitarra, bajo, batería, teclado, voz, dirección u otra capacidad válida.
8. Permitir repertorio por servicio con título de canción, tonalidad, enlace externo y notas de preparación.
9. Permitir a la persona con responsabilidad de paleta publicar colores, referencia visual y observaciones para un servicio específico.
10. Mostrar repertorio y paleta únicamente a las personas que deban verlo por asignación o permiso.
11. Crear un dashboard del músico con próximo servicio, función, estado de confirmación, repertorio, enlaces, paleta y vista de sus próximas asignaciones del mes.
12. Estados operativos mínimos de asignación: `pendiente`, `confirmado`, `no_disponible` y flujo de `solicitud_de_cambio`.
13. Cuando una persona solicite cambio, priorizar candidatos del mismo ministerio con capacidad compatible; el líder conserva la decisión final.
14. Mantener historial de sustituciones y cambios de estado para evitar perder quién estaba asignado originalmente.
15. Reutilizar las estructuras existentes de eventos, asignaciones, membresías, liderazgo e intercambio siempre que sean compatibles antes de crear tablas nuevas.
16. Diseñar el motor para reutilizarse posteriormente en Fotografía, Kids, Multimedia y otros ministerios sin codificar Alabanza como una excepción rígida.
17. Mantener permisos: Administrador transversal; líder limitado a su ministerio salvo una responsabilidad especial explícita; servidor solo ve y responde a sus asignaciones.
18. No incorporar todavía nuevas notificaciones push hasta estabilizar el flujo funcional; la prioridad de Notificaciones permanece en pausa.
19. Mantener mobile first, safe areas y componentes aprobados, pero el objetivo principal de este bloque es funcional. El pulido visual fino se realizará después de validar el flujo completo.
20. Agrupar migraciones y cambios de producción para evitar deployments de prueba innecesarios.

## Orden de implementación autorizado

1. Auditar tablas, migraciones y acciones existentes relacionadas con capacidades, asignaciones, intercambios y eventos para evitar duplicación.
2. Implementar el modelo de capacidades ministeriales y responsabilidades especiales.
3. Conectar Administración → ficha de usuario para asignar capacidades y responsabilidades.
4. Construir la programación mensual de Alabanza sobre eventos reales del Calendario.
5. Incorporar repertorio y enlaces por servicio.
6. Incorporar publicación de paleta de colores por persona autorizada.
7. Construir dashboard del músico y estados de confirmación.
8. Conectar solicitud de cambio, candidatos compatibles, aprobación del líder e historial.
9. Validar el flujo completo con un servicio real de prueba antes de ampliar a otros ministerios.

## Criterio de cierre

- Administrador puede asignar capacidades y responsabilidades especiales desde la ficha de un miembro;
- líder de Alabanza puede programar músicos por evento/servicio sin duplicar el Calendario;
- repertorio y enlaces quedan vinculados al servicio;
- responsable autorizado puede publicar la paleta para ese servicio;
- músico asignado ve en su dashboard función, repertorio, paleta y estado;
- músico puede confirmar, indicar que no puede servir o solicitar cambio;
- líder puede resolver el reemplazo con una persona de capacidad compatible;
- el historial conserva los cambios;
- permisos impiden gestionar ministerios ajenos sin autorización explícita;
- build y producción quedan READY;
- el usuario valida el flujo completo antes de ampliar el motor a otros ministerios o iniciar el pulido visual final.

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

Estado: **DOCUMENTADO, POSPUESTO HASTA CERRAR LA PRIORIDAD ACTIVA Y LAS PRIORIDADES EN PAUSA QUE CORRESPONDAN**.

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

1. Auditar el esquema y las migraciones existentes de capacidades, asignaciones, eventos e intercambios.
2. Definir el modelo mínimo reutilizable de capacidades ministeriales y responsabilidades especiales sin duplicar estructuras existentes.
3. Conectar la primera gestión desde Administración → ficha de usuario.
4. Verificar migración, permisos y build antes de construir la programación mensual de Alabanza.

No reanudar Notificaciones, piloto operativo, FASE D, FASE E, FASE F ni el recorrido guiado mientras la prioridad de Programación Ministerial siga activa.