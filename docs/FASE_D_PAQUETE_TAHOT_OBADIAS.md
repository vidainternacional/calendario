# FASE D · Bloque 4 — Paquete TAHOT de Obadías

Fecha: 2026-08-02

## Objetivo

Generar el primer paquete textual completo del Antiguo Testamento usando el contrato TAHOT ya validado, sin importar todavía contenido a Supabase.

## Por qué Obadías

Obadías permite auditar un libro entero con un alcance reducido:

- un capítulo;
- 21 versículos;
- una sola fuente TAHOT;
- volumen suficiente para comprobar texto, morfología, variantes, orden y hashes sin ejecutar todavía una carga masiva.

Este paquete no define por sí solo todos los casos del Antiguo Testamento. Los casos arameos, Qere/Ketiv complejos, restauraciones y adiciones reconstruidas desde la LXX continuarán cubiertos por el contrato general y por paquetes posteriores.

## Contenido del paquete

Por cada fila fuente se conserva:

- referencia inglesa;
- referencia hebrea alternativa cuando exista;
- índice fuente sin perder ceros iniciales;
- tipo textual L, Q, R o X;
- idioma determinado desde `Grammar`;
- forma hebrea visible y puntuación;
- transliteración;
- glosa inglesa de la fuente;
- componentes alineados de texto, transliteración, traducción, dStrong y morfología;
- variantes de significado y ortografía;
- dStrong raíz, alternativo y etiquetas expandidas;
- las doce columnas activas originales;
- número de línea y SHA-256 de la línea.

Por cada versículo se genera:

- texto original ensamblado;
- transliteración ensamblada;
- secuencia de glosas inglesas;
- filas ordenadas según la fuente;
- conteo de palabras visibles y componentes;
- variantes y diferencias de alineación;
- hash estable del contenido.

## Resultado validado

La ejecución completa produjo:

- referencias: 21 de 21;
- filas fuente: 291;
- palabras visibles: 291;
- componentes morfológicos: 434;
- filas hebreas: 291;
- filas arameas: 0;
- filas con variantes: 2;
- lecturas Qere: 1;
- omisiones Qere: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- desalineaciones entre texto, transliteración, glosa, dStrong y morfología: 0;
- idiomas desconocidos: 0;
- hashes de línea inválidos: 0.

### Variantes conservadas

Obadías 1:8:

- palabra: `נְאֻם`;
- tipo principal: Leningrado con anotación `=L(abh)`;
- diferencia ortográfica conservada desde Alepo, BHS y Ben Chaim: `נְאֻם־`.

Obadías 1:11:

- lectura principal Qere: `שְׁעָרָיו`;
- Ketiv conservado como variante de significado: `שַׁעֲר/וֹ`;
- forma de Leningrado con letras Ketiv y vocalización Qere conservada como variante ortográfica;
- morfología y etiquetas léxicas del Ketiv permanecen dentro de la variante, no se mezclan con la palabra principal.

## Artefacto reproducible

Primera ejecución aprobada:

- workflow: `Validar paquete TAHOT de Obadías`;
- run: `30769458797`;
- commit: `14bb74cd3a87e4e8847c6faa48861e5d62274745`;
- artefacto: `stepbible-obadiah-package`;
- digest del ZIP de GitHub Actions: `sha256:59cc2a2cc8b2dbddece36f1c19dee9341059ff800ad545ebdcfcc2accd902a61`;
- archivo: `oba.json.gz`;
- tamaño: 55,413 bytes;
- SHA-256 del paquete: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`.

## Auditoría independiente

Después de descargar el artefacto se comprobó de forma separada:

- referencias exactas `Oba.1.1`–`Oba.1.21`;
- líneas fuente únicas y en orden ascendente;
- índices visibles continuos dentro de cada versículo;
- referencia de cada fila consistente con su versículo;
- reconstrucción exacta del texto visible desde las filas;
- 21 hashes de versículo recalculados sin diferencias;
- 291 hashes de línea recalculados al recomponer las doce columnas y cinco columnas reservadas vacías;
- SHA-256 del archivo comprimido igual al manifiesto;
- 290 filas Leningrado y una fila Qere;
- 434 componentes morfológicos preservados.

## Validaciones obligatorias

- exactamente 21 referencias, de Obadías 1:1 a 1:21;
- 17 columnas en cada fila y columnas 13–17 vacías;
- solo hebreo, arameo o una omisión Qere reconocida;
- ningún hash inválido;
- ningún dato silenciosamente descartado;
- artefacto JSON comprimido con SHA-256;
- manifiesto y auditoría legible.

Las diferencias de cantidad entre componentes no se corrigen automáticamente. Se cuentan y conservan para revisión antes de definir la transformación definitiva. En Obadías no se detectó ninguna diferencia.

## Archivos

- `scripts/stepbible/extract_ot_book.py`;
- `.github/workflows/validate-stepbible-obadiah-package.yml`.

Artefactos temporales:

- `oba.json.gz`;
- `manifest.json`;
- `audit.md`.

## Seguridad

- proceso de solo lectura;
- no modifica Supabase;
- no cambia la interfaz;
- no modifica producción;
- no utiliza proveedores de IA;
- no publica los archivos TAHOT completos.

## Estado para la siguiente etapa

Los criterios del paquete están aprobados. Antes de importar Obadías debe comprobarse la compatibilidad exacta entre:

- las palabras visibles del paquete;
- los componentes morfológicos TAHOT;
- `biblical_lexical_entries`;
- `biblical_word_occurrences`;
- `biblical_verse_texts`;
- `biblical_textual_variants`;
- perfiles de versificación de la traducción activa.

La glosa inglesa se conserva como dato fuente. La traducción literal española requiere un flujo editorial separado y no se generará automáticamente ni se presentará como traducción bíblica aprobada.
