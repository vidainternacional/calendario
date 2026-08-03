# FASE D · Bloque 4 — Selección del cuarto libro TAHOT

Fecha: 2026-08-02

## Objetivo

Seleccionar de forma reproducible el cuarto libro completo del Antiguo Testamento para el flujo TAHOT, después de completar y aprobar funcionalmente Abdías, Rut y Hageo.

Esta auditoría es exclusivamente de lectura. No genera paquetes, payloads o migraciones y no modifica Supabase, RLS, interfaz o producción.

## Fuente y exclusiones

- repositorio: `STEPBible/STEPBible-Data`;
- commit fijado: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia: CC BY 4.0;
- libros excluidos por importación y aprobación previas: `Oba`, `Rut`, `Hag`;
- candidatos evaluados: 36.

## Política de selección

La política conserva el mismo orden aprobado para Hageo.

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

El libro seleccionado es **Nahúm (`Nam`)**.

Conteos auditados:

- capítulos: 3;
- referencias: 47;
- filas fuente: 558;
- palabras visibles: 558;
- componentes morfológicos: 828;
- filas con variantes: 4;
- filas Qere: 4;
- omisiones Qere: 0;
- filas hebreas: 558;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- idiomas desconocidos: 0;
- desalineaciones: 0;
- máximo de componentes por fila: 4.

Nahúm ocupa el primer lugar porque satisface todos los controles de integridad y riesgo prioritario y tiene 47 referencias. Jonás también carece de omisiones, arameo, restauraciones y adiciones LXX, pero queda segundo con 48 referencias; la política compara el tamaño antes del número de Qere y variantes.

## Primeros diez candidatos

| Orden | Libro | Referencias | Palabras | Morfemas | Variantes | Qere | Omisiones | Arameo | Restaurado | LXX | Desalineaciones |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | `Nam` | 47 | 558 | 828 | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| 2 | `Jon` | 48 | 688 | 1,080 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | `Zep` | 53 | 767 | 1,120 | 4 | 2 | 0 | 0 | 0 | 0 | 0 |
| 4 | `Mal` | 55 | 876 | 1,302 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | `Hab` | 56 | 671 | 1,000 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| 6 | `Jol` | 73 | 957 | 1,438 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| 7 | `Mic` | 105 | 1,396 | 2,105 | 7 | 4 | 0 | 0 | 0 | 0 | 0 |
| 8 | `Sng` | 117 | 1,249 | 1,972 | 10 | 4 | 0 | 0 | 0 | 0 | 0 |
| 9 | `Amo` | 146 | 2,042 | 2,978 | 9 | 3 | 0 | 0 | 0 | 0 | 0 |
| 10 | `Hos` | 197 | 2,381 | 3,581 | 7 | 5 | 0 | 0 | 0 | 0 | 0 |

## Evidencia reproducible

- PR: #93;
- workflow: `Seleccionar cuarto libro TAHOT`;
- ejecución: `30779908366` — `success`;
- artefacto: `stepbible-fourth-ot-book-selection`;
- ID: `8843282870`;
- digest: `sha256:ec5fa55b98a28f7d0d3cd8072e222c926114d157d2987403d5178ea270b32989`;
- fuente seleccionada: `tahot-isa-mal`;
- SHA-256 de la fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`.

## Alcance y siguiente paso

Todavía no se ha:

- habilitado `Nam` en el extractor de paquetes;
- generado un paquete de Nahúm;
- inspeccionado individualmente sus cuatro filas Qere/variantes;
- construido un payload;
- modificado el importador;
- creado o aplicado una migración;
- escrito en Supabase.

El siguiente incremento seguro es habilitar Nahúm en el extractor genérico, generar dos paquetes independientes y exigir identidad byte a byte, 47 referencias, 558 palabras visibles, 828 componentes y auditoría individual de sus cuatro filas con variantes. No construir payload ni importar datos hasta completar ese paquete reproducible.
