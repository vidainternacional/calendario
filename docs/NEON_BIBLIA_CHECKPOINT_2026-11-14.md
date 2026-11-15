# VIDA — Rescate sin costo: checkpoint de migración bíblica
Fecha: 2026-11-14
Rama independiente: agent/migracion-biblia-neon-20261114
Objetivo actual: restaurar acceso a la app sin contratar plan, manteniendo Supabase Auth/usuarios y contenido bíblico compartido en dos Neon Free.

> **ESTADO MÁS RECIENTE — 2026-11-15:** migración completa, PR #304 integrado y lector Neon publicado en producción. Con autorización explícita se vació únicamente `public.biblical_word_occurrences` en Supabase: ahora **0 filas**, base **319,425,683 bytes**. Neon conserva **469,302 AT + 142,096 NT** y el respaldo completo está verificado. El API de Supabase todavía devuelve **HTTP 402 / exceed_db_size_quota** pese a estar por debajo de 500 MB; **acceso autenticado no recuperado todavía**. No repetir la copia ni el vaciado. Los apartados previos describen fotografías históricas.


## Estado confirmado (consulta directa)
- Supabase calendariovida (atjtjpchslxbseayzflz): biblical_word_occurrences 611398 filas y biblioteca bíblica todavía intacta; base ~1277668499 bytes. Restricción reportada exceed_db_size_quota; despliegue Vercel READY no significa inicio de sesión funcional.
- Neon A rough-glitter-04635242: 59459 ocurrencias del Antiguo Testamento.
- Neon B curly-scene-97670657: 19658 ocurrencias del Nuevo Testamento y 9133 del Antiguo Testamento.
- Total contabilizado entre destinos: 88250 filas; NO equivale a 88250 claves únicas verificadas contra origen.
- Ambos Neon cuentan además con 16 fuentes, 66 libros y 16946 entradas léxicas ya copiadas (validadas por conteo previamente).
- Detectada inconsistencia de distribución: Neon B contiene registros del Antiguo Testamento. Se ha pausado la copia masiva hasta estabilizar criterio y verificar duplicados. No borrar datos de ninguno.
- La integración de lectura con Neon, la validación completa, el cambio a Vercel y la liberación de espacio en Supabase siguen pendientes.

## Forma de trabajo acordada — fases cortas
1. **Checkpoint y estrategia**: auditar ubicación de lo ya copiado, fijar distribución por capacidad y asegurar lotes reanudables. Este documento es el checkpoint inicial; continuar solo cuando se pueda verificar sin mezclar destinos.
2. **Copia controlada**: un lote finito por intervención, registrar cursor y cantidad de registros originales/recibidos y hashes si posible. No confiar solo en el mayor UUID global cuando hay destinos con escrituras parciales; evitar traslado de información personal.
3. **Completar corpus**: textos, variantes, glosarios, concordancias, contexto, cronología y geografía, aplicando esquema compatible, índices y relaciones; comprobar límites gratuitos de ambos proyectos.
4. **Lectura segura**: backend server-only a Neon; mantener Supabase para Auth, perfiles, ministerios, notas personales y progreso bíblico; Preview único + CI/regresión.
5. **Recuperar cuota**: solo después de copia íntegra, pruebas y respaldo verificable, presentar listado de objetos a eliminar, impacto y reversión y pedir aprobación explícita. No eliminar ni modificar RLS sin autorización.

## Guardrails
No gastos, no merge a main, no producción, no borrados, no alteración de permisos ni datos sensibles sin autorización. Conservar los PR pendientes. El objetivo de acceso no está resuelto hasta comprobar login en vivo.


## Conciliación confirmada — 2026-11-14 (avance posterior al checkpoint inicial)

Las cantidades del bloque anterior son una fotografía histórica, no el inventario final actual. Se observaron inserciones adicionales en Neon durante la inspección, sin cambios en la rama GitHub; por ello, los conteos de las bases pueden seguir aumentando. No se atribuyen esas inserciones a esta rama ni se ejecutó una segunda copia masiva de versículos en esta intervención.

### Glosas en español — copia completa y verificada
- Origen Supabase `biblical_hebrew_spanish_glosses`: **10,737 registros**.
- Neon A y Neon B: **10,737 registros cada uno**.
- Huella de todas las filas en el mismo orden (incluyendo marcas de tiempo y metadatos JSON de precisión numérica exacta), idéntica en origen y ambos destinos: `e21a4f23f3b319c3a78caf9916c30cb1`.
- Se corrigieron diferencias de precisión decimal del campo `provenance`, ocasionadas por una serialización JSON previa. Las nuevas copias usan el texto JSON original de PostgreSQL y reconstrucción `::jsonb`.
- Estas glosas son contenido editorial compartido, no progreso personal. No se borraron filas originales.

### Reconciliación de ocurrencias del Antiguo Testamento
- Neon B contenía **9,133 ocurrencias de AT** antes del reparto definitivo.
- Antes de esta conciliación, **2,325 identificadores** ya estaban también en Neon A y **6,808** solo existían en B.
- Se trasladaron desde el origen Supabase las filas faltantes a Neon A de manera idempotente, sin modificar el original y sin eliminar las copias en B.
- Verificación posterior: **9,133/9,133 identificadores** de AT existentes en Neon B están presentes en Neon A.
- Validación del contenido: **5 de 5 lotes** (2,000 + 2,000 + 2,000 + 2,000 + 1,133 filas) tienen conteos y huellas `md5(to_jsonb(fila)::text)` agregadas idénticas entre Supabase y Neon A.
- Nota: Neon A también tiene registros AT fuera de este subconjunto; los **469,302** registros AT del origen **no** están copiados íntegramente todavía.

### Límites y separación definitiva
- **Neon A (Léxico):** ocurrencias AT, entradas léxicas, glosas, resolución de búsqueda hebrea y catálogos compartidos necesarios para sus relaciones.
- **Neon B (Textos):** ocurrencias NT, textos/versículos, concordancias, variantes, geografía, cronología, contexto, biblioteca y catálogos compartidos necesarios.
- Los **9,133 registros AT extra en Neon B** se conservan por seguridad hasta tener respaldo integral, integración validada y autorización explícita para cualquier borrado.
- Cada proyecto Neon Free tiene un máximo observado de **1 GiB** de tamaño lógico por rama. En una comprobación durante este avance, la base A ocupaba **136,339,456 bytes** y la B **186,277,888 bytes** (valores variables mientras existan copias en curso). La proyección desde los tamaños actuales de Supabase sugiere que el reparto AT/NT cabe en los límites, pero el margen se debe confirmar conforme avancen índices, textos y otros contenidos.
- **Las dos tablas personales `biblical_hebrew_progress_sessions` y `biblical_hebrew_progress_answers` permanecen en Supabase**. Los campos de aprobación `approved_by` en ocho tablas editoriales auditadas tenían 0 valores no nulos. No transportar perfiles, sesiones, notas ni progreso personal a Neon.
- La base de origen Supabase aún tiene **611,398 ocurrencias** y **124,504 versículos**; no se realizaron eliminaciones, cambios RLS ni operaciones de cuotas/planes.

