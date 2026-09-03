# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-09-03

Fase / prioridad activa: **EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I · BLOQUE 3 — EXPERIENCIA PARA MÚSICOS**

Decisión vigente: **FASE I — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL queda DIFERIDA HASTA EL CIERRE FINAL DE LA APLICACIÓN.** La guía se desarrollará únicamente cuando las herramientas, módulos y flujos de VIDA estén terminados y aprobados, para evitar documentar o enseñar superficies que todavía puedan cambiar.

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
13. **Repriorización obligatoriamente documentada:** cualquier decisión de repriorización tomada en un PR debe reflejarse en este documento maestro antes de continuar trabajando; no basta con que quede mencionada solo en el PR.
14. **Primer estado de superficies desplegables nuevas:** cualquier opción, sección o grupo desplegable nuevo debe iniciar contraído y volver a iniciar contraído cuando la persona sale de la página y regresa, salvo que exista una razón funcional explícita para abrirlo automáticamente.
15. **Badge como guía de pendiente:** cuando se implemente un badge nuevo, debe ayudar a conducir desde el acceso general hasta el elemento concreto pendiente. La extensión de esta regla a módulos ya cerrados queda diferida hasta terminar los bloques funcionales pendientes.

## REGLAS ESTRICTAS DE PRESERVACIÓN Y EJECUCIÓN

1. Un pedido del usuario es un contrato literal de alcance. Modificar únicamente lo solicitado.
2. Está prohibido aprovechar un cambio para:
   - rediseñar otras áreas;
   - reorganizar código no relacionado;
   - renombrar componentes;
   - cambiar estilos globales;
   - actualizar dependencias;
   - limpiar código ajeno al problema;
   - agregar mejoras no solicitadas.
3. Antes de modificar, identificar el componente y la causa real. Si existen parches anteriores interfiriendo, consolidarlos únicamente cuando afecten directamente el cambio pedido.
4. Todo lo que ya funciona se considera BLOQUEADO POR DEFECTO. Esto incluye datos, guardado, navegación, permisos, historial, Biblia, Estudios, Hebreo, Centro Pastoral, Ministerios, Calendario, notificaciones, imágenes, textos, capas y cualquier comportamiento previamente aprobado.
5. Si para cumplir el pedido fuera indispensable alterar una funcionalidad aprobada, DETENERSE antes de modificarla y explicar exactamente por qué.
6. Cuando una clase, componente o función compartida pueda afectar otras pantallas, aislar primero el cambio para evitar efectos secundarios.
7. No marcar un cambio como corregido solo porque el código compiló. Verificar:
   - diff exacto;
   - build;
   - Preview correspondiente al head nuevo.
8. Máximo UN Preview por bloque de trabajo.
9. No enviar avances intermedios salvo bloqueo real. Ejecutar directamente y entregar resultado.
10. La entrega normal será únicamente:
    - qué cambió;
    - Preview exacto;
    - checklist breve;
    - qué falta verificar.
11. Si no existe validación visual directa, usar exactamente:
    “Cambio aplicado y compilado; falta validación visual tuya.”
12. No hacer merge ni producción sin autorización explícita.
13. No modificar Supabase/RLS/permisos/datos sensibles sin presentar antes cambio exacto, impacto y reversión y recibir aprobación explícita.
14. Al iniciar una conversación nueva, `__VIDA_INTERNACIONAL.md` de `main` es la única fuente oficial. No reconstruir el estado mediante suposiciones ni pedir nuevamente información que ya está documentada.
15. Trabajar de forma puntual: revisión mínima necesaria → causa real → cambio mínimo → diff → compilación → un Preview → checklist. Evitar auditorías generales y explicaciones largas salvo que el usuario las solicite.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **COMPLETADA — 2026-08-12** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **COMPLETADA — 2026-08-13** |
| FASE F | Evolución correlativa de Biblia → Notas | **COMPLETADA — 2026-08-17** |
| FASE G | Validación integral y cierre de deudas transversales | **COMPLETADA — 2026-08-18** |
| FASE H | Centro de Hebreo Bíblico | **COMPLETADA Y APROBADA — 2026-08-23** |
| FASE I | Guía interactiva y ayuda contextual por rol | **DIFERIDA HASTA EL CIERRE FINAL DE LA APP — 2026-08-26** |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: optimizar al final la latencia ocasional de badges/push entre Supabase, cliente, service worker, segundo plano, red e iOS, sin parches aislados por pantalla. Este pendiente pasa formalmente a FASE G y queda cerrado en su evidencia final.

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
20. Validación funcional real completada con Wi-Fi apagado/modo avión: Safari abrió `/biblia/notas` desde cero, mostró `Sin conexión · guardado local` y presentó correctamente las notas y contenido existentes del usuario.
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

