# FASE D · Bloque 4 — Filemón textual completo

Fecha: 2026-08-02

## Objetivo

Validar el proceso de importación masiva con un libro completo antes de cargar los 27 libros del Nuevo Testamento.

Filemón fue elegido porque:

- contiene un capítulo y 25 referencias;
- pertenece al archivo TAGNT Hechos–Apocalipsis ya validado;
- no requiere una correspondencia especial de versificación;
- contiene lecturas alternativas suficientes para probar el modelo;
- incluye una palabra compuesta que exige conservar más de una referencia léxica fuente.

## Fuente

- repositorio: `STEPBible/STEPBible-Data`;
- commit: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- archivo: `TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`;
- SHA-256: `524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7`;
- licencia: CC BY 4.0;
- artefacto Filemón: `f83f0f42d7c5e84cdc8c6f2cce5a0984e0d16d7edefce74d545ca64f54e2bd8a`.

Supabase descargó el archivo directamente desde la URL fijada y rechazará cualquier contenido cuyo hash no coincida.

## Importador

Se añadió `internal.import_stepbible_tagnt_book`.

La función:

1. valida parámetros, URL y hashes;
2. descarga la fuente oficial;
3. extrae únicamente el libro solicitado;
4. selecciona NA28 como lectura base cuando está presente;
5. conserva lecturas de otras ediciones como variantes;
6. genera entradas léxicas estables por Strong y lema;
7. inserta ocurrencias, texto completo, transliteración y secuencia literal de glosas;
8. registra variantes declaradas por la fuente;
9. valida todos los conteos y hashes;
10. registra el lote en `internal.biblical_textual_import_batches`.

No puede ejecutarse desde `anon` ni `authenticated`.

## Resultado

- textos de versículo: 25;
- palabras base: 335;
- lecturas adicionales: 14;
- ocurrencias totales: 349;
- variantes documentadas: 18;
- hashes inválidos: 0;
- edición base: NA28 en las 25 referencias.

## Pruebas de muestra

Se comprobaron:

- Filemón 1:1;
- Filemón 1:6;
- Filemón 1:16;
- Filemón 1:25.

Cada referencia devuelve:

- texto griego;
- transliteración;
- secuencia literal de glosas en español;
- cantidad de palabras;
- edición base;
- palabras individuales con Strong, lema y morfología;
- variantes cuando existen.

## Palabra compuesta

Filemón 1:16 contiene `οὐκέτι`.

STEPBible la relaciona con `G2089, G3756`. El modelo conserva:

- la forma visible completa;
- transliteración `ouketi`;
- glosa `no ya`;
- morfología compuesta `PRT-N + G2089=ADV`;
- el identificador fuente compuesto dentro de metadatos;
- una entrada léxica principal válida para la relación de base de datos.

No se descarta el segundo componente léxico.

## Seguridad

- RLS continúa activo;
- `anon` no tiene privilegios;
- `authenticated` mantiene únicamente `SELECT` sobre las tablas textuales;
- el importador está en el esquema `internal`;
- no hay políticas de escritura desde clientes;
- no se invoca un proveedor de IA;
- los textos y glosas proceden de la fuente aprobada.

## Interpretación de la traducción literal

`literal_translation_es` es una secuencia alineada de glosas fuente. Sirve para estudiar el orden y la función de las palabras, pero no debe presentarse como una traducción española pulida.

La interfaz deberá etiquetarla como **traducción literal palabra por palabra** o **secuencia de glosas**, no como una nueva versión bíblica.

## Siguiente bloque

Importar por lotes los libros del Nuevo Testamento que mantienen correspondencia directa de referencias. 2 Corintios, 3 Juan y Apocalipsis se cargarán después de aprobar sus mapas de versificación por traducción.