### Siguiente operación segura
1. Confirmar el estado/cursor de las copias que siguen activas antes de volver a escribir en tablas compartidas; evitar dos procesos de migración simultáneos.
2. Completar el inventario por **tabla, clave y hash**, no solo sumar filas en destinos que contienen duplicados.
3. Para los lotes restantes, usar la representación `to_jsonb(fila)::text` del origen, reconstruir como `jsonb` en destino y verificar las filas insertadas; preservar reanudación por clave primaria y comprobar tamaño real después de cada bloque.
4. Solo después de completar y validar ambas bases, implementar consultas **server-only** a Neon, configurar secretos en Preview y probar regresiones. No alterar autenticación ni permisos.
5. Supabase conserva todos los datos originales hasta disponer de respaldo verificable, lista exacta de objetos a retirar, plan de reversión y aprobación expresa. El bloqueo de cuota no queda resuelto por la existencia de copias en Neon.


## Lote comprobado — 2026-11-14 — Textos / Primera de Juan (1JN)

- Origen: Supabase `calendariovida`, tabla pública editorial `biblical_verse_texts`, `book_code='1JN'`.
- Destino: Neon B `Calendario Vida Biblia - Textos` (`curly-scene-97670657`), misma tabla.
- Lote delimitado: **420/420 filas** originales leídas por UUID; reconstrucción desde `to_jsonb(fila)::text`, con `ON CONFLICT (id) DO NOTHING`.
- Resultado de inserción: **126 filas nuevas**; otras **294 ya existían** en destino.
- Revisión posterior de todas las filas del libro: Supabase **420**, Neon B **420**; huella ordenada `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` idéntica en ambos: `1d3cc6cd0b28e659779b24a8e084c22f`.
- Integridad: no se borraron filas originales, no se tocaron perfiles, autenticación, progreso, notas, RLS, permisos, ni otras tablas.
- Este cierre certifica **solo 1JN**; no certifica que el corpus bíblico ni la migración completa estén terminados. Fase C continúa EN CURSO.
- Detectada discrepancia documental independiente: el maestro de `main` todavía indica Discipulado como prioridad, con última actualización 2026-09-07. No se editó el maestro ni se reabrió Discipulado.


## Lote validado — 2026-11-14 — Ocurrencias NT y AT (8 libros)

Se continuó exclusivamente la transferencia **editorial compartida** de `public.biblical_word_occurrences` desde Supabase `calendariovida` hacia la base Neon asignada por testamento, conservando el origen intacto. Cada lote se leyó desde el original como `to_jsonb(fila)::text`, se reconstruyó con `jsonb_populate_recordset` y se insertó con `ON CONFLICT (id) DO NOTHING`. Antes de cada escritura se verificó libro, UUID único y `approved_by IS NULL`. No se trasladaron datos personales ni se tocó autenticación, RLS, permisos o producción.

### Neon B — Textos, ocurrencias del Nuevo Testamento

| Libro | Filas del origen y destino | Insertadas ahora | Hash de todas las filas, ordenadas por UUID |
|---|---:|---:|---|
| 3JN | 221 | 196 | `57dd15963a4f1452a4bbe16c4e747f7b` |
| PHM | 349 | 298 | `f46a4adfa7aff0133f86d4d60bd16263` |
| TIT | 680 | 582 | `a009a01f13281e6ce5a8670bc248c582` |
| 2PE | 1,112 | 978 | `a17d22c8144895937543094d712e431d` |
| 1PE | 1,734 | 1,489 | `1a7a9443f0c26963e071a6f74e056636` |

### Neon A — Léxico, ocurrencias del Antiguo Testamento

| Libro | Filas del origen y destino | Insertadas ahora | Hash de todas las filas, ordenadas por UUID |
|---|---:|---:|---|
| ZEP | 1,120 | 979 | `a76658b971f057b5d69d66dcd0b5b976` |
| JON | 1,080 | 906 | `578632fb7646b811cf28ca223e136f08` |
| MAL | 1,302 | 1,132 | `8d8ee703a605288e4008e12691a8fa38` |

### Certificación del bloque

- **8 libros completos y cotejados**, **7,598 filas originales** idénticas en el destino correcto; **6,560 filas nuevas** insertadas en total. Los ocho conteos y hashes `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` se compararon directamente entre origen y destino tras las inserciones. No equivalen a una migración bíblica terminada.
- Lectura posterior: Neon A tiene **70,470 ocurrencias**, `pg_database_size` **140,615,680 bytes**; Neon B tiene **32,945 ocurrencias**, `pg_database_size` **254,599,168 bytes**. A y B permanecen por debajo de 1 GiB por proyecto según consulta actual; son cifras temporales.
- Supabase conservó **611,398 ocurrencias** y su tamaño no se redujo: **1,277,668,499 bytes**. Recuperación de acceso **PENDIENTE**.
- Neon B mostró además aumento de `biblical_verse_texts` a **101,611 filas** desde una observación previa de **90,095** sin que esta intervención escribiera esa tabla. No atribuir el aumento a estos lotes; comprobar posibles procesos simultáneos antes de trabajar en versículos.
- Pendientes: validar resto del corpus con claves y huellas, integración server-only, Preview con acceso funcional, respaldo y posterior recuperación de cuota con autorización expresa. Sin merge a `main` ni producción.


## Copia controlada adicional — 2026-11-14 — ocho libros

Se continuó la Fase C mediante lotes de filas editoriales de `public.biblical_word_occurrences`, serializadas como `to_jsonb(fila)::text` desde Supabase y reconstruidas con `jsonb_populate_recordset` en Neon. Escritura idempotente `ON CONFLICT (id) DO NOTHING`. Cada libro marcado como completo fue cotejado con `COUNT(*)` y la huella ordenada `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` en ambas bases. Las tablas personales, usuarios, permisos, producción y originales permanecieron intactos.

### Antiguo Testamento — Neon A (Léxico)

| Libro | Registros en Supabase | Registros en Neon A | Nuevos insertados en esta intervención | Huella idéntica |
|---|---:|---:|---:|---|
| Jonás (JON) | 1,080 | 1,080 | 0 (ya completos al revisar) | `578632fb7646b811cf28ca223e136f08` |
| Sofonías (ZEP) | 1,120 | 1,120 | 0 (ya completos al revisar) | `a76658b971f057b5d69d66dcd0b5b976` |
| Malaquías (MAL) | 1,302 | 1,302 | 0 (ya completos al copiar) | `8d8ee703a605288e4008e12691a8fa38` |
| Nahúm (NAM) | 828 | 828 | 692 | `2c4517497d7a94f1c7fcacf33a1bf513` |
| Joel (JOL) | 1,438 | 1,438 | 1,247 | `3ff3b72a7473e35a3e6d8e80f57f868d` |
| Miqueas (MIC) | 2,105 | 2,105 | 1,825 | `9f8b76a820172a5dc2ec9e7052294023` |
| Rut (RUT) | 2,026 | 2,026 | 1,737 | `48081285c2d099bc94122fd49a82da38` |
| Habacuc (HAB) | 1,000 | 1,000 | 875 | `a74db52059bd71271e3a11269d0c9094` |
| Lamentaciones (LAM) | 2,238 | 2,238 | 1,932 | `990e128240457812049254cc36ad77cd` |

**Resultado comprobado en esta continuación: 8,308 filas nuevas añadidas a Neon A** en seis libros incompletos. El contador de filas de origen y destino y las huellas son iguales para los nueve libros indicados. En la consulta final, Neon A contenía 78,778 ocurrencias y 152,395,776 bytes de tamaño PostgreSQL de base; esta cifra total no es prueba de integridad del corpus completo.

