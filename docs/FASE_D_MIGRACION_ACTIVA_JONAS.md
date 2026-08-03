# FASE D · Bloque 4 — Migración activa de Jonás

Fecha: 2026-08-02

## Objetivo

Convertir mecánicamente el borrador transaccional validado de Jonás en una migración activa versionada y repetir la validación completa en PostgreSQL 16 antes de cualquier aplicación en Supabase.

Migración prevista:

`supabase/migrations/20260803063000_generalizar_importador_payload_tahot_jonas.sql`

La migración no se ha aplicado a Supabase y Jonás no se ha importado en producción.

## Conversión mecánica

La conversión cambia únicamente esta declaración:

- origen: `BORRADOR NO ACTIVO`;
- destino: `MIGRACIÓN ACTIVA`.

El cuerpo SQL debe permanecer idéntico. El workflow genera una copia temporal desde el borrador y exige identidad byte a byte con la migración versionada.

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

## Validaciones requeridas

La prueba PostgreSQL 16 debe confirmar:

- archivo dentro de `supabase/migrations`;
- una sola marca `MIGRACIÓN ACTIVA` y ausencia total de marcas de borrador;
- conversión mecánica byte a byte;
- instalación sin escrituras de datos;
- payload adulterado rechazado sin residuos;
- variante artificial rechazada sin residuos;
- rollback forzado de una importación válida;
- importación exacta con 48 textos, 1,080 ocurrencias, 0 variantes y 1 lote;
- 288 entradas léxicas totales;
- reutilización no destructiva de `H3068G` y `H9020`;
- segunda ejecución idempotente;
- permisos exclusivos de `service_role`;
- función resultante con la huella fijada.

## Estado

La validación está en ejecución. La migración seguirá fuera de Supabase hasta que el mismo archivo versionado apruebe todos los controles anteriores y el documento maestro registre la autorización correspondiente.
