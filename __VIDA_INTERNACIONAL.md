# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-11

Fase / prioridad activa: **FASE D — COBERTURA BÍBLICA INTEGRAL: DATOS ANTES DE UX**

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
7. Durante la prioridad activa de cobertura bíblica, **no iterar UX, navegación o presentación salvo que sea indispensable para comprobar datos**. Primero se completa y audita la información; después se diseña la experiencia final.
8. Una capa bíblica ausente no debe sustituirse por texto explicando que falta. Si no existe información aprobada, la capa simplemente no se muestra.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **ACTIVA — COBERTURA BÍBLICA INTEGRAL** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: optimizar al final la latencia ocasional de badges/push entre Supabase, cliente, service worker, segundo plano, red e iOS, sin parches aislados por pantalla.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario conserva su base móvil aprobada y no debe degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa.

# FASE D — ACTIVA — COBERTURA BÍBLICA INTEGRAL: DATOS ANTES DE UX

El 2026-08-11 el usuario autorizó explícitamente completar toda la información bíblica faltante y auditarla antes de continuar con presentación, navegación o diseño del Centro de Estudio.

## Estado preservado de FASE D

- Bloques 1–4 permanecen cerrados y no deben reiniciarse.
- Los 66 libros y 1,189 capítulos cuentan con contexto histórico/cultural base ya incorporado.
- El Nuevo Testamento textual completo ya fue importado y validado con TAGNT.
- TAHOT del Antiguo Testamento fue verificado como fuente aprobada; existen importaciones parciales y pilotos previos.
- El piloto cronológico/geográfico `rome-pilot-v1` permanece publicado y aprobado con 1 lugar, 1 periodo, 2 eventos y 2 relaciones.
- Roma ya está conectada a Biblia → Estudio y Estudio Profundo como prueba de infraestructura.
- El rediseño visual posterior —dashboard, acordeones, `Ver todo`, mapa integrado y unificación de superficies— queda **congelado en Preview** hasta cerrar datos.
- La rama `preview/fase-d-cobertura-biblica-universal` conserva el trabajo reproducible de Daniel y el soporte multilingüe hebreo/arameo preparado para validación.

## Objetivo activo autorizado

Dejar la base bíblica en estado de **pruebas finales mediante checklist**, completando y auditando primero toda la información que pueda obtenerse legalmente y de fuentes aprobadas.

### Orden obligatorio

1. Levantar matriz real de cobertura de los 66 libros por capa de información.
2. Cerrar Daniel como caso de control multilingüe hebreo/arameo, incluyendo el cambio interno de idioma de Daniel 2:4.
3. Generalizar el pipeline TAHOT y completar los libros faltantes del Antiguo Testamento sin importaciones manuales libro por libro.
4. Verificar para AT y NT: texto original, idioma, transliteración cuando la fuente la provea, lema, morfología, identificadores léxicos, palabra por palabra, variantes y procedencia/hashes.
5. Incorporar traducción literal de estudio únicamente cuando pueda derivarse/documentarse con rigor y licencia adecuada; nunca etiquetar una síntesis contextual como traducción literal.
6. Mantener contextos histórico, cultural, judío, literario y teológico ya aprobados; auditar huecos reales sin fabricar contenido.
7. Auditar traducciones españolas disponibles y sus licencias. NVI y RVR60 no se importan completas sin autorización/licencia correspondiente; la arquitectura debe quedar preparada para incorporarlas cuando exista permiso.
8. Completar cronología y geografía únicamente con datos verificables y fuentes autorizadas. Distinguir certeza, aproximación y debate; no dibujar rutas históricas inventadas.
9. Auditar el motor de Estudio para que devuelva solo capas con contenido real. Si una capa no existe, no mostrar texto de relleno ni “próximamente”.
10. Mantener fuentes, versión, licencia, hash y trazabilidad por dataset/importación.
11. Verificar integridad, idempotencia, duplicados, conteos, permisos existentes y recuperación server-only. No modificar RLS sensible sin plan explícito y aprobación previa.
12. Ejecutar pruebas de muestra en Pentateuco, históricos, poesía, profetas mayores/menores, Evangelios, Hechos, cartas y Apocalipsis.
13. Documentar cobertura final y generar un checklist de pruebas para el usuario.

## Fuera de alcance hasta cerrar datos

- no seguir refinando acordeones, dashboard o navegación del Estudio;
- no rediseñar Centro Pastoral ni Biblia → Notas;
- no abrir FASE E o FASE F;
- no activar analytics de estudios todavía; el requisito está documentado para después de cerrar la base de datos;
- no convertir datos aproximados en afirmaciones exactas;
- no importar traducciones con copyright sin licencia.

# Requisito diferido — Centro de Estudio y analíticas

Después de cerrar cobertura y UX final, el Centro de Estudio debe evolucionar el historial existente para registrar de forma útil y respetuosa qué pasajes, libros, temas y preguntas se estudian, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia. El tiempo no debe contarse cuando la app esté en segundo plano. Las notas personales no forman parte de la telemetría. Las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Siguiente punto autorizado

Continuar exclusivamente con la auditoría y carga de cobertura bíblica integral descrita arriba. Al terminar, entregar al usuario un checklist único de pruebas. Solo después de validar ese checklist se reabre el trabajo de UX/navegación y se decide formalmente el cierre o siguiente bloque de FASE D.