### Nuevo Testamento — Neon B (Textos) — lote anterior también verificado

En un bloque anterior de esta misma conversación se copiaron y validaron libros completos desde Supabase: 3 Juan (221 filas, +196, digest `57dd15963a4f1452a4bbe16c4e747f7b`), Filemón (349, +298, `f46a4adfa7aff0133f86d4d60bd16263`), Tito (680, +582, `a009a01f13281e6ce5a8670bc248c582`), 2 Pedro (1,112, +978, `a17d22c8144895937543094d712e431d`) y 1 Pedro (1,734, +1,489, `1a7a9443f0c26963e071a6f74e056636`). **3,543 filas nuevas**, ya verificadas, adicionales a los 126 versículos de 1 Juan documentados antes.

### Estado global al consultar (fotografía; puede variar si existe otra copia en paralelo)

- Supabase conserva **611,398 ocurrencias** y **124,504 textos/versículos**; tamaño PostgreSQL de base: **1,277,668,499 bytes**. No se eliminó nada.
- Neon A: **78,778 ocurrencias**.
- Neon B: **32,945 ocurrencias**, **104,911 textos/versículos**. Existen registros AT duplicados entre ambos Neon por diseño temporal de seguridad; NO sumar los contadores para afirmar claves únicas migradas.
- Las cantidades de Neon B han seguido variando respecto de controles anteriores, posiblemente por otros procesos. Antes de cualquier copia masiva nueva, comprobar escrituras en curso y reconciliar por clave/huella.
- Fase C **EN CURSO**. No se ha integrado Neon a la app, no se ha liberado cuota en Supabase, no se ha probado el login. No gastos, RLS, permisos, borrados, merge ni despliegue de producción.


## Certificación Fase C — textos íntegros y tablas complementarias

Fecha local: **2026-11-14**. Trabajo limitado a copia editorial de Supabase `calendariovida` → Neon B `curly-scene-97670657`, comprobación de Neon A `rough-glitter-04635242` y verificaciones de solo lectura. No se editó código de runtime, permisos, autenticación ni producción; no se borró el origen.

### Textos bíblicos: COPIA COMPLETA Y VERIFICADA

- Tabla: `public.biblical_verse_texts`.
- En el comienzo del bloque: **104,911** filas en Neon B frente a **124,504** del original. Se incorporaron los **19,593 registros faltantes** mediante inserciones idempotentes `ON CONFLICT (id) DO NOTHING` con reconstrucción exacta de datos fuente `to_jsonb(fila)::text`. Los lotes se eligieron por `book_code` y UUID, excluyendo los UUID ya presentes; `approved_by` tiene 0 valores no nulos en el original.
- Verificación final **por los 66 libros**: conteos exactos y huellas `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` idénticas entre Supabase y Neon B. Resultado global **66/66 libros**, **124,504/124,504 filas**, **0 libros discrepantes**.
- Confirmación adicional: las dos bases tuvieron **66 códigos de libro sin códigos extra en destino**. El dato de textos ya está íntegro, pero eso NO significa que la Biblia completa, la integración ni la recuperación del acceso estén terminadas.

### Otras tablas editoriales: 21/21 verificadas

Las siguientes **21 tablas** ya estaban completas en Neon B y fueron cotejadas en este bloque por **cantidad y huella de todas las filas**, con la huella calculada de forma independiente del orden: `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY md5(to_jsonb(fila)::text)))`. **21/21 huellas idénticas** a Supabase: `biblical_sources`, `biblical_books`, `biblical_lexical_entries`, `biblical_hebrew_spanish_glosses`, `biblical_hebrew_search_resolutions`, `biblical_timeline_event_references`, `biblical_textual_variants`, `biblical_place_references`, `biblical_places`, `biblical_timeline_events`, `biblical_context_units`, `biblical_context_fragments`, `biblical_concordance_occurrences`, `biblical_concordance_aliases`, `biblical_concordance_terms`, `biblical_verse_mappings`, `biblical_library_fragments`, `biblical_library_items`, `biblical_timeline_event_places`, `biblical_timeline_periods`, `biblical_versification_profiles`.

### Ocurrencias por palabra: INCOMPLETAS; no ejecutar copias superpuestas

- Un subconjunto de `biblical_word_occurrences` de NT se procesó con criterio idempotente. **2TI** ya tenía **1,273/1,273**, sin nuevas filas. En **1TH** se seleccionaron **1,308 identificadores faltantes** frente al corte inicial de Neon B y se insertaron directamente **478 filas nuevas**; durante los siguientes lotes aparecieron inserciones adicionales desde otro proceso no identificado. Al terminar, **1TH tenía 1,516/1,516** y **2TI 1,273/1,273** con huellas idénticas a Supabase. No se atribuyen las otras inserciones a esta intervención.
- Se observó **actividad concurrente**: Neon A pasó de **76,846** a **94,132** ocurrencias; Neon B pasó de **32,945** a **37,513** durante el trabajo. En Neon B existen **9,133 registros AT redundantes**, heredados y conservados, que NO deben sumarse como cobertura única. Esto exige identificar/coordinar la copia antes de escribir más en las mismas tablas. Ninguna fila duplicada se borró.
- Fotografía posterior: Neon A **94,132** ocurrencias AT y Neon B **28,380** ocurrencias NT + **9,133** AT redundantes. Reparto asignado **122,512** filas sobre **611,398** del origen, o **488,886 aún pendientes por conteo** (sin certificar aún huellas/UUID de todos los conjuntos parciales).
- `pg_database_size` aproximado: Neon A **174,997,504 bytes**, Neon B **283,680,768 bytes**, ambos bajo 1 GiB de tamaño de rama por proyecto; revisar en el próximo checkpoint porque pueden crecer.
- Supabase sigue intacto y restringido por exceso de cuota; NO iniciar limpieza hasta terminar la validación integral, tener respaldo/plan reversible y obtener autorización explícita.

### Siguientes pasos

1. Determinar qué proceso está alimentando activamente las ocurrencias y fijar exclusividad/cursor, evitando escrituras simultáneas en esas tablas.
2. Completar AT en Neon A y NT en Neon B con comprobación por identificador y huella, no por conteo global solamente; sin borrar los 9,133 AT redundantes de Neon B.
3. Integración **server-only** de lecturas bíblicas con Neon, mantener Supabase Auth, perfiles, notas y progreso; configurar Preview y pasar pruebas de regresión.
4. Después de validar backups, controles de acceso, compatibilidad y Preview, **presentar por separado** listado de datos bíblicos a retirar de Supabase, impacto y reversión; esperar aprobación para liberar cuota.
5. Verificar acceso real en la cuenta cuando Supabase sea funcional, antes de anunciar recuperación. Mantener rama separada de `main` y no producir merge sin autorización.


## Continuación confirmada — cinco libros NT y lote parcial 1JN

Fecha: **2026-11-14**. Durante esta continuación se transfirieron filas **editoriales compartidas** de `public.biblical_word_occurrences` (Supabase `calendariovida`) a Neon B `curly-scene-97670657` mediante lotes finitos de `to_jsonb(fila)::text`, reconstrucción `jsonb_populate_recordset` y escritura `ON CONFLICT (id) DO NOTHING`. Se rechazó cada lote si faltaba una fila, había UUID duplicado, `book_code` incorrecto o `approved_by` no era nulo. No se escribieron datos personales ni se tocó el origen.

