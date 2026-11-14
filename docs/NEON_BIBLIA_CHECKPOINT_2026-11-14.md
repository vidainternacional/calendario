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