# FASE G — COMPLETADA — VALIDACIÓN INTEGRAL Y CIERRE DE DEUDAS TRANSVERSALES — 2026-08-18

FASE G se activó formalmente el 2026-08-17 después del cierre de FASE F y queda cerrada el 2026-08-18 tras completar validación funcional real, correcciones reproducibles, evidencia técnica y aprobación explícita del usuario.

La evidencia consolidada del cierre se conserva en:

- `docs/FASE_G_MATRIZ_VALIDACION_INTEGRAL_2026-08-17.md`;
- `docs/FASE_G_CIERRE_2026-08-18.md`.

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

## Cierre formal de FASE G — 2026-08-18

1. La matriz por rol quedó recorrida con evidencia suficiente para no repetir superficies ya aprobadas; Administrador, Pastor, Líder y Servidor conservan fronteras globales/contextuales correctas.
2. Programación ministerial, repertorio, paleta, solicitudes, reemplazos e historial fueron validados sin fabricar eventos futuros en producción.
3. Centro Pastoral y Administración fueron aprobados en recorridos reales, sin ejecutar acciones destructivas.
4. La PWA quedó ampliada con navegación offline controlada y caché privada por usuario; el cambio de cuenta/cierre de sesión no reutiliza HTML privado de otra identidad.
5. Cuaderno quedó revalidado y aprobado en iPhone después de corregir contraste, skeleton, carrusel horizontal, botón `Nueva` fijo y transición visual de las notas.
6. El usuario validó recepción push real desde la PWA del Preview final. El circuito de Avisos/badges mantiene refresco inmediato sin polling agresivo adicional.
7. La deuda Node `DEP0169` quedó eliminada de CI/build sin degradar Web Push.
8. Las migraciones sensibles de Supabase aplicadas durante la fase tuvieron aprobación explícita, alcance y reversión documentados.
9. El Piloto Operativo permaneció pausado durante toda FASE G.

FASE G queda **COMPLETADA Y APROBADA — 2026-08-18** y no debe reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE H — COMPLETADA Y APROBADA — CENTRO DE HEBREO BÍBLICO — 2026-08-23

FASE H se activó formalmente el 2026-08-18 después del cierre documentado de FASE G y queda cerrada el 2026-08-23 tras completar los cuatro bloques, validación funcional final en iPhone, persistencia real por usuario, práctica adaptativa, checkpoint oral y evidencia técnica verde.

## Objetivo de FASE H

Crear dentro de Estudios una herramienta didáctica, minimalista y progresiva para aprender a **leer y comprender hebreo bíblico**, reutilizando primero las fuentes textuales ya aprobadas y buscando nuevas fuentes/APIs solo cuando aporten datos verificables y licencias compatibles.

Nombre de trabajo de la herramienta: **Hebreo Bíblico**. Subtítulo orientativo: **Aprende y lee los textos originales**.

## Alcance de FASE H

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

## Bloques de FASE H

### Bloque 1 — Línea base de fuentes y arquitectura didáctica — COMPLETADO Y APROBADO — 2026-08-19

1. Las fuentes hebreas/arameas aprobadas en FASE D fueron auditadas y reutilizadas sin crear un segundo motor bíblico.
2. La integración con `Estudios`, Biblia y Estudio Profundo quedó definida y materializada sobre las estructuras textuales/léxicas existentes.
3. El contrato didáctico inicial quedó validado en iPhone: Alef-Bet → Vocales → Palabras → Lectura → Reglas → Repaso.
4. La arquitectura visual mobile-first quedó aprobada con fichas para memoria, tablas para comparación, listas nativas para recorrido y detalle para profundizar.
5. Se validaron Alef-Bet, niqqud, vocabulario, lectura real del corpus, reglas iniciales, Repaso local, teclado hebreo opcional y centrado pedagógico transversal.
6. No se crearon nuevas tablas, RLS, grants ni funciones sensibles de Supabase durante el cierre del bloque.
7. La evidencia técnica quedó protegida por regresiones y CI verde; el PR #286 permanece DRAFT y sin merge.

