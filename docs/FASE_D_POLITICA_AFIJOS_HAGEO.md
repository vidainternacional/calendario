# FASE D · Bloque 4 — Política canónica de afijos de Hageo

Fecha: 2026-08-02

## Objetivo

Inspeccionar los componentes léxicos del paquete TAHOT reproducible de Hageo y fijar únicamente los lemas canónicos que la fuente no expresa en hebreo.

Este incremento no construye payload, no modifica el importador y no escribe en Supabase.

## Paquete inspeccionado

- libro: Hageo (`Hag` / `HAG`);
- paquete: `hag.json.gz`;
- SHA-256: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- referencias: 38;
- palabras visibles: 600;
- componentes morfológicos: 911.

## Resultado de la inspección

- identificadores léxicos distintos: 235;
- identificadores con lema hebreo explícito en la fuente: 224;
- identificadores que requieren política explícita: 11;
- roles afectados: 11 sufijos; 4 de esos identificadores también aparecen como palabra independiente;
- conflictos de lema fuente: 0.

## Política fijada

| Identificador | Lema canónico | Evidencia |
|---|---|---|
| `H9020` | `־י` | decisión ya aprobada y forma observada `י` |
| `H9023` | `־וֹ` | decisión ya aprobada y formas `ו`, `וֹ` |
| `H9024` | `־הָ` | decisión ya aprobada y formas `הָ`, `הּ` |
| `H9026` | `־כֶם` | sufijo 2mp; once ocurrencias con formas `כֶם` |
| `H9028` | `־הֶם` | decisión ya aprobada y formas `הֶם` |
| `H9030` | `־נִי` | decisión ya aprobada; sufijo/objeto de primera persona |
| `H9031` | `־ךָ` | decisión ya aprobada y forma `ךָ` |
| `H9033` | `־וֹ` | decisión ya aprobada y formas `הוּ`, `וֹ` |
| `H9036` | `־כֶם` | decisión ya aprobada y formas `כֶם` |
| `H9046` | `־כֶם` | sufijo 2mp; una ocurrencia con forma `כֶם` y misma función canónica aprobada para `H9036` |
| `H9048` | `־ם` | decisión ya aprobada y forma observada `ם` |

Nueve decisiones ya existían en el catálogo léxico aprobado por los pilotos anteriores. Las dos decisiones nuevas, `H9026` y `H9046`, se restringen a la forma y función morfológica observadas en Hageo y no generalizan otros identificadores.

## Cobertura exigida

La validación automática debe comprobar:

- 11 identificadores requeridos;
- 11 identificadores proporcionados;
- 0 claves faltantes;
- 0 claves sobrantes;
- 0 valores vacíos o no hebreos;
- paquete de entrada con la huella fijada;
- ausencia de cambios en Supabase o producción.

## Evidencia inicial

- workflow: `Inspeccionar política de afijos de Hageo`;
- ejecución de inspección: `30777462801` — `success`;
- artefacto: `haggai-affix-policy-inspection`;
- ID: `8842514312`;
- digest: `sha256:458e0db554af72b9ed061604c19dc42262902ff7e49e27e8bedc5c702bc72334`.

## Alcance y siguiente paso

Todavía no se ha:

- construido un payload de Hageo;
- modificado el contrato del importador;
- creado una migración;
- escrito en Supabase;
- cambiado RLS, interfaz o producción.

Después de que CI confirme la cobertura exacta de esta política, el siguiente incremento seguro será construir fuera de producción un payload determinista de Hageo y auditar sus conteos, hashes, variantes y campos editoriales. No importar Hageo hasta validar ese payload y su importador.
