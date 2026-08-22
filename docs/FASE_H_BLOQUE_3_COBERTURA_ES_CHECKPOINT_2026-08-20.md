# FASE H — Bloque 3 — checkpoint de cobertura española

Fecha: 2026-08-20

Estado: **ACTIVO — no cerrar Bloque 3**.

## Objetivo de cierre

La cobertura hebrea aprobada debe terminar con:

- 10,737 entradas hebreas aprobadas;
- 10,737 con glosa/clasificación española válida;
- 0 `candidate` visibles;
- 0 pendientes.

No se acepta ocultar `Español pendiente` desde la interfaz como sustituto de datos reales.

## Política aplicada

Los lotes de cobertura española son:

- `insert-only`;
- reversibles por `provenance.batch_id`;
- no modifican `biblical_lexical_entries`;
- no modifican lema, Strong, hebreo, transliteración ni `source_gloss`;
- no usan RV1909 ni coincidencia contextual como significado;
- solo publican filas con `status = verified_derived` o `manual_approved`;
- no sobrescriben filas editoriales existentes (`ON CONFLICT DO NOTHING`).

## Lotes aplicados y versionados

### Batch 001

- Migración: `supabase/migrations/20260820202500_fase_h_glosas_espanolas_batch_001.sql`.
- Batch id: `fase_h_es_batch_001_20260820`.
- Filas insertadas: **721**.
- Glosas fuente inglesas cubiertas: **126**.
- Confianza: 96.
- Contexto usado como significado: **0**.

### Batch 002

- Migración: `supabase/migrations/20260820203500_fase_h_glosas_espanolas_batch_002.sql`.
- Batch id: `fase_h_es_batch_002_20260820`.
- Filas insertadas: **327**.
- Glosas fuente inglesas cubiertas: **95**.
- Confianza: 96.
- Contexto usado como significado: **0**.

### Batch 003

- Migración: `supabase/migrations/20260820205000_fase_h_glosas_espanolas_batch_003.sql`.
- Batch id: `fase_h_es_batch_003_20260820`.
- Filas insertadas: **365**.
- Glosas fuente inglesas cubiertas: **138**.
- Confianza: 96.
- Contexto usado como significado: **0**.

### Batch 004

- Migración: `supabase/migrations/20260820211500_fase_h_glosas_espanolas_batch_004.sql`.
- Batch id: `fase_h_es_batch_004_20260820`.
- Filas insertadas: **490**.
- Glosas fuente inglesas cubiertas: **245**.
- Confianza: 96.
- Contexto usado como significado: **0**.

### Batch 005

- Migración: `supabase/migrations/20260820214500_fase_h_glosas_espanolas_batch_005.sql`.
- Batch id: `fase_h_es_batch_005_20260820`.
- Filas insertadas: **39**.
- Glosas fuente inglesas cubiertas: **13**.
- Confianza: 96.
- Contexto usado como significado: **0**.

## Cobertura auditada después de Batch 005

- Total hebreo aprobado: **10,737**.
- Español listo: **1,948**.
- Español pendiente: **8,789**.
- Filas editoriales antiguas rechazadas y no visibles: **1,011**.
- Entradas todavía sin fila editorial española: **7,778**.

Los cinco lotes nuevos aportaron **1,942** filas verificadas; las otras 6 entradas ya estaban cubiertas antes de estos lotes.

## Familias estructurales pendientes

Debe recalcularse esta clasificación después de cada conjunto relevante de lotes. La política de nombres propios no se mezcla con la de glosas léxicas planas.

- `exact_named_entity`: nombre anterior a `»` coincide exactamente con la entidad anotada antes de `@`.
- `structured_named_entity`: existe una entidad explícita antes de `@` y una referencia ancla; esta identidad puede ser más precisa que la grafía inglesa situada antes de `»`.
- `plain_gloss`: glosa fuente directa sin codificación de entidad/sentido.
- `encoded_reference_or_sense`: anotación técnica o referencia incorporada en `source_gloss`.

No debe asumirse que una grafía inglesa de nombre propio sea automáticamente la forma española canónica.

## Fuente aprobada para nombres propios y draft reproducible

La investigación de fuente queda resuelta para el primer subconjunto de nombres propios:

