# FASE D · Bloque 4 — Migración activa de Jonás

Fecha: 2026-08-02

## Resultado

El borrador transaccional validado de Jonás fue convertido mecánicamente en una migración activa versionada y validado nuevamente en PostgreSQL 16.

Migración:

`supabase/migrations/20260803063000_generalizar_importador_payload_tahot_jonas.sql`

La migración **no se ha aplicado a Supabase** y Jonás todavía no se ha importado en producción.

## Conversión mecánica

La conversión cambió únicamente esta declaración:

- origen: `BORRADOR NO ACTIVO`;
- destino: `MIGRACIÓN ACTIVA`.

El cuerpo SQL permaneció idéntico. La migración generada fue comparada byte a byte con el borrador activado antes de ejecutar PostgreSQL.

- SHA-256 de la migración activa:
  `2d1122d5fc2502365c28797e33cd6bc36e2cca1fe0a535e5be94527790fb09d9`;
- marca activa: verificada;
- marcas de borrador restantes: 0.

## Contrato fijado

- función base OBA/RUT/HAG/NAM:
  `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON:
  `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- paquete:
  `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- archivo payload:
  `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella canónica interna:
  `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`.

## Validación PostgreSQL 16

La prueba instaló sucesivamente las migraciones activas de Abdías, Rut, Hageo y Nahúm antes de ejecutar la migración activa de Jonás.

Controles aprobados:

- instalación sin escrituras de datos;
- payload adulterado rechazado sin residuos;
- variante artificial rechazada sin residuos;
- rollback forzado de una importación válida;
- cero residuos después del rollback;
- importación válida completa;
- segunda ejecución idempotente;
- permisos exclusivos de `service_role`;
- `anon` y `authenticated` sin `EXECUTE`;
- reutilización no destructiva de `H3068G` y `H9020`;
- campos editoriales españoles nulos para los datos nuevos;
- función instalada con la huella esperada.

Conteos comprometidos:

- entradas léxicas totales: 288;
- textos: 48;
- palabras visibles: 688;
- ocurrencias: 1,080;
- variantes: 0;
- lotes: 1.

## Evidencia reproducible

- PR: #124;
- workflow: `Validar migración activa TAHOT de Jonás`;
- ejecución inicial: `30791049474` — `success`;
- artefacto: `stepbible-jonah-active-migration-validation`;
- ID: `8847053282`;
- digest: `sha256:bdded51bb186f9bbea90ef7cb61d0f88befa3e7fbf0c80ba09dd4c28e24b9aaa`;
- estado: `validated_outside_production`.

## Limpieza prevista

Antes de fusionar se retirarán:

- el borrador de migración;
- el activador mecánico;
- el marcador de materialización;
- el workflow temporal de materialización;
- el workflow sustituido de validación del borrador.

El repositorio conservará una única ruta activa: migración, prueba y workflow permanente.

## Alcance y siguiente paso

No se aplicó la migración a Supabase, no se importó Jonás y no se modificaron RLS, interfaz o producción.

Después de validar el commit limpio, la migración activa podrá quedar autorizada para aplicación controlada en Supabase. No debe aplicarse hasta que `__VIDA_INTERNACIONAL.md` registre explícitamente esa autorización.