### Bloque 2 — Fundamentos de lectura y gramática progresiva — COMPLETADO Y APROBADO — 2026-08-19

1. Profundizar formas finales (Sofit) mediante comparación normal → final, sonido y valores ordinarios; cualquier gematría extendida 500–900 debe etiquetarse expresamente como convención ampliada.
2. Enseñar Dagesh/Begadkefat de forma visual y cautelosa, distinguiendo los contrastes pedagógicos actuales de diferencias históricas dependientes de la tradición de lectura.
3. Incorporar matres lectionis y su función como ayudas vocálicas sin presentar las letras como vocales independientes en todos los contextos.
4. Ampliar niqqud con sheva vocal/silencioso, qamats qatan, pataj furtivo y patrones de lectura que permitan pasar de signo → sílaba → palabra.
5. Introducir raíces únicamente cuando exista raíz verificada en las fuentes aprobadas; no deducir raíces por heurística visual.
6. Continuar prefijos/sufijos, género/número, posesivos, constructo y gramática progresiva mediante tablas de transformación, ejemplos reales y práctica.
7. Conservar Repaso como práctica local mientras este bloque no requiera persistencia; cualquier progreso almacenado queda para una propuesta posterior con alcance, privacidad, RLS e impacto explícitos.
8. No incorporar audio como pronunciación oficial hasta contar con fuente/metodología confiable y licencia compatible.
9. Se implementaron y validaron en iPhone Sofit, Dagesh/Begadkefat, matres lectionis, niqqud avanzado, lectura silábica, gramática nominal, primer mapa verbal Qal y Repaso ampliado.
10. El mapa verbal conserva qatal/yiqtol, imperativo, participio, infinitivo constructo, wayyiqtol y weqatal sin reducir qatal a “pasado”, yiqtol a “futuro” ni wayyiqtol a una inversión mecánica de tiempo.
11. La auditoría de raíces confirmó que las fuentes actuales no entregan una raíz explícita verificable; VIDA no deduce raíces por heurística.
12. El checklist móvil `docs/FASE_H_BLOQUE_2_CHECKLIST_MOVIL.md` fue recorrido y aprobado explícitamente por el usuario el 2026-08-19 sin bugs bloqueantes reportados.
13. El head `600a516d4bbe2c990f09aa373b2ef637fa601585` tuvo CI temporal #2358, regresiones, lint, build, validador maestro y validadores TAHOT en verde.
14. Vercel sirvió ese mismo head en Preview READY mediante `dpl_4pbkYgLGWtALemEgNfav3RrvmUvr`; PR #286 permanece DRAFT y sin merge.

### Bloque 3 — Cobertura léxica progresiva y búsqueda inteligente — COMPLETADO Y APROBADO — 2026-08-22

1. `Palabras` resuelve búsquedas por español, hebreo, Strong y transliteración sin crear un segundo léxico paralelo.
2. Las formas hebreas flexionadas se resuelven mediante `biblical_word_occurrences.lexical_entry_id` hacia el lema aprobado correspondiente.
3. `biblical_lexical_entries` permanece como autoridad léxica; ninguna búsqueda automática reescribe lema, glosa fuente, definición ni estado editorial.
4. `biblical_hebrew_search_resolutions` funciona como índice derivado reutilizable y reversible, con relación, confianza, evidencia y procedencia, sin convertirse en fuente léxica autoritativa.
5. Las coincidencias contextuales derivadas de RV1909 permanecen como evidencia contextual y no equivalencia automática palabra-a-palabra sin glosa española aprobada.
6. El índice derivado no guarda identidad del usuario ni historial personal de búsquedas; solo claves normalizadas con relación verificable.
7. La lectura del índice está limitada a cuentas autenticadas activas; `anon` no tiene acceso y el cliente no escribe. Las escrituras derivadas se ejecutan server-only mediante service role.
8. La cobertura española editorial quedó cerrada técnicamente en **10,737 / 10,737** entradas hebreas aprobadas/habilitadas, con **0 pendientes** y el lote final de 1,816 filas reversible por `batch_id`.
9. El traductor práctico Español ⇄ Hebreo quedó integrado como superficie breve: palabra exacta prioriza diccionario aprobado y frase/fallback usa VIDA AI del lado servidor; muestra traducción/significado, pronunciación orientativa escrita, copiar y escuchar, sin Strong, morfología, ocurrencias ni transliteración técnica.
10. La experiencia fue reorganizada según la pedagogía aprobada: Inicio como hub compacto; `Aprender` en página propia; Alef-Bet/Sofit/Dagesh/Matres, Vocales/Sheva, Palabras/Frases, Lectura bíblica, Reglas y Repaso conservan orden progresivo y superficies integradas.
11. `Palabras` separa vocabulario bíblico de frases útiles curadas; `Lectura` funciona como lector bíblico por libro/capítulo; el teclado hebreo integrado conserva 22 letras, 5 Sofit, Niqqud, Dagesh y signos bíblicos sin parecer panel externo.
12. El usuario recorrió y aprobó la validación funcional/visual en iPhone el **2026-08-22**, incluyendo la ronda final del teclado integrado, sin bugs bloqueantes reportados.
13. El head aprobado `9d29a3cea6b8f5db44ac8646b56b41a6677f9e5a` tuvo regresiones, lint, build, validador maestro y validadores TAHOT en verde; Vercel Preview quedó READY. PR #286 permanece OPEN · DRAFT · sin merge y no se hizo deploy de producción.

