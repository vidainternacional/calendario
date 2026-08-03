# FASE D · Bloque 4 — Importador transaccional de Jonás

Fecha: 2026-08-02

## Objetivo

Ampliar fuera de producción el importador TAHOT validado para aceptar exactamente el payload canónico de Jonás, preservando los contratos de Abdías, Rut, Hageo y Nahúm.

El SQL permanece en:

`supabase/migration-drafts/20260803060000_importador_payload_tahot_jonas.sql`

Está marcado como **BORRADOR NO ACTIVO**. No se aplicó ninguna migración ni se modificó Supabase, RLS, interfaz o producción.

## Derivación controlada

`generate_jonah_importer_draft.py`:

1. lee la migración activa `20260803043000_generalizar_importador_payload_tahot_nahum.sql`;
2. extrae exactamente el contrato OBA/RUT/HAG/NAM y el validador de Nahúm;
3. añade únicamente el contrato `JON` y una defensa de ausencia de variantes;
4. exige que la función base tenga SHA-256 `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
5. aborta si cualquiera de las anclas aparece cero veces o más de una vez.

El workflow regenera el borrador en `/tmp` y exige identidad byte a byte con el archivo versionado.

## Contrato cerrado de Jonás

- código interno: `JON`;
- código STEPBible: `Jon`;
- dataset: `TAHOT Isa-Mal`;
- fuente SHA-256: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- paquete: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- archivo payload: `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella interna: `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`;
- referencias: 48;
- palabras visibles: 688;
- ocurrencias: 1,080;
- identificadores léxicos: 288;
- filas fuente con variantes: 0;
- variantes estructuradas: 0.

## Controles PostgreSQL 16

La prueba debe partir del fixture textual mínimo e instalar sucesivamente las migraciones activas de Abdías, Rut, Hageo y Nahúm antes de ejecutar el borrador de Jonás.

Controles obligatorios:

- función base exacta;
- derivación byte a byte del borrador;
- payload con huella adulterada rechazado sin escrituras;
- variante artificial rechazada sin escrituras;
- rollback forzado de una importación válida;
- importación exacta con 48 textos, 1,080 ocurrencias, 0 variantes y 1 lote;
- 288 entradas léxicas totales por reutilización de `H3068G` y `H9020`;
- preservación de las glosas editoriales preexistentes de esas dos entradas;
- campos editoriales españoles nulos para datos nuevos;
- segunda ejecución idempotente;
- `anon` y `authenticated` sin `EXECUTE`;
- `service_role` como único rol con `EXECUTE`.

## Estado

La validación está en ejecución en el PR #123. La evidencia final, la huella de la función resultante y los conteos confirmados se registrarán únicamente después de que PostgreSQL 16 apruebe el mismo commit documentado.

No crear migración activa ni tocar Supabase hasta completar esta validación.
