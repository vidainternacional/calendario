# FASE D · Bloque 4 — Paquete TAHOT reproducible de Jonás

Fecha: 2026-08-02

## Objetivo

Habilitar Jonás (`Jon` / `JON`) en el extractor genérico de TAHOT y generar dos paquetes independientes para comprobar identidad byte a byte, integridad de referencias, palabras, morfemas y procedencia.

Este incremento no construye payload, no modifica el importador y no escribe en Supabase, RLS, interfaz o producción.

## Fuente fijada

- repositorio: `STEPBible/STEPBible-Data`;
- commit: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- dataset: `TAHOT Isa-Mal`;
- SHA-256 del archivo fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- licencia: CC BY 4.0;
- atribución: STEP Bible.

## Resultado estructural

- capítulos: 4;
- referencias: 48 de 48;
- filas fuente: 688;
- palabras visibles: 688;
- componentes morfológicos: 1,080;
- estado textual observado: `leningrad`;
- filas con variantes: 0;
- casos Qere: 0;
- omisiones Qere: 0;
- filas hebreas: 688;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- idiomas desconocidos: 0;
- desalineaciones: 0;
- hashes de línea inválidos: 0;
- hashes de línea únicos: 688;
- palabras visibles artificiales: 0;
- máximo de componentes por fila: 4.

Las 48 referencias corresponden exactamente a:

- capítulo 1: 17 versículos;
- capítulo 2: 10 versículos;
- capítulo 3: 10 versículos;
- capítulo 4: 11 versículos.

El catálogo ordenado comienza en `Jon.1.1` y termina en `Jon.4.11`. Cada versículo conserva índices visibles continuos desde 1 hasta su conteo declarado.

## Reproducibilidad

Dos ejecuciones independientes produjeron paquetes, manifiestos y auditorías idénticos.

- archivo: `jon.json.gz`;
- tamaño: 131,092 bytes;
- SHA-256: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- compresión determinista: `gzip`, nivel 9, `mtime=0` y nombre interno vacío;
- comparación de bytes: aprobada;
- comparación de manifiestos: aprobada;
- comparación de auditorías: aprobada.

El workflow permanente exige el tamaño y la huella anteriores. Cualquier cambio futuro en los bytes del paquete detendrá CI, aunque los conteos permanezcan iguales.

## Ausencia de variantes y Qere

La fuente fijada no contiene filas Qere ni campos de variantes para Jonás.

El auditor exige que:

- las 688 filas tengan estado textual `leningrad`;
- ninguna fila sea una omisión Qere;
- ninguna fila contenga evidencia de significado o ortografía variante;
- cada fila produzca exactamente una palabra visible;
- no existan índices artificiales o discontinuos.

La primera versión del auditor esperaba incorrectamente el estado `base`. CI la detuvo en `Jon.1.1` al observar el valor real `leningrad`. La regla fue corregida sin modificar el extractor, el paquete, sus conteos o su SHA-256.

## Controles automáticos

El workflow permanente verifica:

- auto-tests del esquema, extractor y auditor de Jonás;
- catálogo exacto de 48 referencias;
- doble generación independiente;
- identidad byte a byte;
- tamaño y SHA-256 fijados;
- 688 filas y palabras visibles;
- 1,080 componentes morfológicos;
- continuidad de índices visibles;
- 688 hashes de línea válidos y únicos;
- estado textual `leningrad` en todas las filas;
- cero variantes, Qere, omisiones, texto restaurado y adiciones LXX;
- cero palabras artificiales, desalineaciones o idiomas desconocidos.

## Evidencia

- PR: #120;
- workflow: `Validar paquete TAHOT de Jonás`;
- primera generación reproducible: ejecución `30787726852`;
- validación corregida: ejecución `30787820694` — `success`;
- artefacto: `stepbible-jonah-package`;
- ID: `8845878474`;
- digest: `sha256:10b71681dd4dda3ddfff617631998a34d105ffcaa208ffa04d40264fc0881ad0`.

## Alcance y siguiente paso

Todavía no se ha:

- inspeccionado el conjunto completo de identificadores léxicos de Jonás;
- fijado una política canónica para afijos sin lema hebreo explícito;
- construido un payload;
- modificado el contrato del importador;
- creado o aplicado una migración;
- escrito en Supabase.

El siguiente incremento seguro será inspeccionar los componentes léxicos de Jonás y fijar únicamente los lemas canónicos de afijos que falten. No construir payload ni importar Jonás hasta completar y registrar esa política.
