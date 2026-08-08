# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-08

Fase / prioridad activa: **PULIDO DE EXPERIENCIA — Identidad comunitaria y perfil**

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

# PRIORIDAD ACTIVA — IDENTIDAD COMUNITARIA Y PERFIL

El usuario aprobó el 2026-08-08 avanzar desde el pulido de Inicio, Ministerios y navegación hacia una experiencia más comunitaria. VIDA debe seguir siendo personalizada para cada usuario, pero también permitir reconocer a las personas reales que forman parte de la iglesia y de cada equipo de servicio.

## Objetivo inmediato

Convertir el perfil en la identidad comunitaria reutilizable del usuario, comenzando por una foto opcional y optimizada que pueda verse de forma consistente en las superficies donde una persona aparece ante otros miembros.

## Alcance autorizado

1. Mantener `profiles.avatar_url` como referencia única de la foto activa del usuario.
2. Usar un bucket `avatars` independiente de los archivos ministeriales y pastorales.
3. Limitar el avatar almacenado a una sola imagen activa por persona, reemplazando la anterior y evitando acumulación.
4. Optimizar la imagen en el dispositivo antes de subirla; objetivo inicial: recorte cuadrado, 512×512, WebP y máximo 512 KB almacenados.
5. Permitir que cada usuario escriba, reemplace o elimine únicamente su propio avatar mediante RLS.
6. Mostrar la identidad visual primero en Perfil y Miembros del ministerio; después de validación, reutilizarla en Inicio, Contactos y otras superficies comunitarias.
7. Conservar la privacidad ya aprobada: un servidor normal puede reconocer a sus compañeros, pero los datos de contacto siguen sujetos a permisos de liderazgo/pastoral existentes.
8. No modificar roles, liderazgo, membresías ni permisos administrativos para implementar la identidad visual.
9. Mantener diseño móvil premium, safe areas, navegación inferior y patrones de regreso ya aprobados.
10. Verificar build y producción antes de declarar cada bloque terminado.

## Criterio de cierre de esta prioridad

- cada usuario puede poner, reemplazar y quitar su foto sin almacenar originales innecesarios;
- el avatar se muestra correctamente en su perfil y en la lista de miembros del ministerio;
- cuando no existe foto se conserva un fallback visual limpio con inicial;
- no se exponen datos de contacto adicionales a servidores normales;
- Storage queda limitado y protegido por RLS;
- build y producción quedan aprobados;
- el usuario valida visualmente el resultado en iPhone.

## Siguiente paso después de esta prioridad

Una vez validada la identidad comunitaria, extender el avatar de manera controlada a Inicio/Contactos y entrar al bloque transversal de **Notificaciones y badges reales**, reutilizando nombre y foto cuando la notificación represente una acción de una persona.

# PRIORIDAD CERRADA — PULIDO DE EXPERIENCIA / CALENDARIO E INICIO

El pulido de entrada, Calendario, Inicio, Ministerios y navegación móvil quedó estabilizado durante las validaciones del 2026-08-07 y 2026-08-08. El Calendario conserva su base móvil aprobada y no debe degradarse. Los ajustes posteriores se limitaron a Inicio/Dashboard, solicitudes de ministerio, permisos de miembros, safe areas y navegación de regreso.

Evidencia reciente:

- `3f9b42e` — `feat(inicio): priorizar solicitudes, avisos y acceso directo a eventos`;
- `62f1e8e` — `fix(ministerios): mostrar solicitudes de ingreso al líder`;
- `78d3952` — `fix(ministerios): ajustar herramientas y navegación por rol`;
- `9036ed4` — `fix(navegacion): añadir regreso en pantallas secundarias`.

La navegación habitual continúa funcionando por rol y permisos existentes. No reabrir este bloque salvo bug comprobable.

# SIGUIENTE BLOQUE PROPUESTO — RECORRIDO GUIADO POR SECCIONES

Estado: **DOCUMENTADO, POSPUESTO HASTA CERRAR IDENTIDAD COMUNITARIA Y NOTIFICACIONES PRIORITARIAS**.

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

1. Implementar avatar optimizado y reemplazable desde Perfil.
2. Mostrar avatar/fallback en Miembros sin ampliar visibilidad de datos privados.
3. Validar Storage, RLS, build y producción.
4. Solicitar validación visual del usuario en iPhone.
5. Tras aprobación, extender identidad a Inicio/Contactos y continuar con Notificaciones y badges reales.

No reanudar el piloto operativo, FASE D, FASE E, FASE F ni el recorrido guiado mientras este bloque de identidad comunitaria siga activo.