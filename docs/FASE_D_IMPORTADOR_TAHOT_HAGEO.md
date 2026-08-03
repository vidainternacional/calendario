# FASE D · Bloque 4 — Importador transaccional de Hageo

Fecha: 2026-08-02

## Resultado

La ampliación del importador TAHOT para aceptar exactamente Hageo fue diseñada y validada fuera de producción en PostgreSQL 16.

El SQL permanece como borrador no activo en:

`supabase/migration-drafts/20260803020000_importador_payload_tahot_hageo.sql`

No se aplicó ninguna migración a Supabase durante este incremento.

## Estado base protegido

El borrador parte de la función OBA/RUT ya validada y exige su huella exacta:

`dad481d9de705efc566dfa1beaa68cba99b85de069f241733183e33c3b04b381`

La ejecución aborta si la función instalada no coincide con esa definición.

## Contrato cerrado de Hageo

- código interno: `HAG`;
- código STEPBible: `Hag`;
- dataset: `TAHOT Isa-Mal`;
- archivo fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella interna del payload: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- referencias: 38;
- palabras visibles: 600;
- ocurrencias: 911;
- identificadores léxicos: 235;
- filas fuente con variantes: 2;
- variantes estructuradas: 3.

El importador continúa rechazando cualquier tercer contrato no autorizado o combinación parcial de huellas y conteos.

## Validación específica de variantes

Para Hageo se exigen exactamente:

1. Hageo 1:8, variante ortográfica:
   - base `וְאֶכָּבְדָ֖ה`;
   - variante `וְאֶכָּבְדָ֖`;
   - ancla 9;
   - testigo `L`.
2. Hageo 1:8, sustitución Ketiv:
   - base Qere `וְאֶכָּבְדָ֖ה`;
   - Ketiv `וְאֶכָּבֵד`;
   - ancla 9;
   - testigo `K`.
3. Hageo 1:10, variante ortográfica:
   - base `שָמַ֖יִם`;
   - variante `שָׁמַ֖יִם`;
   - ancla 5;
   - testigo `ABH`.

Hageo no admite en este paquete variantes de adición, omisión o transposición.

## Pruebas aprobadas

PostgreSQL 16 confirmó:

- instalación del borrador sobre la función OBA/RUT exacta;
- permisos exclusivos de `service_role`;
- payload alterado rechazado antes de escribir datos;
- cero residuos después del rechazo;
- importación válida dentro de una transacción revertida;
- cero residuos después del rollback;
- importación comprometida con conteos exactos;
- segunda ejecución con los mismos conteos y resultado;
- reutilización no destructiva de `H3068G` y `H9020`;
- 235 entradas léxicas totales, no 237;
- 911 ocurrencias;
- 38 textos;
- 3 variantes;
- 1 lote;
- cero glosas españolas nuevas en ocurrencias;
- cero traducciones literales españolas nuevas;
- cero explicaciones españolas nuevas de variantes;
- cero glosas españolas nuevas asociadas al paquete.

## Seguridad

- `anon`: sin `EXECUTE`;
- `authenticated`: sin `EXECUTE`;
- `service_role`: con `EXECUTE`;
- el borrador reside fuera de `supabase/migrations`;
- no se modificó RLS;
- no se modificó la interfaz;
- no se utilizó IA para crear contenido bíblico.

## Evidencia

- workflow: `Validar importador transaccional de Hageo`;
- ejecución inicial: `30778074154` — `success`;
- artefacto: `stepbible-haggai-importer-validation`;
- ID: `8842724863`;
- digest: `sha256:62e980c02974c77859b6ccc5ea270d11f04a7c86688c2556595a045cca110029`.

## Siguiente paso

Después de registrar este hito en el documento maestro, el siguiente incremento seguro es convertir el borrador validado en una migración activa versionada y volver a validarla desde el estado OBA/RUT antes de aplicarla de forma controlada a Supabase.

No importar Hageo hasta que la migración activa haya pasado esa segunda validación.