### Bloque 4 — Progreso personal y práctica adaptativa — COMPLETADO Y APROBADO — 2026-08-23

1. `Prueba tu progreso` funciona como instructor personal con historial real por usuario y no como una nota final aislada.
2. Las sesiones e intentos guardados permiten derivar dominio, mejora, refuerzo, retención, precisión, tendencia, fluidez y tiempo típico sin tablas estadísticas duplicadas.
3. Los ejercicios conservan habilidades verificables: Alef-Bet, reconocimiento visual, Sofit, Dagesh, Niqqud/vocales, Sheva, vocabulario, lectura y reglas.
4. Quedaron operativos los caminos **Según mi progreso** y **Elegir nivel**, con Básico, Intermedio y Avanzado, además de selección de áreas y cantidad de preguntas.
5. `Quiero repasar` y Repaso reutilizan el historial privado sin alterar artificialmente el cálculo de dominio.
6. Cada respuesta se valida y guarda antes de avanzar; errores entran a prioridad de refuerzo y aciertos salen de la rotación normal hasta el control de retención.
7. Al terminar se muestran resultados, fortalezas, refuerzos y recomendación de continuidad; los logros y estados se derivan únicamente de intentos reales y el dominio fundamental se limita a 100%.
8. La persistencia utiliza únicamente `biblical_hebrew_progress_sessions` y `biblical_hebrew_progress_answers`, aisladas por propietario y cuenta activa. `anon` no tiene acceso.
9. Las migraciones aplicadas y versionadas son `20260822235632_fase_h_progreso_adaptativo`, `20260822235704_fase_h_progreso_adaptativo_restringir_grants` y `20260823145500_fase_h_progreso_tiempo_respuesta`.
10. La práctica oral quedó como checkpoint independiente y como modalidad propia de voz: micrófono real, reconocimiento `he-IL`, espectro ligado al nivel real de la señal, confirmación de respuesta enviada y feedback correcto/repaso antes de avanzar.
11. Se corrigieron los fallos reproducibles de iPhone/Safari: reinicio de micrófono/AudioContext entre intentos, control de `error` + `onend`, timeout de seguridad y reintento transitorio controlado.
12. Las respuestas largas usan ancho móvil suficiente y las superficies de Prueba, submenús, Personalizar práctica e historial/resultados comienzan cerradas para reducir saturación y scroll.
13. El usuario validó manualmente en iPhone el checkpoint oral, intentos consecutivos, espectro real, feedback ✓/✕, evaluación completa, resultado final y persistencia del progreso al salir y volver a entrar.
14. Las pruebas manuales específicas en Android quedan diferidas para una validación posterior y no bloquean el cierre de FASE H; la compatibilidad implementada no se elimina.
15. El head final aprobado `31e89605fcb9e4d8bff1d2d29e9c6c6e1a19364e` tuvo `CI temporal` #3090, validador del documento maestro, TAHOT Obadías y esquema observado TAHOT en **PASS**.
16. PR #286 permanece OPEN · DRAFT · sin merge al momento de este cierre documental; no se hizo deploy manual a producción.

## Cierre formal de FASE H — 2026-08-23

