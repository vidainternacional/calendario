# FASE D · Bloque 4 — Política canónica de afijos de Nahúm

Fecha: 2026-08-02

## Objetivo

Inspeccionar los componentes léxicos del paquete TAHOT reproducible de Nahúm y fijar únicamente los lemas canónicos que la fuente no expresa en hebreo.

Este incremento no construye payload, no modifica el importador y no escribe en Supabase, RLS, interfaz o producción.

## Paquete inspeccionado

- libro: Nahúm (`Nam` / `NAM`);
- paquete: `nam.json.gz`;
- SHA-256: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- referencias: 47;
- palabras visibles: 558;
- componentes morfológicos: 828.

## Resultado de la inspección

- identificadores léxicos distintos: 387;
- identificadores con lema hebreo explícito en la fuente: 373;
- identificadores que requieren política explícita: 14;
- roles afectados: 14 sufijos; 3 de esos identificadores también aparecen como palabra independiente;
- conflictos de lema fuente: 0.

## Política fijada

| Identificador | Lema canónico | Evidencia |
|---|---|---|
| `H9021` | `־ךָ` | catálogo aprobado y diez ocurrencias `Sp2ms` |
| `H9022` | `־ךְ` | catálogo aprobado y veintidós ocurrencias `Sp2fs` |
| `H9023` | `־וֹ` | catálogo aprobado; formas masculinas singulares observadas |
| `H9024` | `־הָ` | catálogo aprobado; formas femeninas singulares observadas |
| `H9028` | `־הֶם` | catálogo aprobado y cinco ocurrencias `Sp3mp` |
| `H9029` | `־ן` | catálogo aprobado; formas femeninas plurales `הֶן` |
| `H9031` | `־ךָ` | catálogo aprobado y dos ocurrencias `Sp2ms` |
| `H9032` | `־ךְ` | catálogo aprobado y diecisiete ocurrencias `Sp2fs` |
| `H9033` | `־וֹ` | catálogo aprobado y cuatro ocurrencias `Sp3ms` |
| `H9034` | `־הָ` | catálogo aprobado y cuatro ocurrencias `Sp3fs` |
| `H9038` | `־הֶם` | catálogo aprobado y una ocurrencia `Sp3mp` |
| `H9040` | `־נִי` | decisión nueva restringida a dos ocurrencias `Sp1bs`, ambas con forma `נִי` |
| `H9043` | `־וֹ` | catálogo aprobado y una ocurrencia `Sp3ms` |
| `H9048` | `־ם` | catálogo aprobado y una ocurrencia `Sp3mp` |

Trece decisiones reutilizan lemas ya aprobados y habilitados en `biblical_lexical_entries`. La única decisión nueva, `H9040`, se limita a la forma y función morfológica observadas en Nahúm y no generaliza otros identificadores.

## Cobertura validada

La validación automática confirmó:

- identificadores requeridos: 14;
- identificadores proporcionados: 14;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores vacíos o no hebreos: 0;
- estado: `approved_for_payload_build`;
- paquete de entrada con la huella fijada;
- ausencia de cambios en Supabase o producción.

## Evidencia reproducible

Inspección inicial:

- PR: #100;
- workflow: `Inspeccionar política de afijos de Nahúm`;
- ejecución: `30781229273` — `success`;
- artefacto: `nahum-affix-policy-inspection`;
- ID: `8843700436`;
- digest: `sha256:bd003decafd406eaca7f002055c050e86826e6b1bd5fcd588941f969d70c9cf1`.

Validación final de cobertura:

- ejecución: `30781338248` — `success`;
- artefacto: `nahum-affix-policy-inspection`;
- ID: `8843741189`;
- digest: `sha256:7641c71b53fb1ae247e3e9a564a13bf358cfae7811181e3b13f6ebf5917ca9e8`;
- resultado: `approved_for_payload_build`.

## Alcance y siguiente paso

Todavía no se ha:

- construido un payload de Nahúm;
- modificado el contrato del importador;
- creado una migración;
- escrito en Supabase;
- cambiado RLS, interfaz o producción.

La política quedó aprobada para la construcción del payload. El siguiente incremento seguro es construir fuera de producción un payload determinista de Nahúm y auditar sus conteos, hashes, variantes y campos editoriales. No importar Nahúm hasta validar ese payload y su importador.
