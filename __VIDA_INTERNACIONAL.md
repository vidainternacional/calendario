# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-17

Fase / prioridad activa: **FASE G — VALIDACIÓN INTEGRAL Y CIERRE DE DEUDAS TRANSVERSALES**

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
10. **Principio visual global:** priorizar superficies integradas, jerarquía por espaciado, tipografía, color y separadores; evitar contenedores o tarjetas anidadas tipo “cuadro dentro de cuadro” cuando no exista una necesidad funcional clara. En móvil, conservar la mayor superficie útil posible sin reducir las áreas táctiles a tamaños incómodos.
11. **Navegación móvil global:** la barra principal pertenece al layout de la aplicación y no a cada módulo. La aparición del teclado no debe levantarla ni hacerla flotar sobre el contenido de trabajo; en iOS debe permanecer en el borde inferior del layout y quedar cubierta por el teclado cuando corresponda.
12. **Historial reversible:** cuando una superficie exponga Deshacer/Rehacer, toda acción que modifique contenido o metadatos creados por el usuario debe entrar en el mismo historial reversible; no limitar el historial únicamente al texto visible.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **COMPLETADA — 2026-08-12** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **COMPLETADA — 2026-08-13** |
| FASE F | Evolución correlativa de Biblia → Notas | **COMPLETADA — 2026-08-17** |
| FASE G | Validación integral y cierre de deudas transversales | **ACTIVA — 2026-08-17** |
| FASE H | Centro de Hebreo Bíblico | **PLANIFICADA — posterior a FASE G** |
| FASE I | Guía interactiva y ayuda contextual por rol | **PLANIFICADA — posterior a FASE H** |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: optimizar al final la latencia ocasional de badges/push entre Supabase, cliente, service worker, segundo plano, red e iOS, sin parches aislados por pantalla. Este pendiente pasa formalmente a FASE G.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario conserva su base móvil aprobada y no debe degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa. La futura guía interactiva por rol de FASE I sustituye la necesidad práctica de usar el piloto como mecanismo principal de orientación dentro de la app, sin borrar la evidencia histórica del piloto.

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
15. Las notas personales de Estudio permanecen asociadas al usuario autenticado y a su referencia; su evolución profunda quedó desarrollada en FASE F.

## Decisiones diferidas al cerrar FASE D

### Pronunciación y voz

La ayuda de pronunciación/voz para hebreo, arameo y griego no se integrará como una función aislada dentro de la Biblia principal. El aprendizaje de lectura y pronunciación del hebreo pasa a formar parte del Centro de Hebreo Bíblico planificado para FASE H.

### Centro de Estudio y analíticas

La evolución del historial hacia analíticas de pasajes, libros, temas, preguntas, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia queda diferida. Las notas personales no formarán parte de la telemetría y las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

### Cuaderno personal / FASE F

El cuaderno personal único por usuario, origen/contexto, privacidad por defecto, sincronización entre dispositivos, respaldo en Supabase, predicación correlativa, metadatos y exportación fueron desarrollados y cerrados en FASE F.

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
8. Producción, CI y documentación técnica quedaron alineados. El warning Node `DEP0169` asociado a la dependencia de Web Push queda documentado como deuda no bloqueante, sin error funcional comprobado; su eliminación pasa a FASE G.
9. El Piloto Operativo permanece pausado.

Hitos finales de cierre:

- recuperación/reanudación PWA validada: `2927f18ecb2a69ea44e720a2895a4b52cc046796`;
- seguridad final versionada: `5718db3dd4da671ea36ecbad15f486f7e79f479f`.

FASE E queda **COMPLETADA** y no debe reabrirse salvo bug comprobable.

# FASE F — COMPLETADA — EVOLUCIÓN CORRELATIVA DE BIBLIA → NOTAS — 2026-08-17

FASE F se activó formalmente el 2026-08-13 después del cierre documentado de FASE E y queda formalmente cerrada el 2026-08-17 tras completar validación funcional en iPhone, integración a `main`, verificación de producción y documentación final.

## Objetivo de FASE F

Evolucionar `Biblia → Notas` hacia un único cuaderno personal por usuario, evitando sistemas paralelos y preservando la privacidad por defecto.

La fase partió del estado funcional existente y conserva el origen/contexto de cada nota. Biblia, Estudio Profundo y las superficies pastorales autorizadas pueden alimentar el mismo cuaderno cuando corresponde.

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

### Predicación correlativa y exportación

