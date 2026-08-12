# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-12

Fase / prioridad activa: **FASE E — RENDIMIENTO, SEGURIDAD, ESCALABILIDAD, PRUEBAS Y DOCUMENTACIÓN**

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
7. Durante FASE E, preservar íntegramente las funcionalidades y UX aprobadas; optimizar sin degradar comportamientos cerrados.
8. No reabrir cobertura bíblica, Programación Ministerial, Calendario, Notificaciones u otras prioridades cerradas salvo bug comprobable.
9. Los cambios sensibles de seguridad/RLS/grants deben presentarse con alcance y recuperación antes de aplicarse cuando puedan afectar producción.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **COMPLETADA — 2026-08-12** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **ACTIVA — 2026-08-12** |
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

# FASE D — COMPLETADA Y APROBADA — 2026-08-12

FASE D queda formalmente cerrada. Incluye la cobertura bíblica integral auditada y la UX/navegación final del Centro de Estudio aprobadas. No reabrir salvo bug comprobable o una prioridad futura explícitamente documentada.

## Cobertura final auditada

### Canon y contexto

- 66 libros aprobados y habilitados.
- 1,189 capítulos canónicos.
- 0 capítulos sin cobertura contextual aprobada.
- Se conserva contexto histórico, cultural/judío, literario, intención autoral, reflexión teológica y cautelas interpretativas según las unidades editoriales disponibles.

### Texto original y análisis palabra por palabra

Fuente principal: STEPBible Data (`STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`, CC BY 4.0).

- 31,104 segmentos textuales aprobados sobre 31,103 referencias distintas.
- 22,878 segmentos hebreos.
- 268 segmentos arameos.
- 7,958 segmentos griegos.
- 0 segmentos sin transliteración.
- Daniel 2:4 conserva correctamente dos segmentos dentro de la misma referencia: hebreo + arameo.
- 610,657 componentes/ocurrencias morfológicas.
- 0 ocurrencias huérfanas.
- 0 ocurrencias sin transliteración.
- 8 componentes sin código morfológico; todos son conectores ortográficos maqaf (`־`, `H9014`, `token_kind=connector`) y no deben recibir morfología inventada.
- 0 duplicados funcionales de textos u ocurrencias.

### Léxico y glosas

- 16,946 entradas léxicas aprobadas.
- 0 entradas sin lema.
- 0 entradas sin glosa fuente.
- 5,464 entradas cuentan actualmente con glosa española editorial aprobada, concentradas principalmente en la capa griega/NT.
- El hebreo/arameo conserva glosa fuente trazable, pero no existe en la fuente aprobada una traducción española universal equivalente.
- La interfaz omite la glosa española cuando no existe una traducción editorial aprobada.

### Traducción literal de estudio

- Los 7,958 segmentos griegos/NT cuentan con `literal_translation_es` aprobada.
- El AT no recibe una traducción literal fabricada a partir de síntesis contextual o traducciones publicadas.

### Traducciones españolas

- Reina-Valera 1909 (`spaRV1909`) importada y aprobada como traducción española de dominio público.
- 31,084 versículos con texto real visibles.
- 0 textos vacíos visibles.
- NVI y RVR1960 permanecen preparados pero sin texto completo mientras no exista licencia/autorización verificable.

### Variantes, geografía y cronología

- 9,326 variantes textuales aprobadas y trazadas.
- 1,343 lugares visibles/aprobados.
- 8,742 relaciones lugar↔versículo aprobadas.
- 5,616 versículos distintos con relación geográfica explícita.
- El piloto visible de Roma conserva 2 eventos aprobados.
- 450 eventos narrativos Theographic permanecen staged/deshabilitados con 17,570 relaciones evento↔versículo mientras no se localice/audite su presentación final.
- No se exponen fechas absolutas dudosas como hechos.

### Integridad y seguridad auditadas en FASE D

- 0 duplicados funcionales detectados en textos y ocurrencias.
- 0 ocurrencias léxicas huérfanas.
- 0 hashes inválidos en las capas auditadas.
- RLS activa en las tablas bíblicas principales.
- `anon` no tiene grants directos sobre las tablas bíblicas auditadas.
- Las funciones de importación TAHOT/OpenBible/Theographic auditadas no son ejecutables por `anon` ni `authenticated`.
- Los grants redundantes heredados de concordancias quedan expresamente diferidos a FASE E para revisión de seguridad, sin asumir que deban modificarse hasta evaluar impacto y reversión.

## UX y navegación final del Centro de Estudio — cierre aprobado