| Libro NT | Filas del origen | Insertadas directamente ahora | Certificación `COUNT + MD5` en origen/destino |
|---|---:|---:|---|
| 2 Tesalonicenses (`2TH`) | 842 | 729 | `2f381fb926a85164769f6f49189d2928` |
| 2 Timoteo (`2TI`) | 1,273 | 73 | `39648dc36fe615dcdae8958ed6aaa562` |
| 1 Tesalonicenses (`1TH`) | 1,516 | 830 | `2fa5e81ae3c70503e1f5a12a9fb9af02` |
| 1 Timoteo (`1TI`) | 1,640 | 1,421 | `4814e789f5ab3d5f81fb0f0b5c0ec86e` |
| Colosenses (`COL`) | 1,636 | 1,396 | `0d9b62dbb791d42fd3ab1539213c04dd` |

**Certificado: 5 libros / 6,907 filas idénticas de extremo a extremo; 4,449 filas nuevas escritas por esta intervención.** Las cifras de inserciones no incluyen las que hayan realizado otros procesos concurrentes.

**1 Juan (`1JN`), ocurrencias (NO confundir con los 420 textos de 1JN que ya están completos):** origen **2,198** filas, destino comprobado **880**. Se procesaron los primeros **880** registros según UUID; **551** fueron nuevas inserciones idempotentes. El siguiente lote, a partir de `OFFSET 880`, falló dos veces por un error interno de la herramienta, incluso con menor tamaño; no se reintentó indefinidamente ni se marcó el libro completo. Reanudar desde ese punto tras diagnosticar conectividad y coordinar la copia concurrente. El conteo final de destino **880** y una huella parcial **`cbec17bb1487d4690793e086388695bc`** no certifican integridad del libro completo.

**Total atribuible a esta continuación: 5,000 nuevas filas** en Neon B, de las cuales 4,449 pertenecen a libros íntegros/cotejados y 551 a un libro aún incompleto. En una comprobación posterior, Neon A reportó **97,965** ocurrencias y Neon B **39,460** ocurrencias; Neon B reportó **124,504 textos bíblicos**, cifra compatible con la certificación previa de los 66 libros, pero no sumar ocurrencias A+B como UUID únicos por los registros AT redundantes. Ambas bases siguen sin integrar al runtime de VIDA. Supabase Auth y datos originales siguen intactos; el acceso continúa pendiente por cuota. Se detectó crecimiento concurrente de A/B y se detuvieron nuevas escrituras para evitar interferir con otro proceso; primero coordinar origen/cursor antes de reanudar.


## Conciliación adicional — 2026-11-14 — textos completos y ocho libros AT

### Verificación completa de textos en Neon B

- `public.biblical_verse_texts` tiene en Supabase origen **124,504 filas** y en Neon B **124,504 filas**, distribuidas entre los **66 libros**.
- Se comparó directamente cada libro por `count(*)` y `md5(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id))`. **66/66 libros coinciden en cantidad y huella íntegra de filas; 124,504/124,504 filas verificadas**. No se atribuye toda la copia a esta sesión: Neon B aumentó de forma concurrente mientras se verificaba.
- Las **21 tablas editoriales auxiliares** presentes en Neon B (léxico, glosas, catálogos, concordancias, variantes, cronología, geografía, contexto y biblioteca) se compararon con el origen: **21/21 coincidieron en recuentos y huella agregada de todas sus filas**.
- No confundir textos completos con corpus migrado: `biblical_word_occurrences` sigue incompleto en ambos destinos, y la integración con la app no está implementada.

### Nuevos lotes en Neon A — Antiguo Testamento

Lotes desde `public.biblical_word_occurrences` en Supabase: lectura `to_jsonb(fila)::text`; escritura a Neon A mediante `jsonb_populate_recordset` y `ON CONFLICT (id) DO NOTHING`. Cada libro se validó al terminar mediante **conteo y hash agregado ordenado de todas las filas** frente a origen.

| Libro | Total verificado origen = Neon A | Filas nuevas en este bloque | Huella validada |
|---|---:|---:|---|
| Cantares (SNG) | 1,972 | 1,703 | `552aeffb22e3253424a49b27fe4b6494` |
| Amós (AMO) | 2,978 | 2,566 | `c280c3910ad3158e43a713d62b8e820b` |
| Oseas (HOS) | 3,581 | 3,098 | `c3a51f65b7635b8383e7204216b4299c` |
| Eclesiastés (ECC) | 4,455 | 3,847 | `0d78c3818958e02d56902d7b426f1827` |
| Zacarías (ZEC) | 4,787 | 4,140 | `340fe4a98c01e3385595ea37ccddc77c` |
| Ester (EST) | 4,857 | 4,090 | `3a7c5aa5a539b451a54eb8caf03022d0` |
| Esdras (EZR) | 5,806 | 4,944 | `185ac42771ee01dfcc5b79e6894d95fb` |
| Nehemías (NEH) | 8,445 | 7,226 | `5fa4c9c1a996ba43fd9b92890be5f6e4` |

**Total del bloque: 31,614 filas nuevas, ocho libros AT completos y validados**. Las filas existentes previas no se duplicaron.

### Separación y tareas restantes

- Neon B (Textos) tenía **124,504 textos completos y verificados**, pero solo parte de las ocurrencias de palabras del Nuevo Testamento; en controles posteriores el número de ocurrencias de B fue creciendo independientemente de los lotes hechos aquí. Evitar adjudicarse las escrituras simultáneas.
- Neon A (Léxico) sigue incompleto respecto de las **469,302 ocurrencias AT** de Supabase. En la última lectura observada A tenía **115,036 ocurrencias**, superior al subtotal explicado por este bloque y el checkpoint previo; no asumir autoría de la diferencia ni sumar ambos Neon para inferir claves únicas.
- En revisión cercana, Neon B ocupaba **292,200,448 bytes** y Neon A **205,799,424 bytes** según `pg_database_size`, todavía por debajo de los límites reportados del plan gratuito. Estas cifras pueden variar con otros procesos.
- Supabase conserva íntegramente **611,398 ocurrencias** y **124,504 versículos**; `pg_database_size` se mantuvo en **1,277,668,499 bytes**, por encima del bloqueo de cuota reportado.
- No se tocaron datos personales, progreso, notas, autenticación, RLS, grants, `main` ni producción.
- **Fase C EN CURSO**: verificar/completar ocurrencias AT y NT y asegurar claves, hashes y capacidad; después integrar lecturas server-only a Neon y validar Preview. Liberar espacio en Supabase solo después de respaldo verificable, lista exacta de objetos y autorización explícita. El acceso a la app sigue sin confirmarse.


## Continuación — 2026-11-14 — cuatro libros de palabras NT completos (Neon B)

Se continuó la Fase C sin tocar el proyecto de producción. Origen: Supabase `calendariovida`, tabla editorial `public.biblical_word_occurrences`; destino: `curly-scene-97670657` (Neon B, Textos). Para cada lote: `to_jsonb(fila)::text` del origen, `jsonb_populate_recordset` al destino e inserción `ON CONFLICT (id) DO NOTHING`, previa verificación del libro, UUID sin duplicaciones y `approved_by IS NULL`. Se verificaron libros completos por cantidad y huella `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` del origen y destino.

