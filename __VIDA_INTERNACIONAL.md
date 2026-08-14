# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-14

Fase / prioridad activa: **FASE F — EVOLUCIÓN CORRELATIVA DE BIBLIA → NOTAS**

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
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **COMPLETADA — 2026-08-13** |
| FASE F | Evolución correlativa de Biblia → Notas | **ACTIVA — 2026-08-13** |

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

# FASE E — COMPLETADA — RENDIMIENTO, SEGURIDAD, ESCALABILIDAD, PRUEBAS Y DOCUMENTACIÓN — 2026-08-13

FASE E se abrió formalmente el 2026-08-12 después del cierre aprobado de FASE D y queda cerrada el 2026-08-13 tras completar auditoría, cambios seguros, validación funcional y documentación.

La evidencia consolidada se conserva en:

- `docs/FASE_E_LINEA_BASE_TECNICA_2026-08-12.md`;
- `docs/FASE_E_CIERRE_TECNICO_2026-08-13.md`.

## Resultado final de FASE E

1. Rendimiento auditado sobre superficies principales, navegación y consultas reales; se optimizó precarga y se eliminaron llamadas duplicadas verificables sin degradar UX.
2. Seguridad de Supabase revisada y endurecida de forma conservadora: grants redundantes, funciones SECURITY DEFINER y RPC internas quedaron restringidas según su uso legítimo, con migraciones versionadas.
3. Escalabilidad revisada con tamaños y `pg_stat_statements`; no se añadieron índices especulativos donde el volumen y latencia actuales no los justifican.
4. Regresiones críticas automatizadas con `node:test` e integradas al CI antes de lint/build.
5. Runtime y recuperación de red revisados; la PWA recupera Avisos al reconectar, enfocar o volver visible sin exigir recarga manual.
6. Latencia transversal de badges/push corregida para que badge y contenido visible compartan señales de refresco y no dependan de la llegada final del push en iOS.
7. Validación funcional real en iPhone completada: tras reconexión/reanudación, badge de Avisos y `Avisos para ti` actualizaron rápido y prácticamente al mismo tiempo.
8. Producción, CI y documentación técnica quedaron alineados. El warning Node `DEP0169` asociado a la dependencia de Web Push queda documentado como deuda no bloqueante, sin error funcional comprobado.
9. El Piloto Operativo permanece pausado.

Hitos finales de cierre:

- recuperación/reanudación PWA validada: `2927f18ecb2a69ea44e720a2895a4b52cc046796`;
- seguridad final versionada: `5718db3dd4da671ea36ecbad15f486f7e79f479f`.

FASE E queda **COMPLETADA** y no debe reabrirse salvo bug comprobable.

# FASE F — ACTIVA — EVOLUCIÓN CORRELATIVA DE BIBLIA → NOTAS

FASE F se activa formalmente el 2026-08-13 después del cierre documentado de FASE E.

## Objetivo de FASE F

Evolucionar `Biblia → Notas` hacia un único cuaderno personal por usuario, evitando sistemas paralelos y preservando la privacidad por defecto.

La fase debe partir del estado funcional existente y conservar el origen/contexto de cada nota. Biblia, Estudio Profundo y las superficies pastorales autorizadas podrán alimentar el mismo cuaderno cuando corresponda.

## Alcance inicial documentado

1. Auditar el estado real actual de `Biblia → Notas`, tablas, RLS, acciones y UI antes de modificar.
2. Definir y consolidar un único modelo de nota personal por usuario, sin duplicar notas entre superficies.
3. Mantener las notas privadas por defecto y revisar acceso/RLS antes de ampliar campos o sincronización.
4. Garantizar sincronización entre dispositivos y respaldo en Supabase.
5. Evolucionar el cuaderno para soportar número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.
6. Conservar origen y contexto bíblico de cada nota para permitir organización y filtrado sin duplicación.
7. Preservar las interfaces aprobadas y avanzar por bloques verificables, con Preview antes de cualquier cambio visual relevante.

## Avance validado de FASE F — 2026-08-14

La evidencia inicial se conserva en:

- `docs/FASE_F_LINEA_BASE_NOTAS_2026-08-13.md`;
- `docs/FASE_F_NOTAS_OFFLINE_FIRST_2026-08-13.md`.

### Cuaderno canónico y offline-first

