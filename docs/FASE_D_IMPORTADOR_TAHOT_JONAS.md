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

## Validación PostgreSQL 16

La prueba partió del fixture textual mínimo e instaló sucesivamente las migraciones activas de Abdías, Rut, Hageo y Nahúm antes de ejecutar el borrador de Jonás.

Controles aprobados:

- función base OBA/RUT/HAG/NAM exacta;
- derivación byte a byte del borrador;
- payload con huella adulterada rechazado sin escrituras;
- variante artificial rechazada sin escrituras;
- estado posterior a ambos rechazos: dos entradas léxicas del fixture y cero textos, ocurrencias, variantes o lotes;
- rollback forzado de una importación válida;
- importación exacta;
- segunda ejecución idempotente;
- `anon` y `authenticated` sin `EXECUTE`;
- `service_role` como único rol con `EXECUTE`.

Conteos después de la importación válida:

- entradas léxicas totales: 288;
- ocurrencias: 1,080;
- textos: 48;
- variantes: 0;
- lotes: 1.

El total léxico permanece en 288 porque Jonás reutiliza las dos entradas preexistentes del fixture, `H3068G` y `H9020`, y añade únicamente las otras 286 entradas necesarias.

## Integridad adicional

- 688 palabras visibles reconstruidas mediante la combinación capítulo, versículo e índice visible;
- cero variantes textuales almacenadas;
- cero traducciones literales españolas añadidas;
- cero glosas españolas de ocurrencia añadidas;
- cero campos editoriales españoles en las entradas nuevas;
- `H3068G` conserva `fixture:H3068G` y la glosa `Yahvé`;
- `H9020` conserva `fixture:H9020` y la glosa `mi`;
- metadata de los cuatro archivos fuente igual al contrato fijado;
- permisos restringidos a `service_role`.

La primera ejecución falló únicamente porque la prueba contaba `display_word_index` de forma global, aunque ese índice reinicia en cada versículo. La consulta fue corregida para contar combinaciones únicas de capítulo, versículo e índice visible. El importador, borrador y payload no cambiaron.

## Huellas de función

- función base OBA/RUT/HAG/NAM:
  `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON en PostgreSQL efímero:
  `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`.

## Evidencia reproducible

- PR: #123;
- workflow: `Validar importador transaccional de Jonás`;
- primera ejecución con corrección pendiente: `30789738406`;
- ejecución aprobada inicial: `30789918273` — `success`;
- ejecución limpia sin materializadores: `30790108172` — `success`;
- artefacto limpio: `stepbible-jonah-importer-validation`;
- ID: `8846702429`;
- digest: `sha256:ec6daf133ce112726d8d1ab017a4a386ba9c91240d40d453426cd52e1d770856`;
- estado: `validated_outside_production`.

## Alcance y siguiente paso

No se creó una migración activa, no se aplicó el borrador y no se importó Jonás en Supabase.

El siguiente incremento seguro es convertir mecánicamente este borrador validado en una migración activa versionada y repetir la prueba completa sobre ese archivo exacto. Solo después de una segunda validación podrá considerarse una aplicación controlada en Supabase.