23. Se auditó el contrato existente y se confirmó que `notas_estudio` ya contenía `numero_predicacion`, `fecha_predicacion`, `serie`, `lugar`, `predicador` y `estado`; se detectó que `estado` ya se utilizaba para el ciclo técnico `activo/eliminado`, por lo que no se reutilizó para el estado pastoral de la prédica.
24. Con autorización explícita del usuario se aplicó la migración `20260814192000_fase_f_correlativo_predicacion_seguro`, que añadió `estado_predicacion`, un índice único parcial por `(profile_id, numero_predicacion)` para notas activas de tipo `predicacion` y la función `SECURITY INVOKER` `asignar_numero_predicacion_nota(uuid)` para asignación correlativa serializada por usuario.
25. La migración no modificó RLS, grants de tablas ni datos existentes. Se verificaron 2 filas previas intactas, RLS activo y 4 políticas sin cambios. La función solo es ejecutable por `authenticated` dentro del alcance autorizado. El SQL quedó versionado mediante PR #275 (`bcf779eaea7c0d99298b4fbd835c46b1892bdde8`).
26. El modelo local/offline fue ampliado de forma aditiva para transportar `numeroPredicacion`, `fechaPredicacion`, `serie`, `lugar`, `predicador` y `estadoPredicacion`; notas antiguas continúan normalizando esos campos como vacíos o `NULL` sin pérdida de contenido.
27. La sincronización dispositivo → Supabase envía esos metadatos y solicita el correlativo solo cuando la nota es de tipo `predicacion` y aún no tiene número. La descarga Supabase → dispositivo devuelve también el número asignado y todos los metadatos. Este contrato quedó fusionado mediante PR #276 (`bd8ded089a1c272a1796e002d3c9e2004e19cf13`).
28. La interfaz de `Biblia → Notas` muestra una tarjeta contextual de datos únicamente cuando la nota es de tipo Predicación: número correlativo de solo lectura, fecha, serie, lugar, predicador y estado de predicación. Cuando todavía no hay conexión/número, muestra el estado pendiente y el correlativo aparece después de sincronizar.
29. La exportación reutiliza el patrón aprobado del proyecto mediante `window.print()`, permitiendo impresión o guardado como PDF sin introducir una dependencia adicional.
30. El shell offline de Notas fue actualizado con los mismos campos de Predicación. Fecha, serie, lugar, predicador y estado se pueden editar sin Internet y quedan en la misma cola canónica; el número permanece pendiente hasta volver a conectar. El service worker solo renovó la versión del caché del shell y no amplió el caché a API, Supabase o bundles de Next.js.
31. Validación funcional real completada en iPhone: se creó `Prédica prueba FASE F`, Supabase asignó **Prédica #1** una sola vez y recibió fecha `2026-08-02`, serie `Serie prueba`, lugar `Vida Internacional`, predicador `tu nombre`, origen `biblia_notas` y estado técnico `activo`, sin duplicados de título, `origen_key` o correlativo.
32. Con el teléfono sin conexión se cambió `estado_predicacion` de `Borrador` a `Lista para predicar`; al recuperar Internet sin recargar, Supabase recibió `Lista para predicar` conservando el mismo UUID y **Prédica #1**, confirmando que el estado pastoral permanece separado del estado técnico.
33. La experiencia visual/offline quedó fusionada mediante PR #277 (`35da346a5fbb0919cca49d2c27e022844df7b3f4`) y el despliegue de producción exacto quedó READY.

Los bloques de **sincronización bidireccional, respaldo entre dispositivos, apertura en frío offline y predicación correlativa con metadatos/exportación quedan VALIDADOS**.

## Punto 6 — origen, contexto, organización y filtrado — VALIDADO EN PREVIEW E INTEGRADO EN PRODUCCIÓN — 2026-08-17

La evidencia detallada se conserva en:

- `docs/FASE_F_PUNTO_6_VALIDACION_2026-08-17.md`.

34. `Biblia → Notas` y Estudio Profundo alimentan un único cuaderno canónico y no crean copias para representar filtros, categorías u origen.
35. Las notas conservan `origen`, referencia, pasaje normalizado, contexto disponible y metadatos de predicación; la organización visual se deriva de esos mismos datos reales.
36. Los filtros por tipo y origen operan sobre la misma implementación del Cuaderno y mantienen la misma taxonomía online y offline.
37. Estudio Profundo puede guardar y abrir el mismo cuaderno; repetir el guardado del mismo estudio reutiliza la nota canónica correspondiente en vez de crear un sistema paralelo.
38. La navegación de concordancias/búsqueda asistida conserva libro, capítulo y versículo exactos y no inventa referencias cuando no existe respaldo determinístico.
39. El editor aprobado conserva formato WYSIWYG, historial global Deshacer/Rehacer, datos de predicación reversibles, exportación y áreas táctiles móviles.
40. El modo offline dejó de utilizar `public/offline/notas.html` como experiencia activa. El service worker usa `/biblia/notas-offline`, que monta literalmente el mismo `BibleNotesWorkspace` React del Cuaderno online.
41. El service worker `vida-shell-v2.3-cuaderno-react-real` precachea el shell público y únicamente los recursos `/_next/static/` necesarios para hidratarlo; no cachea notas, API, Supabase ni HTML autenticado privado.
42. La identidad offline continúa ligada al UUID validado del usuario; si falta el marcador activo, solo se infiere un dueño cuando existe exactamente un único cuaderno local válido.
43. La sincronización evita consultas remotas cuando `navigator.onLine === false` y conserva la misma caché/cola canónicas ya validadas.
44. Validación funcional real completada en iPhone: el usuario confirmó que, tras actualizar el service worker y activar modo avión, el Cuaderno offline conserva la apariencia y experiencia actual online en lugar de mostrar la versión histórica.
45. La validación técnica del head `2060977789b73949b4db049726143b40d227f52e` completó regresiones, lint, build y validaciones del documento maestro/TAHOT en verde antes de la integración.
46. Este bloque no requirió cambios adicionales de esquema, RLS, grants ni datos de producción.