Los cuatro bloques de FASE H quedan **COMPLETADOS Y APROBADOS**. El Centro de Hebreo Bíblico conserva la arquitectura didáctica, cobertura léxica española completa, búsqueda inteligente, traductor práctico, lectura bíblica, gramática progresiva, Repaso, teclado hebreo, práctica adaptativa, progreso privado y checkpoint oral validados. FASE H no debe reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE I — DIFERIDA HASTA EL CIERRE FINAL — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL

FASE I se realizará al final del desarrollo de VIDA Internacional, cuando la aplicación y sus herramientas hayan quedado terminadas y aprobadas.

La razón de esta decisión es funcional: la guía debe enseñar la versión definitiva de la aplicación. No debe desarrollarse mientras todavía se reorganizan, pulen o completan herramientas, porque eso obligaría a rehacer recorridos y explicaciones posteriormente.

El alcance ya definido para FASE I se conserva íntegramente y no se elimina. Queda simplemente diferido hasta el cierre final de la aplicación.

## Objetivo

Dar a cada persona una guía dentro de VIDA sin depender de capacitación presencial ni reactivar el Piloto Operativo.

## Alcance

1. Recorrido inicial opcional por primera vez mediante globos/contextos breves anclados a herramientas reales.
2. Contenido dinámico por rol y permisos: Administrador, Pastor, Líder y Servidor solo verán explicaciones de funciones que realmente pueden utilizar.
3. Posibilidad de omitir el recorrido y volver a iniciarlo manualmente desde Ayuda/Perfil.
4. Centro de guía interactiva con explicaciones cortas por módulo, acciones frecuentes y recorridos específicos cuando una superficie sea compleja.
5. El recorrido debe usar la interfaz real, no una réplica separada que pueda quedar desactualizada.
6. Sin telemetría del Piloto por defecto; cualquier medición futura deberá ser explícita, agregada y respetuosa con la privacidad.
7. Accesibilidad, áreas táctiles cómodas, lenguaje breve y coherencia con la experiencia mobile-first de VIDA.

## Centro Pastoral — Editor visual · checkpoint aprobado — 2026-08-31

1. Fondos conserva la galería general aprobada y amplía personalización mediante Rueda de color con tono, saturación, luminosidad y texturas seleccionables.
2. Las texturas personalizadas se muestran como muestras circulares dentro de Rueda de color.
3. Se incorpora Degradados junto a Rueda de color e Imágenes, con creación de degradados lineales, radiales y cónicos, dirección configurable, segundo color y opción para guardar el resultado en la galería general.
4. Las imágenes conservan conversión Imagen ↔ Fondo sin duplicar la misma instancia cuando corresponde.
5. Capas abre directamente sin subpestaña redundante y concentra Nueva capa, Opacidad y Fusión en una sola fila horizontal compacta.
6. Las miniaturas de Capas muestran el contenido real de cada capa y el swipe izquierdo conserva acciones contextuales.
7. Los fondos desbloqueados pueden moverse y escalarse mediante gestos igual que las imágenes.
8. Los textos y versículos insertados en el lienzo permanecen editables directamente mediante cursor, selección y borrado de contenido parcial.
9. Biblia conserva español y texto original; AT usa hebreo y NT griego. En hebreo se mantiene jerarquía propia del libro y exploración puntual de palabras.
10. La exploración léxica prioriza datos bíblicos existentes de VIDA; cuando una explicación no está disponible, la IA integrada puede actuar como respaldo claramente identificado como explicación IA.
11. Se confirma persistencia real del Editor Pastoral: Guardar y autoguardado conservan páginas, textos, imágenes, capas, posiciones, opacidad, fusión, fondos y degradados lineales, radiales y cónicos. El estado de guardado se comunica únicamente mediante el check superior, sin toast de “Proyecto guardado”.
12. Checkpoint técnico aprobado del bloque: `f3d54260f998e83c93440622df26ef34aa1f0052`; PR #287 permaneció OPEN · DRAFT durante la validación y fue cerrado al preparar la integración final aprobada.

## CENTRO PASTORAL · REORGANIZACIÓN Y CIERRE DEL EDITOR VISUAL — CERRADO Y APROBADO — 2026-09-01

El Centro Pastoral queda funcional y visualmente aprobado.

