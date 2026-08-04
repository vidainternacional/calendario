# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-04

Fase activa: **PILOTO OPERATIVO — Preparación para pruebas reales en la iglesia**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro detallado acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la prioridad activa.
2. No reanudar una fase en pausa ni iniciar una fase posterior mientras este documento no lo autorice expresamente.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar el bloque activo.
5. No declarar una función lista para el piloto sin build aprobado y validación en producción.
6. Los cambios de permisos, datos sensibles o producción requieren validación aislada y recuperación definida.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **EN PAUSA OPERATIVA — BLOQUE 5 CONSERVADO** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDAD ACTIVA — PILOTO OPERATIVO EN LA IGLESIA

El usuario autorizó el 2026-08-04 pausar temporalmente la ampliación de IA Bíblica Avanzada para preparar VIDA para una prueba real con pastores, líderes y servidores seleccionados.

## Objetivo

Validar VIDA con personas reales antes de ampliar funciones, midiendo adopción, permisos, facilidad de uso, notificaciones y recorridos operativos completos.

## Alcance autorizado

- Centro de Análisis del piloto.
- Selección explícita de participantes.
- Recorrido inicial diferente para administrador, pastor, líder, servidor y congregante.
- Activación y validación de notificaciones push.
- Pruebas completas de calendario, asignaciones, avisos, ministerios e intercambios.
- Reporte de problemas desde Perfil.
- Clasificación de incidencias como nuevas, en revisión o resueltas.
- Textos de ejemplo que desaparecen al escribir y nunca se guardan automáticamente.
- Manuales y tareas de prueba por jerarquía.
- Validación en iPhone y Android.

## Fuera de alcance durante el piloto

- Reanudar Cronologías y Mapas.
- Avanzar al Bloque 6 de IA bíblica.
- Ampliar el corpus bíblico o conectar datos textuales a proveedores de IA.
- Crear un segundo cuaderno separado de Biblia → Notas.
- Auditoría global de rendimiento o seguridad correspondiente a la FASE E, salvo un riesgo crítico que bloquee el piloto.
- Registrar contenido privado para fines analíticos.

## Privacidad de la analítica

La analítica del piloto puede registrar únicamente:

- inicio de una sesión piloto;
- pantalla o ruta visitada;
- finalización del recorrido inicial;
- estado de activación de notificaciones;
- acciones operativas agregadas y no sensibles;
- reportes enviados voluntariamente.

No debe registrar:

- contraseñas;
- contenido de notas bíblicas;
- búsquedas o textos bíblicos privados;
- contenido pastoral;
- mensajes escritos en formularios;
- contenido de conversaciones;
- información de otras personas que no sea necesaria para la operación.

## Permisos que deben conservarse

### Administrador y pastor

- Gestión global según las reglas existentes.
- Acceso al Centro de Análisis.
- Selección de participantes del piloto.
- Revisión y clasificación de reportes.

### Líder

- Administración únicamente de los ministerios donde figura como líder.
- Creación de eventos y avisos dentro de esos ministerios.
- Sin acceso al análisis global.

### Servidor y congregante

- Consulta y participación según membresía y asignaciones.
- Sin creación de eventos, publicación administrativa, gestión de miembros ni aprobación de solicitudes.

## Bloques del piloto

### Bloque P1 — Base de análisis y acompañamiento

Estado: **EN VALIDACIÓN TÉCNICA — PR #180**.

Incluye:

- tablas con RLS para participantes, onboarding, eventos mínimos de uso y reportes;
- Centro de Análisis;
- selección de participantes;
- onboarding por rol;
- repetición del recorrido desde Perfil;
- reporte de problemas;
- ejemplos en avisos y notificaciones;
- manual por jerarquía.

Validación confirmada:

- migraciones `piloto_analitica_onboarding` y `piloto_revoke_anon_manager` aplicadas;
- RLS habilitada en las cuatro tablas nuevas;
- ejecución anónima revocada en el helper de gestión;
- build completo de Next.js y TypeScript aprobado en GitHub Actions, ejecución `30939370609`;
- Vercel preview no ejecutado por límite temporal de frecuencia de builds, no por error de código.

Criterio de cierre:

- PR fusionado;
- producción en estado `READY`;
- acceso a `/admin/analisis` confirmado para pastor/administrador;
- una cuenta de cada rol añadida y recorrido inicial comprobado;
- reporte de prueba visible en el Centro de Análisis.

### Bloque P2 — Recorridos operativos por rol

Estado: PENDIENTE.

Debe validar:

1. Pastor o administrador crea un evento general y un mensaje pastoral.
2. Líder crea un evento ministerial, asigna un servidor y publica un aviso.
3. Servidor recibe la notificación, abre el evento y prueba Intercambio.
4. Congregante consulta avisos y calendario sin controles administrativos.
5. Los accesos directos escritos manualmente no permiten saltar permisos.

### Bloque P3 — Prueba controlada de siete días

Estado: PENDIENTE.

Debe incluir:

- grupo reducido de pastores, líderes y servidores;
- revisión diaria de errores críticos;
- métricas de adopción y notificaciones;
- correcciones limitadas a bloqueos reales;
- cierre documentado con resultados y pendientes.

## Notas bíblicas y futura FASE F

**Biblia → Notas** ya cubre la base funcional del cuaderno:

- notas de versículo, estudio, predicación o uso personal;
- título, contenido y referencia;
- relación con paquetes pastorales;
- búsqueda, filtros, listas, tareas y fechas;
- guardado automático local.

La FASE F no debe crear otro cuaderno. Se redefine como evolución del espacio existente con:

- sincronización segura entre dispositivos;
- respaldo en Supabase;
- número correlativo de prédica;
- fecha, serie, lugar, predicador y estado;
- exportación o impresión.

Esta evolución permanece fuera del piloto actual.

# FASE D — ESTADO CONSERVADO EN PAUSA

## Punto exacto de reanudación

La FASE D permanece detenida en **Bloque 5 — Cronologías y Mapas**.

Estado preservado:

- esquema de lugares, periodos, eventos y relaciones aplicado con RLS;
- paquete `rome-pilot-v1` publicado y aprobado;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones habilitados;
- interfaz todavía no conectada;
- Bloque 6 no iniciado.

Cuando este documento reactive la FASE D, el siguiente punto autorizado será integrar el servicio de cronologías y mapas en una superficie visual limitada al piloto de Roma, con atribución, precisión, certeza, sesión y RLS. No ampliar el catálogo antes de validar ese piloto.

# Evidencia activa

- `docs/PILOTO_IGLESIA_ACTIVO_2026-08-04.md`;
- `docs/MANUAL_PILOTO_POR_ROLES_2026-08-04.md`;
- PR #180 — Centro de Análisis y recorrido por roles;
- migraciones `20260804121700_piloto_analitica_onboarding.sql` y `20260804122500_piloto_revoke_anon_manager.sql`;
- historial completo anterior en `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

# Siguiente punto autorizado

1. Fusionar y desplegar el Bloque P1.
2. Entrar en Administración → Centro de Análisis.
3. Seleccionar las primeras cuentas de pastor, líder y servidor.
4. Validar onboarding, notificaciones y reporte de problemas en esas cuentas.
5. Documentar resultados antes de iniciar el Bloque P2.

No reanudar el estudio bíblico avanzado ni iniciar un cuaderno separado durante este bloque.
