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
- utiliza NA28 como lectura base cuando está disponible;
- conserva una lectura de respaldo claramente etiquetada cuando NA28 omite una referencia;
- mantiene NA27, Tyndale, SBL, Westcott-Hort, Tregelles, Textus Receptus y Bizantino como testigos declarados por la fuente;
- extrae forma griega, transliteración, Strong, lema, morfología y glosas inglesa y española;
- conserva posición, línea fuente y SHA-256 de cada registro;
- genera un paquete JSON comprimido por libro;
- genera un manifiesto global con hashes de los 27 paquetes;
- no escribe en Supabase ni modifica producción.

## Conteos y versificación

La fuente TAGNT contiene **7,958 referencias**, mientras el sistema de versificación usado por la Biblia de la aplicación contiene **7,957 versículos** del Nuevo Testamento.

La diferencia no representa pérdida de texto. Tres libros necesitan un mapa explícito antes de su importación:

| Libro | Referencias TAGNT | Versículos en la app | Motivo |
|---|---:|---:|---|
| 2 Corintios | 256 | 257 | Diferencia de división o numeración en el texto final de la carta. |
| 3 Juan | 15 | 14 | Una tradición divide el contenido final en un versículo adicional. |
| Apocalipsis | 405 | 404 | TAGNT conserva Apocalipsis 12:18; R09 integra esa línea con el inicio del capítulo 13. |

El mapa deberá conservar la referencia original, la referencia de la aplicación y la procedencia de la transformación.

## Referencias omitidas por NA28

Algunas referencias presentes en R09, Textus Receptus o tradición bizantina no están en NA28, por ejemplo Mateo 17:21.

Para esos casos el procesador:

1. no elimina la referencia;
2. elige la edición disponible de mayor prioridad;
3. marca `uses_fallback_edition: true`;
4. conserva todos los testigos y notas de variante;
5. permite que la interfaz explique la diferencia de manera transparente.

## Validaciones obligatorias

El workflow debe confirmar:

- 27 libros;
- 260 capítulos;
- 7,958 referencias fuente;
- 7,957 versículos en la versificación de la app;
- exactamente tres libros pendientes de mapa de versificación;
- capítulos continuos por libro;
- referencias continuas según la numeración de la fuente;
- una lectura base reconocida en cada referencia;
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
3. el manifiesto confirme 7,958 referencias fuente y 7,957 versículos de la app;
4. se revise y fije el hash del segundo archivo TAGNT;
5. se prueben referencias de Evangelios, Hechos, cartas y Apocalipsis;
6. se implemente y pruebe el mapa de 2 Corintios, 3 Juan y Apocalipsis;
7. se defina una estrategia de importación por lotes que no bloquee la base ni la aplicación.

## Estado de la interfaz

La interfaz todavía no se amplía. El objetivo final es que cualquier referencia del Nuevo Testamento pueda recuperar el paquete textual aprobado. La pantalla se conectará después de que la importación general esté validada, no como una función limitada a dos versículos.