Cierre confirmado:
- Editor visual estable preservando Fondos, Texto, Capas, Biblia, imágenes, guardado y Deshacer/Rehacer.
- Navegación principal del editor: Editar · Presentar · Compartir.
- Presentar integra Horizontal y Vertical; pantalla completa muestra únicamente la diapositiva.
- Vista vertical y experiencia para la congregación integradas dentro de VIDA, sin superficies tipo “card dentro de card”.
- Paquetes pastorales muestran Presentación y Estudio.
- Enviar paquete al Cuaderno abre directamente el paquete guardado dentro del Cuaderno, seleccionado y listo para trabajar.
- Los paquetes utilizan icono de libro.
- Marcar como importante se representa mediante destello dorado.
- Skeleton del Centro Pastoral alineado con la estructura visual actual.
- Interacción táctil del paquete de Inicio aislada correctamente sin afectar los efectos de Ministerios.
- Preview de validación estable: `https://calendario-git-agent-centro-pastoral-cb1651-vida-internacional.vercel.app`.
- Integración a `main` y publicación en producción autorizadas explícitamente por el usuario el 2026-09-01.

No reabrir Centro Pastoral salvo bug comprobable o una nueva prioridad explícitamente documentada.

### Ajuste posterior aprobado — Organización del Centro Pastoral

La portada del Centro Pastoral queda organizada así:
- En preparación: muestra borradores recientes para continuar trabajando.
- Nuevo proyecto: crea directamente un proyecto nuevo.
- Proyectos: único lugar para administrar todos los proyectos existentes.
- Proyectos incluye búsqueda, filtros Todos · Borradores · Listos · No publicados · Publicados y vistas Tarjetas · Lista · Miniaturas.
- La antigua separación “Mis proyectos / Publicados” queda eliminada por redundancia.
- Estudio y Biblioteca permanecen como herramientas auxiliares.
- Bosquejos, colecciones de versículos y Biblia permanecen disponibles internamente, pero fuera del nivel principal.

### Ajuste posterior aprobado — Analíticas de Estudio, Theographic y geografía bíblica

- Analíticas avanzadas de Estudio habilitadas para pasajes, libros, temas, búsquedas, recurrencia, sesiones anónimas, resultados y tiempo de uso, sin mostrar usuarios, perfiles ni notas personales.
- Corpus Theographic habilitado con 450 eventos narrativos y 17,570 referencias aprobadas, presentado dentro de VIDA como Secuencia narrativa, con títulos en español y sin exponer metadata técnica.
- Geografía bíblica incorpora recorridos gráficos del Éxodo, los tres viajes misioneros de Pablo y el viaje de Pablo a Roma.
- Los recorridos se muestran sobre mapa geográfico real, con paradas numeradas, lugar bíblico, identificación actual cuando existe, nivel de certeza y acceso a la ubicación actual.
- Las líneas representan el orden narrativo de las paradas y no se presentan como reconstrucción exacta de caminos históricos.
- Tabla histórica de respaldo de FASE H asegurada mediante RLS y retiro de acceso público/autenticado, conservando íntegramente sus datos.
- Limpieza técnica realizada sobre PR antiguos correspondientes a fases ya cerradas.
- Preview validado por el usuario: `https://calendario-git-agent-centro-pastoral-cb1651-vida-internacional.vercel.app`.

# PRIORIDAD ACTIVA — EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I

Esta prioridad reúne las últimas funciones nuevas que deben completarse antes de iniciar FASE I — Guía interactiva y ayuda contextual por rol.

Orden aprobado:

## Bloque 1 — Versículo del día y Planes de lectura — COMPLETADO Y APROBADO — 2026-09-02

Objetivo:
Hacer VIDA útil también para personas que todavía no pertenecen a la iglesia, de manera que puedan acercarse a la Biblia y conocer VIDA posteriormente por medio de la utilidad real de la aplicación.

Alcance:
- Versículo del día utilizando contenido bíblico aprobado.
- Posibilidad de recibir el versículo mediante recordatorio/notificación configurable.
- Planes de lectura bíblica progresivos.
- Planes accesibles también para personas que no pertenecen a VIDA Internacional.
- Integración natural con Biblia y Centro de Estudio existentes, sin crear motores bíblicos paralelos.
- Hebreo Bíblico, Biblia, Estudio y estas nuevas herramientas forman parte de la capa de utilidad abierta de VIDA.
- Las funciones internas de iglesia, ministerios y administración conservan sus permisos actuales.
- El objetivo no es convertir la portada en publicidad de la iglesia, sino permitir que una persona conozca VIDA mediante herramientas útiles y después pueda descubrir actividades y comunidad.