El **punto 6 queda VALIDADO e integrado a `main`** mediante PR #284. La producción correspondiente al merge `d67e7db7916f4dd32f2c1cf40ef266229d92f931` quedó READY.

## Cierre formal de FASE F — 2026-08-17

47. PR #284 fue fusionado a `main` en `d67e7db7916f4dd32f2c1cf40ef266229d92f931` después de autorización explícita del usuario.
48. Vercel creó el deployment de producción `dpl_7HTxXy2f1hTycqtdT3BVy5btdfPq`, que quedó **READY** y asignó correctamente los aliases de producción.
49. La ruta pública `/biblia/notas-offline` respondió HTTP 200 en producción como contenido prerenderizado y el service worker correspondiente quedó disponible para el cold-start offline.
50. La revisión de runtime del deployment productivo no mostró errores ni eventos fatales en la ventana de verificación posterior al despliegue.
51. El cierre no añadió cambios de esquema, RLS, grants ni datos de Supabase; las garantías de privacidad por usuario y sincronización ya validadas se preservan.
52. El usuario había validado previamente en iPhone el flujo de origen/contexto, guardado desde Estudio Profundo, editor sin límite artificial y paridad visual/funcional online-offline.

FASE F queda **COMPLETADA — 2026-08-17** y no debe reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE G — ACTIVA — VALIDACIÓN INTEGRAL Y CIERRE DE DEUDAS TRANSVERSALES

FASE G se activa formalmente el 2026-08-17 después del cierre de FASE F.

## Objetivo de FASE G

Validar la aplicación completa en producción como un solo sistema, por rol y por flujo real, y cerrar las deudas transversales conocidas antes de agregar nuevas áreas funcionales grandes.

## Alcance de FASE G

1. Construir una matriz integral de funciones y permisos para Administrador, Pastor, Líder y Servidor, cubriendo autenticación, Inicio, Perfil, Contactos, Ministerios, Programación, Solicitudes, Avisos, Calendario, Estudios, Biblia, Estudio Profundo, Cuaderno, Panel Pastoral, Administración, Ayuda Solidaria y superficies relacionadas.
2. Validar recorridos críticos de principio a fin en producción y PWA/iPhone, incluyendo navegación, estados vacíos/error, permisos, persistencia, sincronización, cambio de cuenta, reconexión y comportamientos online/offline donde correspondan.
3. Corregir únicamente bugs comprobables encontrados durante la matriz. Una fase cerrada solo se reabre para la corrección puntual necesaria y vuelve a preservarse después.
4. Analizar la latencia ocasional de Avisos/badges/push separando claramente lo controlable por VIDA de la entrega propia de iOS/Web Push/red; optimizar únicamente las capas bajo control de la aplicación y evitar polling agresivo.
5. Eliminar la deuda técnica Node `DEP0169` asociada al flujo Web Push mediante actualización o sustitución segura de la dependencia responsable, manteniendo envío push, TTL, urgencia, recuperación y badges sin regresión.
6. Revisar runtime y errores de producción durante las pruebas, ampliar regresiones únicamente cuando protejan un bug real encontrado y mantener CI/build verde.
7. Documentar evidencia de cada recorrido validado, hallazgos, correcciones y estado final de producción antes de cerrar la fase.
8. No reactivar el Piloto Operativo durante FASE G.
9. No modificar esquema, RLS, grants o funciones sensibles de Supabase sin presentar antes el cambio exacto, impacto y reversión y obtener aprobación explícita.

## Bloque activo de FASE G

### Bloque 1 — Inventario y matriz de validación integral

Primero se auditará el estado real de producción y el código actual para construir una matriz de recorridos por rol. No se harán cambios funcionales mientras no exista un bug comprobable. La matriz debe permitir marcar cada flujo como `VALIDADO`, `BUG`, `NO APLICA` o `PENDIENTE DE CUENTA/DATO`, con evidencia suficiente para no repetir pruebas ya aprobadas.