| Libro | Total en Supabase = Neon B | Nuevas filas insertadas en esta continuación | Huella idéntica |
|---|---:|---:|---|
| 1 Juan (1JN) | 2,198 | 1,318 | `1f3306f2b6081bd659d5b2c20bbba7e5` |
| Filipenses (PHP) | 1,659 | 1,434 | `72a4d189a10903e1ab8f1506a35f9c2f` |
| Gálatas (GAL) | 2,270 | 1,957 | `cfe96b2856230db366706524c1ab9f3d` |
| Efesios (EPH) | 2,484 | 2,148 | `fc56916850d2ea27e61a21f680047dbb` |

**Total de esta intervención en Neon B: 6,857 filas nuevas**, **8,611 registros completos cotejados**, cuatro libros del NT concluidos. La copia de 1JN anteriormente detenida en `OFFSET 880` se reanudó en lotes de 80 y se certificó íntegra. En PHP hubo interrupción de límite de llamadas después de los primeros lotes; se reanudó en `OFFSET 1200`, y todo el libro quedó verificado. En EPH una consulta recibió transitoriamente HTTP 401; tras comprobar que Supabase respondía de nuevo a una consulta simple, los lotes pendientes se completaron y verificaron. Ningún fallo se interpretó como copia terminada sin certificación posterior.

### Auditoría adicional y concurrencia

- Comprobación independiente del corpus `biblical_verse_texts`: **66/66 libros, 124,504/124,504 registros** en Supabase y Neon B, con conteo y huella por libro idénticos. No se necesita duplicar la copia de esos textos.
- Se verificaron de nuevo **17 libros AT (37,112 ocurrencias)** del grupo ya completado en Neon A, mediante conteo y huella por libro, sin discrepancias. Esta comprobación no implica haber copiado nuevas filas de esos libros.
- Durante la lectura, otra copia simultánea estaba completando Esdras en Neon A: pasó de 862 a 4,400 y luego a 5,806. Esta intervención examinó los primeros 1,680 registros de Esdras con escritura idempotente, pero **0 inserciones nuevas** porque ya existían; se detuvo para no duplicar ni interferir. Las escrituras concurrentes no se atribuyen a este bloque.
- Lectura posterior de bases: Neon A **118,565 ocurrencias**, `pg_database_size` **210,845,696 bytes**; Neon B **46,317 ocurrencias**, **124,504 textos**, `pg_database_size` **294,895,616 bytes**. Son fotografías temporales; no sumar A + B como claves únicas sin descontar el AT redundante en B.
- Supabase mantiene **611,398 ocurrencias** y `pg_database_size` **1,277,668,499 bytes**; no se borró ninguna fila y la restricción de cuota no está resuelta. No se modificaron usuarios, sesiones, notas, permisos, RLS, secretos, `main`, ni producción.
- **Fase C continúa EN CURSO**: faltan ocurrencias AT/NT, su conciliación completa por UUID/huella, la integración `server-only` a Neon, las regresiones/Preview integrados, respaldo antes de plantear la eliminación controlada en Supabase con autorización explícita, y validación real del acceso.


## Continuación — 2026-11-14 — Hebreos, Santiago y 2 Corintios

Se ejecutó un bloque finito de copia editorial **únicamente** de `public.biblical_word_occurrences`, origen Supabase `calendariovida`, destino Neon B `curly-scene-97670657` (Nuevo Testamento). Cada lote se obtuvo como `to_jsonb(fila)::text`, se reconstruyó en PostgreSQL con `jsonb_populate_recordset` y utilizó `ON CONFLICT (id) DO NOTHING`. Antes de escribir se verificaron conteo de lote, UUID único, libro correcto y `approved_by IS NULL`. Cada libro fue cotejado íntegramente entre origen y destino por conteo y hash `md5(string_agg(md5(to_jsonb(t)::text),'' ORDER BY id))`.

| Libro | Filas en origen y destino | Filas nuevas insertadas aquí | Huella idéntica |
|---|---:|---:|---|
| Hebreos (`HEB`) | 5,037 | 4,306 | `590ecc9f2305e10aecd02b34f887fcdc` |
| Santiago (`JAS`) | 1,779 | 1,517 | `971eb22df70b17534522005e572ff600` |
| 2 Corintios (`2CO`) | 4,547 | 3,908 | `5ac08a7248acb3dcde549641a1c29228` |

**Resultado propio validado: 9,731 nuevas filas insertadas; 11,363 filas íntegras y verificadas, 3/3 libros.**

Se inició una lectura/reconciliación del primer tramo de `1CO` (2,080 filas) pero la escritura idempotente devolvió **0 filas nuevas**. El contador de ese libro creció simultáneamente en Neon B de aproximadamente 948 a 6,900, luego a **6,986**, sin que estos lotes aportaran inserciones. Se confirmó que **1CO 6,986/6,986** coincide con Supabase en contenido: hash `28081d55647b92d0fedf829bb07f534c`. La finalización de `1CO` se atribuye a **otro proceso no identificado**, no a esta intervención. Se interrumpieron escrituras adicionales sobre ese libro para evitar interferencia.

Fotografía posterior del entorno: Neon B `biblical_word_occurrences` **57,500 filas**, `biblical_verse_texts` **124,504 filas**, base **309,215,232 bytes**; Neon A **126,968 ocurrencias**, base **223,330,304 bytes**. Los contadores pueden variar debido a escrituras simultáneas. Supabase conserva **611,398 ocurrencias** y ocupaba **1,277,676,691 bytes** según consulta; ninguna tabla de origen fue reducida o borrada. No sumar filas A + B como cobertura única debido a los 9,133 AT redundantes que permanecen temporalmente en B.

**Fase C continúa EN CURSO.** Sigue faltando una parte sustancial de ocurrencias AT/NT. Los textos bíblicos 66/66 y 21 tablas auxiliares ya fueron certificados previamente. La integración server-only de la app (Fase D), Preview funcional, pruebas y recuperación de cuota (Fases E/F) siguen pendientes. No se modificaron Auth, perfiles, notas, progreso, RLS, permisos, `main`, producción ni gastos. No se eliminó información. Antes de nuevos lotes de `1CO` u otros libros con crecimiento concurrente, coordinar el proceso activo y verificar curso de inserciones para evitar superposición.


## Continuación — Daniel, Proverbios y Job verificados íntegramente en Neon A

Fecha: **2026-11-14**. Se continuó Fase C transfiriendo únicamente ocurrencias **editoriales compartidas** de `public.biblical_word_occurrences` a Neon A Léxico (`rough-glitter-04635242`). Se mantuvo Supabase como origen intacto. Los lotes se leyeron en orden `book_code,id` mediante `to_jsonb(fila)::text`, se reconstruyeron con `jsonb_populate_recordset` y se insertaron de modo idempotente con `ON CONFLICT (id) DO NOTHING`. Antes de escribir se verificó la cantidad esperada, UUID únicos, `book_code` y `approved_by IS NULL`.

| Libro | Total certificado Supabase = Neon A | Registros nuevos añadidos por esta intervención | Huella completa idéntica |
|---|---:|---:|---|
| Daniel (`DAN`) | **9,529** | **8,173** | `50841f94a8f4993f4382b301e9f7f555` |
| Proverbios (`PRO`) | **9,703** | **8,403** | `f02659c77df42cf1620f2df656772ff4` |
| Job (`JOB`) | **12,482** | **10,708** | `0e53532dfcc13e8503cf612c95cd5839` |