- identidad fuente: **STEPBible TIPNR**, CC BY 4.0, commit `b83a3cf1224af5cf72606d86d6be1789adc69541`;
- crosswalk TIPNR → Wikidata: `PatristicTextArchive/tipnr_data`, blob fijado `abc3e21b9d08dc310066152f9b62858c4818f4eb`;
- etiqueta española: **Wikidata structured data**, CC0 1.0, con `lastrevid` fijado por Q-ID;
- `BibleNLP/biblical-names-data` continúa **NO APROBADA** para importación por ausencia de licencia inequívoca del dataset compilado.

Se generó automáticamente, sin credenciales de Supabase, el borrador:

`supabase/migration-drafts/20260820233000_fase_h_glosas_nombres_propios_wikidata_draft.sql`

Auditoría reproducible:

`artifacts/fase-h/nombres-propios-wikidata-audit.json`

Resultado del generador externo:

- filas del crosswalk con Q-ID: **848**;
- identidades TIPNR aceptadas tras comprobar etiqueta/alias inglés exacto y español disponible: **546**;
- Q-ID distintos aceptados: **293**;
- descartes por identidad inglesa no coincidente: **46**;
- descartes por ausencia de etiqueta española en Wikidata: **256**;
- fuzzy matching: **0**;
- contexto/RV1909 usados como significado: **0**;
- escrituras a base de datos durante la generación: **0**.

### Dry-run contra Supabase — sin escritura

El borrador congelado fue cruzado en modo solo lectura con el estado real de `biblical_lexical_entries` y `biblical_hebrew_spanish_glosses`:

- identidades congeladas en el draft: **546**;
- filas léxicas hebreas que coinciden exactamente con esas identidades: **576**;
- filas realmente insertables con política `insert-only`: **575**;
- Strong distintos cubiertos por esas 575 filas: **329**;
- filas bloqueadas por una traducción antigua `rejected`: **0**;
- fila ya cubierta por una glosa editorial válida: **1**;
- modificaciones previstas sobre glosas existentes: **0**.

El borrador permanece fuera de `supabase/migrations` y **NO está aplicado**.

## Gate sensible para activar el primer lote de nombres propios

Antes de aplicar el draft se requiere aprobación explícita con este alcance exacto:

1. insertar como máximo **575** filas nuevas en `biblical_hebrew_spanish_glosses`;
2. `status = verified_derived`;
3. confianza **98**;
4. `derivation_method = tipnr_wikidata_exact_entity_v1`;
5. conservar en `provenance` TIPNR, revisión STEPBible, blob del crosswalk, Q-ID de Wikidata, revisión `lastrevid`, licencias y Strong;
6. no modificar `biblical_lexical_entries`, `source_gloss`, lema, Strong, hebreo, transliteración, RLS ni grants;
7. no actualizar ni reactivar las **1,011** filas antiguas `rejected`;
8. `ON CONFLICT DO NOTHING`, por lo que no se sobrescribe una glosa que aparezca antes de aplicar el lote.

Reversión exacta propuesta:

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_draft_20260820';
```

## Siguiente trabajo autorizado dentro de Bloque 3

1. Tras aprobación explícita, activar/aplicar el lote de hasta 575 nombres propios y volver a auditar cobertura real.
2. Continuar con los nombres TIPNR sin etiqueta española en Wikidata mediante una segunda fuente abierta o validación editorial, sin inventar castellanizaciones.
3. Continuar lotes conservadores de `plain_gloss` sin contexto bíblico como significado.
4. Resolver después los `encoded_reference_or_sense` mediante parser de la glosa fuente, sin copiar la anotación técnica como significado.
5. Las 1,011 filas `rejected` antiguas se tratan al final de forma separada y reversible; no reactivarlas por accidente.

## Reversión de lotes aplicados

Cada lote aplicado se revierte de forma localizada, por ejemplo:

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' = 'fase_h_es_batch_005_20260820';
```

Cambiar el `batch_id` permite revertir cualquiera de los lotes anteriores sin afectar otras filas.

## Control de fase

- FASE H sigue activa.
- Bloque 3 sigue activo.
- PR #286 debe permanecer OPEN · DRAFT · sin merge.
- No producción sin aprobación explícita.
- No iniciar FASE I.
