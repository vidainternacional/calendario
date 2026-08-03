# FASE D · Bloque 4 — Selección del tercer libro textual

Fecha: 2026-08-02

## Objetivo

Seleccionar el tercer libro del Antiguo Testamento para ampliar el corpus TAHOT después de la validación completa de Abdías y Rut, sin generar todavía un paquete, payload, migración o escritura en Supabase.

## Método

Se evaluaron los 37 libros restantes desde las cuatro fuentes TAHOT fijadas en el commit STEPBible:

`b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`

La selección exigió primero:

- más de cero referencias;
- cero desalineaciones entre columnas morfológicas;
- cero filas con idioma desconocido.

Después priorizó, en este orden:

1. ausencia de omisiones Qere;
2. ausencia de filas arameas;
3. ausencia de texto restaurado;
4. ausencia de adiciones reconstruidas desde la LXX;
5. menor número de referencias;
6. menos filas Qere;
7. menos filas con variantes;
8. menos componentes morfológicos;
9. menos filas fuente.

La seguridad estructural tuvo prioridad sobre el tamaño.

## Libro seleccionado

**Hageo (`Hag`)**.

Fuente:

- conjunto: `tahot-isa-mal`;
- SHA-256: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- licencia: CC BY 4.0;
- atribución: STEP Bible.

Conteos observados:

- capítulos: 2;
- referencias: 38;
- filas fuente: 600;
- palabras visibles: 600;
- componentes morfológicos: 911;
- máximo de componentes en una fila: 3;
- filas con variantes: 2;
- filas Qere: 1;
- omisiones Qere: 0;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- desalineaciones: 0;
- idiomas desconocidos: 0.

## Comparación de los primeros candidatos

| Orden | Libro | Referencias | Palabras | Morfemas | Variantes | Qere | Omisiones | Arameo | Restaurado | LXX | Desalineaciones |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Hageo (`Hag`) | 38 | 600 | 911 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| 2 | Nahúm (`Nam`) | 47 | 558 | 828 | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| 3 | Jonás (`Jon`) | 48 | 688 | 1,080 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | Sofonías (`Zep`) | 53 | 767 | 1,120 | 4 | 2 | 0 | 0 | 0 | 0 | 0 |
| 5 | Malaquías (`Mal`) | 55 | 876 | 1,302 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | Habacuc (`Hab`) | 56 | 671 | 1,000 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |

Hageo fue seleccionado porque es el libro elegible con menos referencias y no introduce ninguna de las estructuras de mayor riesgo: omisiones Qere, arameo, restauraciones, adiciones LXX o desalineaciones.

El único Qere y las dos filas con variantes deberán auditarse individualmente durante la generación del paquete.

## Evidencia reproducible

- workflow: `Seleccionar tercer libro TAHOT`;
- ejecución: `30777005082` — `success`;
- artefacto: `stepbible-next-ot-book-selection`;
- ID: `8842366155`;
- digest: `sha256:bad8cb7ec61bb24768b9fdecdb295afecfa6651ac66314e772cb8964102cb35a`;
- archivos del artefacto: `selection.json` y `selection.md`.

## Alcance y siguiente paso

Esta selección fue de solo lectura.

Todavía no se ha:

- habilitado Hageo en el extractor de paquetes;
- generado un paquete `hag.json.gz`;
- construido un payload;
- modificado el importador;
- creado una migración;
- escrito en Supabase;
- cambiado la interfaz o producción.

El siguiente incremento seguro es habilitar Hageo en el extractor y generar dos veces un paquete por libro, comprobando referencias completas, hashes idénticos, variantes, Qere, morfología y ausencia de palabras artificiales. No generar payload ni importar datos hasta que el paquete haya sido auditado y registrado en el documento maestro.