**Resultado verificable: 31,714 filas revisadas, 27,284 nuevas insertadas; los tres libros quedaron completos, comparando `COUNT(*)` y `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))` directamente entre Supabase y Neon A.** No se sumaron números de proyectos distintos como si fueran UUID únicos. Además se constató Nehemías (`NEH`) **8,445/8,445** idéntico, hash `5fa4c9c1a996ba43fd9b92890be5f6e4`; ya estaba copiado por otro proceso y no se volvió a escribir.

Durante Daniel hubo dos respuestas transitorias de autenticación `HTTP 401` en los conectores. Se verificó la integridad exacta de los primeros 6,000 registros antes de continuar en lotes más pequeños. La huella final completa de Daniel confirma que la copia quedó íntegra pese a las interrupciones. Se evitó convertir un error de conexión en una afirmación de avance.

Fotografía al cierre de este bloque: **Neon A 137,676 ocurrencias y 239,108,096 bytes; Neon B 68,953 ocurrencias, 124,504 textos bíblicos y 323,829,760 bytes**; Supabase conserva **611,398 ocurrencias y 124,504 textos**, con tamaño **1,277,676,691 bytes**. Los totales variaron mientras se trabajaba por **otro proceso de copiado**: no atribuir incrementos totales de Neon a esta intervención, ni mezclar las 9,133 ocurrencias AT redundantes de Neon B con cobertura única.

**Pendiente:** completar y cotejar por clave/huella las ocurrencias AT restantes en Neon A y NT restantes en Neon B; preservar originales. Solo después realizar integración `server-only`, Preview funcional y pruebas de acceso; cualquier eliminación para recuperar cuota debe esperar respaldo, plan de reversión y aprobación expresa. No se tocaron datos personales, Auth, progreso, notas, RLS, permisos, `main`, producción ni configuración de gastos.


## Continuación — 2026-11-14 — 1 Corintios, Romanos y Apocalipsis completos

Se trasladaron exclusivamente ocurrencias de **texto editorial compartido** de `public.biblical_word_occurrences` (Supabase `calendariovida`) a **Neon B — Textos** (`curly-scene-97670657`), en lotes reanudables por `book_code` y `ORDER BY id`. Se leyó cada fila original como `to_jsonb(fila)::text`; se restauró con `jsonb_populate_recordset` y se insertó idempotentemente `ON CONFLICT (id) DO NOTHING`. Cada lote se rechazaba si faltaban filas, había UUID duplicado, libro diferente o `approved_by` no nulo. No se trasladaron datos personales.

| Libro | Filas originales y finales en Neon B | Nuevas insertadas en esta intervención | MD5 del contenido completo por UUID, idéntico en Supabase y Neon B |
|---|---:|---:|---|
| 1 Corintios (`1CO`) | 6,986 | 6,038 | `28081d55647b92d0fedf829bb07f534c` |
| Romanos (`ROM`) | 7,261 | 6,217 | `0a7826f762f3669748c29ca24cdc1c3d` |
| Apocalipsis (`REV`) | 10,185 | 8,735 | `a642badf82a27787c41d45bd71d544a0` |

**Resultado verificado: 20,990 nuevas filas**, **24,432 registros de los tres libros cotejados** en su totalidad mediante `count(*)` y `md5(string_agg(md5(to_jsonb(t)::text),'' ORDER BY id))` independientes en el origen y el destino. **Corrección del conteo:** 6,038 + 6,217 + 8,735 = 20,990 (no 20,004). 1 Corintios ya tenía 948 y Romanos 1,044 antes de estos lotes; Apocalipsis tenía 1,450. La transferencia se realizó en lotes de hasta 300 registros sin actualizaciones de filas existentes.

Comprobación posterior: Supabase **611,398 ocurrencias**, **124,504 textos**, tamaño de base **1,277,676,691 bytes**; Neon A **137,676 ocurrencias** y **239,108,096 bytes**; Neon B **87,239 ocurrencias**, **124,504 textos** y **347,144,192 bytes**. Son fotografías temporales, no una conciliación global: otros procesos pueden insertar en Neon paralelamente. Neon B conserva filas AT redundantes, por lo que los contadores A+B no representan claves únicas. Los dos proyectos permanecen por debajo del límite observado de 1 GiB cada uno.

Durante este bloque también se verificó independientemente que **2 Corintios (`2CO`, 4,547)**, **Hebreos (`HEB`, 5,037)** y **Santiago (`JAS`, 1,779)** ya coincidían por conteo y hash con el origen; **no atribuir a este bloque la copia de esos tres libros**. Los 124,504 textos bíblicos de Neon B permanecen presentes; las 21 tablas auxiliares habían sido validadas íntegramente en checkpoint previo, no reescritas aquí.

**Fase C EN CURSO.** Faltan muchas ocurrencias AT/NT y conciliación global por UUID/huella. Fases D–F y recuperación del inicio de sesión siguen pendientes. No se tocaron Supabase RLS/grants/Auth, usuarios, notas, progreso, planes, secretos, borrados, `main` ni producción. No se hará limpieza para recuperar cuota sin respaldo, plan reversible y aprobación expresa.


## Continuación — Marcos (MRK) — transferencia completa a Neon B

Fecha: **2026-11-14**, Fase C. Se continuó exclusivamente la copia de la tabla **editorial compartida** `public.biblical_word_occurrences`, libro `MRK`, desde Supabase `calendariovida` (proyecto `atjtjpchslxbseayzflz`) hasta **Neon B Textos** (`curly-scene-97670657`). No se movieron registros personales ni se modificó el origen.

- Origen: **11,869 ocurrencias MRK**; destino al comenzar: **1,668**, con evidencia de otras copias en paralelo para otros libros.
- Se leyeron exactamente **11,869 filas en orden UUID** y se reconstruyeron desde `to_jsonb(fila)::text` mediante `jsonb_populate_recordset`; **38 lotes** de hasta 320 filas y escritura idempotente `ON CONFLICT (id) DO NOTHING`.
- Resultado atribuible a este bloque: **10,201 nuevas filas** insertadas; **1,668 preexistentes** preservadas. Antes de cada escritura se comprobaron libro correcto, IDs únicos, conteo esperado y `approved_by IS NULL`.
- **Verificación final completa independiente:** Supabase **11,869/11,869**, Neon B **11,869/11,869**. Huella de fila completa en orden por UUID `md5(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id))` coincidente en ambos extremos: **`1f3ea39a8a796c294b3907edbff62ea5`**.
- Fotografía posterior: Neon B **87,239 ocurrencias** y **347,144,192 bytes** de tamaño PostgreSQL; los incrementos totales incluyen copias concurrentes y NO se atribuyen por completo a MRK. Se conservan los 9,133 registros AT redundantes hasta una operación reversible autorizada. Supabase sigue sin liberar cuota.
- Conteo de distribución de trabajo en la comprobación siguiente: **45 libros** con cantidad esperada en el Neon asignado; eso por sí solo no certifica los hashes de los 45. Aún faltan **395,616 ocurrencias** por cantidad entre AT y NT asignados (fotografía, sujeta a otros procesos); de NT quedan principalmente ACT, JHN, LUK y MAT.
- No se alteraron autenticación, perfiles, notas, progreso personal, RLS, permisos, `main`, secretos ni producción. Fase C continúa activa; pendientes la conciliación integral, integración de consultas `server-only` con Neon, Preview funcional, recuperación segura de cuota de Supabase y prueba de acceso.