Queda aprobado y preservado:

1. Estudio Profundo como superficie tipo dashboard profesional y móvil integrada con Biblia.
2. Capas organizadas y mostradas únicamente cuando existe información real aprobada.
3. Vista **Ver todo** para reunir el estudio completo de forma ordenada.
4. Tratamiento diferenciado de versículos individuales y capítulos extensos mediante contenido principal y bloques plegables.
5. Separación explícita entre texto original, transliteración, secuencia literal de estudio y traducción bíblica española.
6. Traducción española RV1909 integrada como capa propia.
7. Evidencia textual hebrea, aramea y griega integrada según corresponda.
8. Análisis palabra por palabra y variantes textuales conservados como capas diferenciadas.
9. Contexto histórico/judío, intención, cautelas, explicación y reflexión organizados dentro del mismo estudio.
10. Cronología/geografía y mapas mostrados únicamente cuando existe evidencia aprobada, conservando certeza y precisión editorial.
11. Concordancias relacionadas y búsqueda asistida integradas al flujo del estudio.
12. Navegación directa Biblia → Estudio Profundo conservando la referencia actual.
13. Compartir, exportación PDF/impresión, historial y notas existentes preservados.
14. Las capas inexistentes se omiten completamente; no se utilizan placeholders como sustituto de datos.
15. Las notas personales de Estudio permanecen asociadas al usuario autenticado y a su referencia; su evolución profunda queda reservada a FASE F.

## Decisiones diferidas al cerrar FASE D

### Pronunciación y voz

La ayuda de pronunciación/voz para hebreo, arameo y griego **no bloquea el cierre de FASE D**. Queda diferida hasta decidir metodología, calidad y presentación. Si se implementa, deberá presentarse como ayuda de pronunciación y no como reconstrucción histórica infalible.

### Centro de Estudio y analíticas

La evolución del historial hacia analíticas de pasajes, libros, temas, preguntas, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia queda diferida. Las notas personales no formarán parte de la telemetría y las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

### Cuaderno personal / futura FASE F

Debe existir un único cuaderno personal por usuario, no sistemas paralelos. Biblia, Estudio Profundo y las superficies pastorales autorizadas podrán alimentar ese mismo espacio conservando origen y contexto de cada nota. Las notas serán privadas por defecto y deberán poder organizarse/filtrarse sin duplicarlas. `Biblia → Notas` permanece como base funcional a evolucionar en FASE F con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# FASE E — ACTIVA — RENDIMIENTO, SEGURIDAD, ESCALABILIDAD, PRUEBAS Y DOCUMENTACIÓN

FASE E se abre formalmente el 2026-08-12 después del cierre aprobado de FASE D.

## Objetivos de FASE E

1. Auditar rendimiento real de las superficies principales y detectar cuellos de botella verificables antes de optimizar.
2. Revisar seguridad y permisos de Supabase/RLS/grants, incluyendo los grants redundantes heredados de concordancias identificados durante FASE D.
3. Revisar escalabilidad de consultas, índices, cargas de datos, cachés y flujos que puedan crecer con usuarios, ministerios y contenido bíblico.
4. Ejecutar pruebas integrales de regresión sobre los módulos ya aprobados sin rediseñarlos.
5. Revisar errores de runtime, estados de carga, fallos de red y recuperación en flujos críticos.
6. Revisar latencia transversal de badges/push documentada previamente, evitando parches aislados por pantalla.
7. Consolidar documentación técnica y evidencia de validación necesaria para considerar la aplicación preparada para crecimiento y mantenimiento.
8. Mantener el Piloto Operativo en pausa mientras el documento maestro no indique lo contrario.
9. No iniciar FASE F hasta que FASE E figure formalmente como completada en este documento.

## Orden inicial autorizado de FASE E

1. Levantar una línea base técnica del estado actual: build, dependencias, rutas críticas, consultas y políticas relevantes.
2. Clasificar hallazgos por impacto: seguridad, rendimiento, escalabilidad, regresión y documentación.
3. Separar cambios seguros de optimización de cambios sensibles de permisos/datos.
4. Presentar cualquier cambio sensible de RLS/grants con plan de reversión antes de aplicarlo.
5. Aplicar y verificar primero los cambios seguros de mayor impacto, agrupándolos para evitar commits/deploys innecesarios.

# Siguiente punto autorizado

**Iniciar exclusivamente FASE E levantando la línea base técnica del estado actual, sin modificar todavía RLS, grants ni datos sensibles.** No reabrir FASE D ni avanzar a FASE F.