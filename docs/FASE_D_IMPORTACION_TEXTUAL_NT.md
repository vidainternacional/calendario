# FASE D · Bloque 4 — Extracción textual completa del Nuevo Testamento

Fecha: 2026-08-02

## Objetivo

Convertir el piloto de Juan 3:16 en un proceso reproducible para los 27 libros del Nuevo Testamento, sin importar manualmente versículos y sin modificar Supabase antes de validar la fuente completa.

## Fuente

- repositorio: `STEPBible/STEPBible-Data`;
- commit fijado: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- archivos:
  - `TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`;
  - `TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`;
- licencia: CC BY 4.0;
- atribución requerida: STEP Bible.

## Procesador

`scripts/stepbible/extract_nt_corpus.py`:

- descarga las dos fuentes fijadas al commit;
- verifica el hash conocido de Mateo–Juan;
- reconoce los 27 códigos UBS usados por STEPBible;
- separa la lectura base NA28 de lecturas presentes solo en otras ediciones;
- conserva NA27, Tyndale, SBL, Westcott-Hort, Tregelles, Textus Receptus y Bizantino como testigos declarados por la fuente;
- extrae forma griega, transliteración, Strong, lema, morfología, glosa inglesa y española;
- conserva posición, línea fuente y SHA-256 de cada registro;
- genera un paquete JSON comprimido por libro;
- genera un manifiesto global con hashes de los 27 paquetes;
- no escribe en Supabase ni modifica producción.

## Validaciones obligatorias

El workflow debe confirmar:

- 27 libros;
- 260 capítulos;
- 7,957 versículos;
- capítulos continuos por libro;
- versículos continuos por capítulo;
- al menos una lectura NA28 en cada versículo;
- orden estable de las filas fuente;
- Strong y morfología válidos;
- hashes de todos los paquetes;
- palabras base y variantes contadas de forma separada.

## Artefacto esperado

`stepbible-nt-corpus` contendrá:

- `manifest.json`;
- `validation.md`;
- `books/mat.json.gz` hasta `books/rev.json.gz`.

Los paquetes son artefactos temporales de revisión y no se guardan directamente en Git por su tamaño.

## Criterio para importar

No se cargará el Nuevo Testamento en Supabase hasta que:

1. el workflow termine correctamente;
2. los 27 paquetes estén presentes;
3. el conteo global sea 7,957 versículos;
4. se revise el hash del segundo archivo TAGNT;
5. se prueben referencias de los Evangelios, Hechos, cartas y Apocalipsis;
6. se defina una estrategia de importación por lotes que no bloquee la base ni la aplicación.

## Estado de la interfaz

La interfaz todavía no se amplía. El objetivo final es que cualquier referencia del Nuevo Testamento pueda recuperar el paquete textual aprobado. La pantalla se conectará después de que la importación general esté validada, no como una función limitada a dos versículos.