## Continuación — 2026-11-14 — Evangelio de Lucas completo en Neon B

- **Objetivo del bloque:** completar exclusivamente las ocurrencias editoriales de palabras del libro `LUK` desde `public.biblical_word_occurrences` en Supabase `calendariovida` hacia Neon B (Textos, `curly-scene-97670657`). Ninguna tabla personal se trasladó.
- **Origen:** 20,141 filas de Lucas, con `approved_by` nulo en las 20,141. **Destino al iniciar:** 2,752 filas; a partir de ese punto se procesaron las **20,141 filas originales** por `ORDER BY id`, en **67 lotes de 300 + 1 de 41**. Cada lote verificó cantidad recibida, UUID único, código de libro correcto y ausencia de `approved_by` antes de escritura. Se preservó `to_jsonb(fila)::text` del origen y se restauró mediante `jsonb_populate_recordset`; escritura `ON CONFLICT (id) DO NOTHING`, sin reemplazar filas previas.
- **Resultado atribuible:** **17,389 filas nuevas** de Lucas añadidas, **2,752 existentes** preservadas, sin borrar ni modificar registros originales. Se validó el prefijo de 3,000 registros en ambas bases durante el avance: MD5 `d4dc658e00983ca0e8992563f9fe3769`.
- **Validación final completa e independiente:** Supabase **20,141/20,141**, Neon B **20,141/20,141**. Huella de todas las filas, ordenadas por UUID, `md5(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id))` idéntica: **`5a5576e4d74442b3f0b396e330c8807a`**. Libro **LUK COMPLETO Y COTEJADO**; esta certificación no cubre libros pendientes.
- **Estado observado después del lote:** Neon B `biblical_word_occurrences` **123,613 filas en total**, `biblical_verse_texts` **124,504**, `pg_database_size` **393,625,600 bytes**; Neon A **137,676 ocurrencias**, **239,108,096 bytes**. Los totales de B contienen las **9,133 ocurrencias AT redundantes** y pueden incluir copias concurrentes de otros libros; no se suman como filas únicas ni se atribuyen todos los incrementos al bloque Lucas. Ambos proyectos siguen por debajo del límite 1 GiB observado.
- **Guardrails:** ninguna eliminación, gasto, modificación de Supabase Auth, perfiles, progreso, notas, permisos, RLS, `main`, producción o secretos. No hubo despliegue integrado. **Fase C EN CURSO**: completar otras ocurrencias AT/NT, verificar todo el corpus por clave y huella; después integración de lectura server-only, Preview funcional y validación; liberar cuota solo mediante plan reversible y aprobación explícita. El inicio de sesión de la app sigue sin certificarse.


## Validación completa de ocurrencias NT y cierre de Mateo + Jueces — 2026-11-14

**Resultado de Fase C — dos libros completos y testamento NT totalmente cotejado.** Sin modificaciones a cuentas, Supabase Auth, perfiles, notas, progreso, permisos, RLS, planes, secretos, `main` o producción.

### Nuevo Testamento (Neon B, Textos) — 27/27 libros verificados

- Se cotejó `public.biblical_word_occurrences` directamente en Supabase origen y Neon B, filtrando exclusivamente los **27 códigos de libro del Nuevo Testamento**, agrupando por libro y comparando `COUNT(*)` junto con `md5(string_agg(md5(to_jsonb(fila)::text), '' ORDER BY id))`.
- Resultado completo **27 libros, 142,096/142,096 ocurrencias, 0 libros discrepantes**. Es verificación de todas las filas, no una afirmación basada en suma de destinos. En Neon B continúan **9,133 filas AT redundantes**, que NO se suman a las 142,096 NT.
- Se mantienen certificadas previamente las **124,504/124,504 filas** de `biblical_verse_texts` (66 libros) y las **21/21 tablas editoriales auxiliares** verificadas por recuento y huella.

### Mateo (MAT) — Neon B

- Origen y destino: **18,898 filas** cada uno. **16,340 nuevas filas** insertadas con esta operación; las **2,558 preexistentes** quedaron intactas.
- Lectura por bloques ordenados por UUID con `to_jsonb(fila)::text`; reconstrucción `jsonb_populate_recordset` y escritura idempotente `ON CONFLICT(id) DO NOTHING`. Cada lote comprobó tamaño, UUID único, `book_code='MAT'` y `approved_by IS NULL`.
- Verificación final independiente, 18,898 filas y huella íntegra idéntica en origen y destino: **`d0c234b30a0baca5ded4c3387dc6b29a`**.

### Jueces (JDG) — Neon A

- Origen y destino: **15,384 filas** cada uno. **13,175 nuevas filas** insertadas; las **2,209 preexistentes** quedaron intactas.
- Procedimiento reanudable igual que Mateo, con `book_code='JDG'`; misma comprobación de campos y `approved_by IS NULL`.
- Una consulta en el bloque con `OFFSET 5120` falló una vez por error de conexión, **sin escritura confirmada de ese intento**; el estado Neon A se comprobó mediante consulta independiente (5,120 filas) y el lote se reanudó, sin dar por completo nada antes de la validación.
- Verificación final independiente: 15,384 filas y huella íntegra idéntica en origen y destino: **`f6b7114b05fa7672f17dd23f9ac57cb7`**.

### Estado de contadores posterior y riesgos pendientes

- Inserciones nuevas atribuibles a este bloque: **29,515** (Mateo +16,340; Jueces +13,175), sin contar datos ya presentes ni los copiados concurrentemente por otros procesos.
- Neon A: **150,851 ocurrencias AT**, `pg_database_size=258,539,520` bytes. Frente al origen AT **469,302**, quedan **318,451 ocurrencias AT pendientes por recuento**; este subtotal debe conciliarse por UUID y contenido al finalizar.
- Neon B: **151,229 ocurrencias brutas**, compuestas por **142,096 NT verificadas y 9,133 AT redundantes**; además **124,504 textos bíblicos**. `pg_database_size=428,982,272` bytes.
- Supabase origen permanece intacto: **611,398 ocurrencias**, **124,504 textos** y `pg_database_size=1,277,676,691` bytes. No se recuperó cuota: la aplicación **todavía no tiene acceso validado**.
- Ninguna escritura en tabla de origen, ningún borrado ni modificación de Auth/RLS/permisos. Los dos Neon permanecen por debajo del límite Free observado de 1 GiB.
- **Fase C EN CURSO** por AT incompleto. Siguiente paso: completar/validar ocurrencias AT en Neon A; después integración de lectura **server-only** en la app, pruebas de Preview y acceso, y plan de respaldo/reversión previo a cualquier recuperación de cuota que requiera operaciones destructivas con autorización del usuario. Sin merge ni deploy de producción.


## Cierre de copia e integridad — 2026-11-15

