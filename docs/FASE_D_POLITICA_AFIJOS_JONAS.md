# FASE D · Bloque 4 — Política canónica de afijos de Jonás

Fecha: 2026-08-02

## Objetivo

Inspeccionar los componentes léxicos del paquete TAHOT reproducible de Jonás y fijar únicamente los lemas canónicos que la fuente no expresa en hebreo.

Este incremento no construye payload, no modifica el importador y no escribe en Supabase, RLS, interfaz o producción.

## Paquete inspeccionado

- libro: Jonás (`Jon` / `JON`);
- paquete: `jon.json.gz`;
- SHA-256: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- referencias: 48;
- palabras visibles: 688;
- componentes morfológicos: 1,080.

## Resultado de la inspección

- identificadores léxicos distintos: 288;
- identificadores con lema hebreo explícito en la fuente: 275;
- identificadores que requieren política explícita: 13;
- roles afectados: 13 sufijos; 6 identificadores también aparecen como palabra independiente;
- conflictos de lema fuente: 0.

## Política fijada

| Identificador | Lema canónico | Ocurrencias | Evidencia principal |
|---|---|---:|---|
| `H9020` | `־י` | 14 | `Sp1bs`, forma `י`; ya aprobado en Rut/Hageo y catálogo |
| `H9021` | `־ךָ` | 8 | `Sp2ms`, formas `ךָ`; ya aprobado |
| `H9023` | `־וֹ` | 14 | `Sp3ms`, formas `ו`, `וֹ`, `הוּ`; ya aprobado |
| `H9024` | `־הָ` | 2 | `Sp3fs`, formas `הָ`, `הּ`; ya aprobado |
| `H9028` | `־הֶם` | 7 | `Sp3mp`, formas `הֶם`, `ם`; ya aprobado |
| `H9030` | `־נִי` | 14 | `Sp1bs`, formas `י`, `נִי`; ya aprobado en Rut/Hageo y catálogo |
| `H9031` | `־ךָ` | 7 | `Sp2ms`, sufijo y palabra; ya aprobado |
| `H9033` | `־וֹ` | 12 | `Sp3ms`, sufijo y palabra; ya aprobado |
| `H9034` | `־הָ` | 5 | `Sp3fs`, sufijo y palabra; ya aprobado |
| `H9035` | `־נוּ` | 6 | `Sp1bp`, forma `נוּ`; ya aprobado en Rut y catálogo |
| `H9036` | `־כֶם` | 2 | `Sp2mp`, formas `כֶם`; ya aprobado en Rut/Hageo y catálogo |
| `H9038` | `־הֶם` | 7 | `Sp3mp`, sufijo y palabra; ya aprobado |
| `H9040` | `־נִי` | 1 | `Sp1bs`, forma `י`; decisión ya aprobada para Nahúm y catálogo |

Las trece decisiones reutilizan lemas que ya estaban aprobados y habilitados en `biblical_lexical_entries`. No se introdujo ninguna decisión nueva ni se generalizó un identificador por semejanza visual.

## Cobertura esperada

La validación automática debe confirmar:

- identificadores requeridos: 13;
- identificadores proporcionados: 13;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores vacíos o no hebreos: 0;
- estado: `approved_for_payload_build`;
- paquete de entrada con la huella fijada;
- ausencia de cambios en Supabase o producción.

## Evidencia reproducible

Inspección inicial:

- PR: #121;
- workflow: `Inspeccionar política de afijos de Jonás`;
- ejecución: `30788172076` — `success`;
- artefacto: `jonah-affix-policy-inspection`;
- ID: `8846013025`;
- digest: `sha256:490612130861d8673429915190ba87fb768ad886c14517951b1fc749c907c03c`.

La validación final de cobertura se registrará después de que CI compruebe el archivo de política.

## Alcance y siguiente paso

Todavía no se ha:

- construido un payload de Jonás;
- modificado el contrato del importador;
- creado una migración;
- escrito en Supabase;
- cambiado RLS, interfaz o producción.

Cuando la cobertura exacta sea aprobada, el siguiente incremento seguro será construir fuera de producción un payload determinista de Jonás y auditar conteos, hashes y campos editoriales. No importar Jonás hasta validar ese payload y su importador.
