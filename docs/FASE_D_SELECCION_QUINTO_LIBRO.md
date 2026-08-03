# FASE D · Bloque 4 — Selección del quinto libro TAHOT

Fecha: 2026-08-02

## Objetivo

Seleccionar de forma reproducible el quinto libro completo del Antiguo Testamento para el flujo TAHOT, después de completar y aprobar funcionalmente Abdías, Rut, Hageo y Nahúm.

Esta auditoría es exclusivamente de lectura. No genera paquetes, payloads o migraciones y no modifica Supabase, RLS, interfaz o producción.

## Fuente y exclusiones

- repositorio: `STEPBible/STEPBible-Data`;
- commit fijado: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia: CC BY 4.0;
- libros excluidos por importación y aprobación previas: `Oba`, `Rut`, `Hag`, `Nam`;
- candidatos evaluados: 35.

## Política de selección

La política conserva el mismo orden aprobado para Hageo y Nahúm.

Requisitos obligatorios:

- al menos una referencia;
- cero desalineaciones entre columnas;
- cero filas con idioma desconocido.

Preferencias, en orden:

1. ausencia de omisiones Qere;
2. ausencia de filas arameas;
3. ausencia de texto restaurado;
4. ausencia de adiciones reconstruidas desde la LXX;
5. menor número de referencias;
6. menos filas Qere;
7. menos filas con variantes;
8. menos componentes morfológicos;
9. menos filas fuente.

La integridad estructural se prioriza sobre el tamaño. Una característica de riesgo anterior en la lista no puede compensarse con un libro más corto.

## Resultado

El libro seleccionado es **Jonás (`Jon`)**.

Conteos auditados:

- capítulos: 4;
- referencias: 48;
- filas fuente: 688;
- palabras visibles: 688;
- componentes morfológicos: 1,080;
- filas con variantes: 0;
- filas Qere: 0;
- omisiones Qere: 0;
- filas hebreas: 688;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- idiomas desconocidos: 0;
- desalineaciones: 0;
- máximo de componentes por fila: 4.

Jonás ocupa el primer lugar porque satisface todos los controles estructurales y de riesgo prioritario y, entre los candidatos restantes, tiene el menor número de referencias. Además, no contiene filas Qere ni variantes, lo que reduce el riesgo del siguiente paquete.

## Primeros diez candidatos

| Orden | Libro | Referencias | Palabras | Morfemas | Variantes | Qere | Omisiones | Arameo | Restaurado | LXX | Desalineaciones |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | `Jon` | 48 | 688 | 1,080 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | `Zep` | 53 | 767 | 1,120 | 4 | 2 | 0 | 0 | 0 | 0 | 0 |
| 3 | `Mal` | 55 | 876 | 1,302 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | `Hab` | 56 | 671 | 1,000 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| 5 | `Jol` | 73 | 957 | 1,438 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| 6 | `Mic` | 105 | 1,396 | 2,105 | 7 | 4 | 0 | 0 | 0 | 0 | 0 |
| 7 | `Sng` | 117 | 1,249 | 1,972 | 10 | 4 | 0 | 0 | 0 | 0 | 0 |
| 8 | `Amo` | 146 | 2,042 | 2,978 | 9 | 3 | 0 | 0 | 0 | 0 | 0 |
| 9 | `Hos` | 197 | 2,381 | 3,581 | 7 | 5 | 0 | 0 | 0 | 0 | 0 |
| 10 | `Zec` | 211 | 3,128 | 4,787 | 9 | 7 | 0 | 0 | 0 | 0 | 0 |

## Evidencia reproducible

- PR: #119;
- workflow: `Seleccionar quinto libro TAHOT`;
- ejecución: `30787248088` — `success`;
- artefacto: `stepbible-fifth-ot-book-selection`;
- ID: `8845674061`;
- digest: `sha256:e4f5b2b564c03141a0153d43e051105aeb4657a6b17cdec695952bee3e94d68a`;
- fuente seleccionada: `tahot-isa-mal`;
- SHA-256 de la fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`.

## Alcance y siguiente paso

Todavía no se ha:

- habilitado `Jon` en el extractor de paquetes;
- generado un paquete de Jonás;
- construido un payload;
- modificado el importador;
- creado o aplicado una migración;
- escrito en Supabase.

El siguiente incremento seguro es habilitar Jonás en el extractor genérico, generar dos paquetes independientes y exigir identidad byte a byte, 48 referencias, 688 palabras visibles, 1,080 componentes y ausencia exacta de variantes o Qere. No construir payload ni importar datos hasta completar y registrar ese paquete reproducible.