- **Fase C de esta migración: COMPLETA.** Se añadieron exactamente **318,451** ocurrencias editoriales a Neon A, que pasó de 150,851 a **469,302 AT**. Se completaron y cotejaron los 16 libros pendientes: Josué, 1–2 Crónicas, 1–2 Samuel, 1–2 Reyes, Levítico, Deuteronomio, Isaías, Números, Éxodo, Ezequiel, Salmos, Jeremías y Génesis.
- Conciliación final independiente contra Supabase: **66/66 libros**, **611,398 ocurrencias**, **0 diferencias de cantidad o huella de fila completa por UUID**. Distribución verificada: A **469,302 AT**; B **142,096 NT**. Las **9,133 AT redundantes de B** permanecen intactas y excluidas de las lecturas NT y de las sumas de cobertura.
- Se revalidaron de nuevo las **124,504 filas de textos** y las **21 tablas auxiliares de B**, y los cinco catálogos compartidos de A: todos coinciden por cantidad y huella con el origen. Evidencia: `docs/NEON_BIBLIA_INTEGRIDAD_2026-11-15.json` y `docs/NEON_BIBLIA_VALIDACION_2026-11-15.json`.
- Hubo un único escritor local. Cada lote conservó el JSON canónico del origen, validó libro, UUID y `approved_by IS NULL`, e insertó idempotentemente. La transacción rechazaba contenido diferente o escrituras externas inesperadas. Los tramos previos de Isaías, Ezequiel, Salmos y Jeremías no certificaron un prefijo continuo: se recorrieron desde el inicio y se conciliaron sin usar el mayor UUID como prueba de completitud. El escritor quedó detenido al terminar.
- Tamaño PostgreSQL observado al cierre de A: **727,433,216 bytes**, inferior a 1 GiB. No se cambiaron planes.
- Con autorización explícita del usuario se creó `/workspace/vida-respaldo-biblia-2026-11-15.jsonl.gz`: **611,398 filas editoriales**, **66 huellas verificadas**, **132,154,798 bytes**. SHA-256: `494b4f1d4d43b8275ece416190da60bf7974b103a819c7f11821367353f798c6`. El archivo está fuera del repositorio y no contiene usuarios, notas ni progreso. Conservar también su manifiesto adyacente.

### Lectura segura preparada — Fase D

- Adaptador `server-only` limitado a tablas editoriales. Supabase conserva Auth, cookies, comprobación `cuenta_activa`, perfiles, permisos, notas y progreso. El índice derivado de búsqueda y sus escrituras siguen en Supabase.
- Se reproducen en las consultas los predicados SELECT observados de aprobación, fuentes, relaciones y licencias; no se modifica RLS ni grants. SQL parametrizado, límites de paginación y errores sin credenciales.
- Neon ejecuta las consultas dentro de transacciones **READ ONLY**; se verificó `transaction_read_only=on`. AT se consulta en A y NT en B, excluyendo las copias AT redundantes de B incluso en búsquedas que combinan ambos testamentos.
- Doce consultas reales de lectura coincidieron con Supabase en cantidad y huella de respuesta. TypeScript, compilación Turbopack y seis pruebas específicas pasaron. Lint de archivos nuevos: PASS. La suite general mantiene **9 fallos preexistentes**, reproducidos en el checkpoint original; **0 fallos nuevos**. El lint general también contiene deuda previa; no se reabrieron módulos ajenos.
- Variables Neon autorizadas por el usuario y limitadas a **Preview de esta rama**. `VIDA_BIBLE_READ_BACKEND=neon`; las dos URLs son secretos sin prefijo público. Producción sigue sin cambiar.
- Pendiente: construir/comprobar el único Preview, validar acceso real con sesión del usuario y obtener autorización independiente antes de cualquier producción o recuperación de cuota. No se anuncia recuperación de acceso por un estado READY.

### Cuota de Supabase: pendiente de autorización y validación

El origen conserva **611,398 ocurrencias y 124,504 textos**; tamaño observado **1,277,684,883 bytes**. `biblical_word_occurrences` ocupa **958,308,352 bytes** incluyendo índices. No se borró ningún registro. No hay claves foráneas entrantes ni triggers no internos en esa tabla según consulta de catálogo. El plan exacto de liberación y reversión está en `docs/NEON_BIBLIA_RECUPERACION_CUOTA_2026-11-15.md`; no ejecutarlo sin autorización explícita y sin validar previamente el lector desplegado.


## Producción y liberación autorizadas — 2026-11-15

El usuario autorizó expresamente: integrar la rama en main, guardar las dos conexiones como secretos de producción, publicar el lector y vaciar solamente las 611,398 ocurrencias editoriales ya respaldadas. No autorizó cambios de plan, spend cap, RLS, permisos, usuarios, notas ni progreso.

- PR **#304** integrado. Commit de producción: **8052a50300e1add92b7e7bb75bf6a75897a8d604**. Vercel **dpl_86wVQS1DPPTC9KL4BBtfxXu9cELT**, **READY**, target **production**, alias `https://calendario-vida-internacional.vercel.app`. Se verificaron los secretos de servidor y `VIDA_BIBLE_READ_BACKEND=neon` en producción.
- Antes del vaciado se revalidaron de nuevo las **66 cantidades y huellas** del origen contra el respaldo certificado, sin cambios; se comprobó también SHA-256 del archivo comprimido.
- Se ejecutó una única transacción READ WRITE con plazo de bloqueo de 5 segundos, bloqueo exclusivo y comprobación de recuento igual a 611,398; después `TRUNCATE ONLY public.biblical_word_occurrences` y COMMIT. Sin CASCADE, cambios de esquema, RLS o grants.
- Verificación posterior: **0 ocurrencias en Supabase**, **124,504 textos conservados**, base **319,425,683 bytes**, tabla vacía **49,152 bytes** y `default_transaction_read_only=off`. Espacio físico recuperado: **958,259,200 bytes**. Neon A sigue con **469,302 AT**; B conserva **151,229 filas brutas = 142,096 NT + 9,133 AT extra**, además de **124,504 textos**.
- La portada de producción y el Preview cargan; sin sesión las rutas protegidas redirigen a login. El usuario intentó entrar y recibió la restricción de cuota. La comprobación independiente `/auth/v1/health` sigue dando **HTTP 402 / exceed_db_size_quota** después de liberar espacio. La situación ya no es falta de copia ni exceso de tamaño actual; queda el bloqueo de servicio administrado por Supabase. No se certifica login ni validación autenticada hasta que se levante.
- Documentación oficial consultada: `https://supabase.com/docs/guides/platform/billing-faq#fair-use-policy` indica que las restricciones por cuota pueden mantenerse hasta el reinicio del ciclo; reducir tamaño no garantiza levantamiento inmediato del HTTP 402. No pausar/recrear proyectos para intentar reiniciar cuotas ni contratar plan. Solicitud de revisión preparada en `docs/NEON_BIBLIA_SOPORTE_RESTRICCION_2026-11-15.md`; no se envió mensaje a terceros.
- Comprobación de tests sin la limitación local de subprocesos: **590 tests: 580 PASS, 10 fallos**; checkpoint original: **584 tests: 574 PASS, exactamente los mismos 10 fallos**. Los seis nuevos tests pasan. CI temporal falla en regresiones heredadas; VIDA Guardrails y contrato servidor de Roma pasan. No afirmar CI global verde.
- El documento maestro permanece intacto según la restricción del usuario. El contenido bíblico se lee desde Neon; Auth, perfiles, notas, progreso y las demás funciones personales siguen en Supabase. Sus copias editoriales restantes no se borraron.
