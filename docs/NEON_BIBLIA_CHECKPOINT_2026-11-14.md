# VIDA — Rescate sin costo: checkpoint de migración bíblica
Fecha: 2026-11-14
Rama independiente: agent/migracion-biblia-neon-20261114
Objetivo actual: restaurar acceso a la app sin contratar plan, manteniendo Supabase Auth/usuarios y contenido bíblico compartido en dos Neon Free.

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