Cierre aprobado:
Versículo diario y recordatorio configurable integrados con la Biblia aprobada. Catálogo de 12 planes temáticos con progreso y rachas. Centro Pastoral permite a Pastor/Admin crear, editar, autoguardar, publicar y eliminar sus planes, conservando borradores parciales y bloqueando publicación hasta completar todos los días. Los planes son accesibles a cualquier usuario con cuenta, pertenezca o no a VIDA Internacional.

## Bloque 2 — Ayuda y Sembrar — COMPLETADO Y APROBADO — 2026-09-03

Objetivo:
Hacer que pedir ayuda sea sencillo, privado, digno y empático, y que ayudar también sea fácil.

Alcance aprobado:
- Entrada clara “Necesito ayuda” sin lenguaje que haga sentir vergüenza a la persona.
- Posibilidad de explicar una necesidad de manera sencilla y discreta.
- “Quiero sembrar” permite preguntar cómo ayudar cuando la persona no sabe qué hace falta.
- Mostrar necesidades reales de la despensa, priorizando aquello que actualmente tenga menor existencia.
- Permitir sembrar no solo alimentos: tiempo, transporte, herramientas, objetos, conocimientos, oficios, habilidades u otras formas de servicio.
- Facilitar comunicación directa únicamente con las personas autorizadas necesarias.
- Preservar privacidad y no mostrar públicamente información sensible de quien solicita ayuda.

Cierre aprobado:
- Centro de Ayuda unificado para usuarios y equipo autorizado, preservando privacidad y evitando accesos redundantes para Pastor/Administrador.
- Paquete de despensa y otra ayuda simplificados; conversaciones privadas integradas como chat directo.
- Inventario de despensa, composición de paquetes y descuento automático al registrar una entrega.
- Necesidades no materiales administrables — habilidades, oficios, transporte, conocimientos y otras formas de servicio.
- Historial privado de siembras y agradecimientos sin rankings públicos.
- Datos bancarios oficiales centralizados en Configuración avanzada para reutilización controlada dentro de la app.
- Experiencias desplegables nuevas inician contraídas y vuelven a ese estado al reingresar.
- Contraste de campos y textos corregido dentro del Centro de Ayuda.
- Sistema de badge-guía validado en Ayuda Solidaria: un pendiente conduce desde el acceso general hasta la conversación exacta y desaparece al quedar leído.
- La extensión del patrón de badges a otras áreas queda diferida hasta completar los bloques funcionales pendientes.

## Bloque 3 — Experiencia para músicos — ACTIVO

Objetivo:
Convertir el repertorio/programación musical existente en una herramienta utilizable durante el servicio y no únicamente en una lista de canciones.

Alcance previsto:
- Setlist ordenado del servicio.
- Vista práctica de canción, tono, acordes y contenido necesario para tocar.
- Navegación rápida entre canción actual, anterior y siguiente.
- Posibilidad de transponer las notas/acordes cuando sea necesario.
- El líder autorizado puede cambiar tono, transponer y modificar la versión oficial de acordes.
- Los músicos pueden consultar y utilizar la versión preparada, pero no alterar la versión oficial sin permiso.
- Preservar Programación Ministerial, repertorio, permisos e historial existentes.

## Bloque 4 — Alertas pastorales urgentes

Este bloque se desarrollará de forma separada debido a privacidad, permisos y notificaciones sensibles.

Objetivo:
Diferenciar una consulta normal de una situación que necesita atención pastoral rápida.

Alcance previsto:
- Mensajes normales siguen su flujo habitual.
- Situaciones urgentes pueden elevarse a un nivel de atención pastoral.
- Situaciones críticas de bienestar, fallecimiento u otras emergencias pueden generar una alerta simultánea para pastores/líderes autorizados.
- No diagnosticar automáticamente a una persona.
- Mantener privacidad y mostrar únicamente la información necesaria a quienes tengan autorización.
- Antes de implementar cambios de permisos, RLS, destinatarios de alertas o datos sensibles se presentará exactamente el cambio, impacto y reversión para aprobación explícita.

FASE I continúa DIFERIDA hasta completar, validar y cerrar estos cuatro bloques.

# Siguiente prioridad autorizada

**Bloque 3 — Experiencia para músicos — ACTIVO.**