1. La línea base confirmó dos sistemas paralelos: `Biblia → Notas` guardaba en `localStorage` y Estudio Profundo utilizaba `public.notas_estudio` en Supabase.
2. `notas_estudio` fue ampliada de forma aditiva para convertirse progresivamente en el cuaderno canónico, sin borrar datos ni modificar las políticas RLS existentes.
3. `pasaje_normalizado` ahora puede ser `NULL`, permitiendo notas personales sin inventar una referencia bíblica; la unicidad existente por `(profile_id, pasaje_normalizado)` se conserva para Estudio Profundo.
4. El almacenamiento local de Biblia → Notas quedó centralizado sobre la clave histórica `vida-biblia-notas-v2`, preservando notas existentes del dispositivo.
5. Se implementó una cola offline por usuario con UUID estable, última operación por nota y reintento al recuperar conexión, foco o visibilidad.
6. Los cambios se guardan primero localmente. Cuando vuelve Internet, la cola sincroniza con `notas_estudio` usando la sesión autenticada y RLS existente.
7. La sincronización drena la cola hasta alcanzar la última versión de cada nota, evitando que una edición intermedia quede como estado final cuando hay cambios rápidos.
8. La cola está aislada por `ownerId`; una operación de una cuenta no puede ser atribuida automáticamente a otra sesión del mismo dispositivo.
9. Validación funcional real en iPhone completada: se creó y editó una nota sin Internet, se recuperó la conexión sin recargar y Supabase recibió una sola fila con el título final, contenido completo, UUID estable y usuario autenticado correcto, sin duplicados.
10. El bloque fue fusionado en `main` mediante PR #268 (`97f96996ddb62d8434cf30bd5b6c58a8c6825c90`) y el despliegue de producción correspondiente quedó READY.
11. Las migraciones de estructura de este bloque quedaron versionadas, incluida `20260813233955_fase_f_permitir_notas_sin_pasaje.sql` mediante PR #269 (`ca5893861c0f92b8c4d4d127060d11a8a3aa581a`).
12. No se modificaron grants ni políticas RLS durante este bloque.

### Sincronización bidireccional y apertura en frío offline

13. El camino `Crear nota de este versículo` fue unificado con el mismo motor local/canónico mediante PR #271, eliminando la escritura paralela directa de esa nota sobre la clave histórica.
14. La caché local canónica quedó separada por usuario y la sincronización `Supabase → dispositivo` fue incorporada con mezcla determinista: los cambios locales pendientes tienen prioridad y, cuando no hay pendientes, se conserva la versión más reciente.
15. Los borrados de `biblia_notas` utilizan tombstones sincronizables sin conservar el contenido eliminado, permitiendo que otro dispositivo conozca el borrado sin exponer texto privado.
16. La sincronización bidireccional fue validada funcionalmente en iPhone con un origen de Preview nuevo: la nota existente en Supabase apareció automáticamente en una caché local nueva, demostrando `Supabase → dispositivo`. El bloque fue fusionado mediante PR #272 (`000de127cccab1be45f4f69026a2b6e9b780d10a`) y producción quedó READY.
17. Se implementó un fallback de apertura en frío exclusivo para `/biblia/notas`. El service worker no cachea `/_next/`, API, Supabase ni HTML autenticado privado; utiliza un shell estático sin datos personales y lee el cuaderno únicamente desde la caché local del usuario.
18. La identificación del cuaderno offline conserva privacidad: utiliza el marcador del usuario activo, un respaldo mínimo del UUID dentro del service worker y, si ambos faltan, solo infiere el dueño cuando existe exactamente un único cuaderno local con UUID válido. Con múltiples cuadernos no adivina y mantiene el bloqueo protector.
19. El cierre de sesión elimina el marcador local y el respaldo del service worker. El contenido de las notas nunca se guarda dentro del service worker.
20. Validación funcional real en iPhone completada con Wi-Fi apagado/modo avión: Safari abrió `/biblia/notas` desde cero, mostró `Sin conexión · guardado local` y presentó correctamente las notas y contenido existentes del usuario.
21. El cold-start offline fue fusionado mediante PR #273 (`7d6cf9e995dca7e1de2f4d5488c98cdb110c3ccc`) y el despliegue de producción exacto quedó READY.
22. No se modificaron grants, políticas RLS ni esquema de Supabase durante los bloques #271–#273.

Los bloques de **sincronización bidireccional, respaldo entre dispositivos y apertura en frío de `Biblia → Notas` sin Internet quedan VALIDADOS**. FASE F permanece **ACTIVA**.

# Siguiente punto autorizado

**Continuar exclusivamente FASE F con el punto 5 del alcance: evolucionar el cuaderno para soportar número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación. Antes de cambios visuales, auditar cómo los campos canónicos ya existentes en `notas_estudio` se relacionan con el modelo local/offline y definir el contrato de datos sin duplicar notas. Conservar origen/contexto bíblico, privacidad por usuario y sincronización offline ya validados. No modificar RLS, grants ni diseño visual sin un alcance y plan de recuperación explícitos; cualquier cambio visual deberá pasar por Preview antes de producción.**