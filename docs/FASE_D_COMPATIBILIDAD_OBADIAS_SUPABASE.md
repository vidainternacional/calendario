# FASE D · Bloque 4 — Compatibilidad del paquete de Obadías con Supabase

Fecha: 2026-08-02

## Objetivo

Comprobar si el paquete textual reproducible de Obadías puede transformarse de forma segura al modelo textual existente, antes de escribir una migración o insertar datos.

Este incremento es de auditoría:

- no modifica Supabase;
- no importa filas;
- no cambia la interfaz;
- no modifica producción;
- no conecta proveedores de IA.

## Estado de la base

Obadías está registrado como:

- código interno: `OBA`;
- nombre de interfaz: `Abdías`;
- capítulos: 1;
- idioma original declarado: hebreo;
- libro aprobado y habilitado.

Antes de esta auditoría existen para `OBA`:

- textos originales: 0;
- ocurrencias léxicas: 0;
- variantes textuales: 0;
- correspondencias de versificación: 0.

No existe riesgo de duplicar una importación previa.

## Fuente reutilizable

Se reutilizará la fuente aprobada:

`stepbible-lexical-pilot`

La fuente ya representa el corpus textual y léxico de STEPBible fijado al commit:

`b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`

No se creará una segunda fuente paralela. La futura migración deberá actualizar sus metadatos y su hash para incluir los cuatro archivos TAHOT validados:

- Génesis–Deuteronomio: `e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b`;
- Josué–Ester: `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775`;
- Job–Cantares: `84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5`;
- Isaías–Malaquías: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`.

## Resultado del auditor automático

El paquete de Obadías produce:

- 184 identificadores léxicos únicos;
- 434 ocurrencias morfológicas;
- 291 raíces;
- 103 prefijos;
- 40 sufijos;
- 21 textos completos de versículo;
- 2 filas fuente con variantes;
- 3 variantes estructurables;
- índice fuente máximo: 21;
- máximo de morfemas por palabra: 3;
- claves `(capítulo, versículo, palabra, morfema)` únicas;
- 0 identificadores léxicos fuera del formato permitido;
- 0 números Strong derivados fuera del formato permitido;
- 0 lemas fuente contradictorios dentro del paquete.

Cada palabra contiene exactamente una etiqueta de raíz entre llaves. Esto permite clasificar de manera determinista:

- elementos anteriores a la raíz: `prefix`;
- raíz: `word`;
- elementos posteriores a la raíz: `suffix`.

## Correspondencia con las tablas

### `biblical_sources`

Compatible sin cambios de esquema.

Acciones futuras:

- reutilizar la fuente existente;
- añadir los cuatro hashes TAHOT a `metadata.source_files`;
- registrar el paquete de Obadías y su SHA-256;
- recalcular `content_hash`;
- mantener licencia, atribución, aprobación y RLS actuales.

### `biblical_lexical_entries`

Compatible después de normalización.

Transformación:

- eliminar las llaves que marcan la raíz;
- separar las etiquetas de puntuación posteriores a `\`;
- conservar el identificador fuente completo como `lexical_id`;
- derivar `strong_number` usando los primeros cinco caracteres, por ejemplo `H3068G → H3068`;
- conservar el identificador original dentro de `metadata`;
- guardar la glosa inglesa como `source_gloss`;
- no colocar la glosa inglesa dentro de `display_gloss_es`.

Todos los 184 identificadores cumplen:

`^[GH][0-9]{4}[A-Z]?$`

El paquete coincide con dos entradas hebreas existentes:

- `H3068G`: el lema `יהוה` es compatible y la entrada debe reutilizarse;
- `H9020`: la entrada existente usa el lema editorial `־י`, mientras la etiqueta expandida de TAHOT usa el código `Ps1c`.

`H9020` demuestra que el segundo campo de `Expanded Strong tags` no siempre es un lema hebreo visible para prefijos o sufijos. La importación debe reutilizar las entradas existentes y aplicar una política canónica de lema para afijos, en vez de sobrescribirlas con códigos morfológicos.

Resultado esperado del piloto:

- 184 identificadores utilizados;
- 2 entradas reutilizadas;
- hasta 182 entradas nuevas;
- ninguna actualización destructiva de entradas existentes.

### `biblical_word_occurrences`

Compatible sin cambios de esquema.

Transformación por palabra fuente:

- `word_index`: posición fuente base;
- `display_word_index`: posición visible secuencial;
- `morpheme_index`: posición del componente dentro de la palabra;
- `token_kind`: `prefix`, `word` o `suffix` según la raíz marcada;
- `word_group_key`: identificador estable del grupo visible;
- `surface_form`: forma del morfema, no la palabra completa;
- `occurrence_transliteration`: transliteración alineada del morfema;
- `morphology_code`: código TAHOT correspondiente;
- `joins_previous`: verdadero desde el segundo morfema;
- `joins_next`: verdadero hasta el penúltimo morfema;
- `punctuation_after`: puntuación separada del último elemento;
- `textual_status`: `base` para la lectura principal.

La clave única actual:

`(book_code, chapter, verse, source_id, word_index, morpheme_index)`

admite las 434 ocurrencias sin colisiones.

Dos identificadores aparecen en más de un tipo de ocurrencia:

- `H9031` puede funcionar como palabra o sufijo;
- `H9038` puede funcionar como palabra o sufijo.

Esto es compatible porque `token_kind` pertenece a la ocurrencia y no a la entrada léxica.

### `biblical_verse_texts`

Compatible sin cambios de esquema.

Se crearán 21 filas:

- `book_code = OBA`;
- `chapter = 1`;
- `language = hebrew`;
- `text_direction = rtl`;
- texto original y transliteración ensamblados desde el paquete;
- `token_count` igual al número de palabras visibles del versículo;
- metadatos con tipo textual, referencia fuente, hash del paquete y revisión.

`literal_translation_es` es nullable y debe permanecer vacío hasta completar un flujo editorial español. La secuencia inglesa de TAHOT no puede publicarse en ese campo ni presentarse como traducción bíblica española.

### `biblical_textual_variants`

Compatible sin cambios de esquema.

Las dos filas fuente con variantes generan tres registros:

1. Obadías 1:8: `orthographic`;
2. Obadías 1:11: `substitution`, con Qere como lectura base y Ketiv como lectura variante;
3. Obadías 1:11: `orthographic`, conservando la forma de Leningrado con letras Ketiv y vocalización Qere.

Las columnas actuales permiten conservar:

- posición de anclaje;
- lectura base;
- lectura alternativa;
- testigos y ediciones;
- resumen de procedencia;
- significado editorial español cuando se revise;
- fuente, versión y hash.

Ketiv no debe crearse como una palabra base adicional ni mezclarse dentro de Qere.

### Versificación

La tabla real es `biblical_verse_mappings`.

R09 (`spa_r09`) contiene un capítulo de Abdías con 21 versículos. El paquete TAHOT contiene exactamente las mismas 21 referencias, por lo que Obadías utiliza correspondencia directa.

No se necesitan 21 filas `identity`: el resolver ya usa la referencia directa cuando no existe una correspondencia especial.

Para futuros libros del Antiguo Testamento con diferencias de numeración se deberá crear un perfil separado, por ejemplo `r09-traditional-ot`, sin ampliar silenciosamente el perfil actual del Nuevo Testamento.

## Seguridad confirmada

Las seis tablas auditadas mantienen:

- RLS activo;
- `anon` sin privilegios;
- `authenticated` únicamente con `SELECT`;
- escritura reservada a `service_role` o migraciones internas;
- políticas que exigen fuente, filas y perfiles aprobados;
- hashes de 64 caracteres;
- activación condicionada por aprobación.

No se requiere DDL para el piloto de Obadías.

## Campos que todavía requieren trabajo editorial

La estructura técnica puede importarse, pero estos campos no deben inventarse:

- lema canónico de afijos cuando TAHOT entrega un código morfológico;
- transliteración del lema;
- categoría gramatical normalizada;
- resumen morfológico en español;
- glosa española por ocurrencia;
- glosa española de la entrada léxica;
- traducción literal española del versículo;
- explicación española de la importancia de cada variante.

El servicio actual muestra `occurrence_gloss_es` directamente. Si permanece nulo, la interfaz puede mostrar texto original, lema, Strong y código morfológico, pero no una explicación española completa de cada morfema.

## Decisión

El modelo es **estructuralmente compatible** y no necesita migraciones de esquema.

La importación de datos queda autorizada solo después de implementar dos controles dentro de la migración piloto:

1. política canónica e idempotente para lemas de prefijos y sufijos, reutilizando entradas existentes;
2. separación explícita entre datos fuente ingleses y contenido editorial español.

La futura migración debe ejecutarse en una sola transacción y cancelar todo si no obtiene exactamente:

- 21 textos;
- 291 palabras visibles;
- 434 ocurrencias morfológicas;
- 184 identificadores léxicos utilizados;
- 3 variantes estructuradas;
- 0 hashes inválidos;
- 0 claves duplicadas;
- 0 idiomas desconocidos.

## Evidencia técnica

- paquete: `docs/FASE_D_PAQUETE_TAHOT_OBADIAS.md`;
- reproducibilidad: `docs/FASE_D_REPRODUCIBILIDAD_OBADIAS.md`;
- auditor: `scripts/stepbible/audit_obadiah_model.py`;
- workflow: `.github/workflows/validate-obadiah-supabase-compatibility.yml`;
- ejecución: `30770540464` — `success`;
- commit auditado: `ffcd99e6e114c59fc485741286cd7f021d4d94ea`;
- artefacto: `obadiah-supabase-compatibility`;
- digest: `sha256:e34838bda5a4cdec516de65d892233ee4c3dd648d9373b1612e616fb3c2b111a`.

El Bloque 4 continúa activo. Este documento no importa datos ni modifica producción.