# FASE H — PLANIFICADA — CENTRO DE HEBREO BÍBLICO

FASE H comenzará únicamente después del cierre formal de FASE G.

## Objetivo previsto

Crear dentro de Estudios una herramienta didáctica, minimalista y progresiva para aprender a **leer y comprender hebreo bíblico**, reutilizando primero las fuentes textuales ya aprobadas y buscando nuevas fuentes/APIs solo cuando aporten datos verificables y licencias compatibles.

Nombre de trabajo de la herramienta: **Hebreo Bíblico**. Subtítulo orientativo: **Aprende y lee los textos originales**.

## Alcance previsto

1. **Alef-bet interactivo:** las 22 letras básicas y sus 5 formas finales cuando corresponda, presentadas en una cuadrícula didáctica inspirada visualmente en una tabla periódica. Cada ficha podrá mostrar orden/número, letra, nombre, forma final, transliteración, sonido orientativo, ejemplos y variantes gráficas.
2. **Historia y formas antiguas:** cuando exista evidencia académica verificable, se podrán mostrar formas históricas o referencias pictográficas como contexto de escritura. No se presentará un pictograma como si determinara automáticamente el significado léxico o teológico de una palabra bíblica.
3. **Ruta de aprendizaje:** dirección derecha→izquierda, consonantes, formas finales, niqqud/vocales, shevá, dagesh, lectura silábica, raíces, prefijos/sufijos y gramática progresiva, divididos en lecciones cortas y prácticas.
4. **Pronunciación para aprendizaje:** incorporar ayuda auditiva o ejemplos de pronunciación cuando exista una metodología/fuente suficientemente confiable, etiquetándola como ayuda pedagógica y no como reconstrucción histórica infalible.
5. **Lector bíblico hebreo:** ofrecer el Tanaj/Antiguo Testamento en sus lenguas originales, hebreo y los segmentos arameos donde corresponda, con lectura RTL clara y herramientas para palabra, lema, transliteración, morfología y glosa disponible.
6. **Traducción accesible:** permitir alternar o comparar fácilmente el texto original con traducción española aprobada y ayudas de estudio. No fabricar traducciones literales inexistentes ni confundir glosa léxica con traducción del versículo.
7. **Precisión del canon original:** el Nuevo Testamento original es griego, no hebreo. Si en el futuro se incorpora una traducción hebrea del Nuevo Testamento, deberá identificarse explícitamente como traducción y nunca como texto original.
8. **Práctica y progreso:** ejercicios breves, lectura guiada, reconocimiento de letras/palabras, repasos, marcadores y progreso personal sin convertir la experiencia en algo pesado o escolarizado.
9. **Materiales administrables:** permitir que Administrador pueda agregar posteriormente enlaces, documentación, recursos, tareas o materiales de aprendizaje. Cualquier almacenamiento nuevo en Supabase deberá diseñarse y aprobarse cuando FASE H esté activa.
10. **Diseño:** mantener la línea visual actual de VIDA: minimalista, clara, coherente, táctil, mobile-first, didáctica y sin tarjetas anidadas innecesarias.

# FASE I — PLANIFICADA — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL

FASE I comenzará únicamente después del cierre formal de FASE H, salvo que el documento maestro cambie explícitamente el orden.

## Objetivo previsto

Dar a cada persona una guía dentro de VIDA sin depender de capacitación presencial ni reactivar el Piloto Operativo.

## Alcance previsto

1. Recorrido inicial opcional por primera vez mediante globos/contextos breves anclados a herramientas reales.
2. Contenido dinámico por rol y permisos: Administrador, Pastor, Líder y Servidor solo verán explicaciones de funciones que realmente pueden utilizar.
3. Posibilidad de omitir el recorrido y volver a iniciarlo manualmente desde Ayuda/Perfil.
4. Centro de guía interactiva con explicaciones cortas por módulo, acciones frecuentes y recorridos específicos cuando una superficie sea compleja.
5. El recorrido debe usar la interfaz real, no una réplica separada que pueda quedar desactualizada.
6. Sin telemetría del Piloto por defecto; cualquier medición futura deberá ser explícita, agregada y respetuosa con la privacidad.
7. Accesibilidad, áreas táctiles cómodas, lenguaje breve y coherencia con la experiencia mobile-first de VIDA.

# Siguiente punto autorizado

**Iniciar exclusivamente FASE G con el Bloque 1 — inventario y matriz de validación integral. Revisar producción y el estado real del repositorio para construir la matriz por rol y por módulo; no corregir nada hasta identificar un bug comprobable. Después validar los recorridos en orden, documentando evidencia para evitar repetir pruebas. No iniciar FASE H ni FASE I mientras FASE G no esté formalmente completada en este documento.**
