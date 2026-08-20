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

## Cobertura auditada después de Batch 004

- Total hebreo aprobado: **10,737**.
- Español listo: **1,909**.
- Español pendiente: **8,828**.
- Filas editoriales antiguas rechazadas y no visibles: **1,011**.
- Entradas todavía sin fila editorial española: **7,817**.

Los cuatro lotes nuevos aportaron **1,903** filas verificadas; las otras 6 entradas ya estaban cubiertas antes de estos lotes.

## Clasificación de trabajo restante

La clasificación anterior a Batch 004 identificó tres familias estructurales entre las entradas sin fila editorial:

- nombres/entidades exactas codificadas por la fuente;
- glosas inglesas planas;
- glosas con referencia o sentido técnico codificado.

Batch 004 continúa reduciendo exclusivamente la familia de glosas planas mediante equivalencias inglesas directas y conservadoras. Antes de aplicar una política masiva a nombres propios debe recalcularse el contador de cada familia sobre el estado actual.

La clase `exact_named_entity` se detecta únicamente cuando el nombre anterior a `»` coincide exactamente con la entidad anotada antes de `@`. No debe asumirse que una grafía inglesa sea automáticamente la forma española canónica.

## Siguiente trabajo autorizado dentro de Bloque 3

1. Continuar lotes conservadores de `plain_gloss` sin contexto bíblico como significado.
2. Preparar una política específica para nombres propios/entidades bíblicas que distinga:
   - forma fuente;
   - forma española canónica cuando pueda verificarse;
   - clasificación de nombre propio cuando no exista traducción léxica.
3. No llenar automáticamente los nombres con la grafía inglesa bajo la etiqueta de español solo para llevar el contador a cero.
4. Resolver después los `encoded_reference_or_sense` mediante parser de la glosa fuente, sin copiar la anotación técnica como significado.
5. Las 1,011 filas `rejected` antiguas se tratan al final de forma separada y reversible; no reactivarlas por accidente.

## Reversión

Cada lote se revierte de forma localizada, por ejemplo:

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' = 'fase_h_es_batch_004_20260820';
```

Cambiar el `batch_id` permite revertir 001, 002 o 003 sin afectar otras filas.

## Control de fase

- FASE H sigue activa.
- Bloque 3 sigue activo.
- PR #286 debe permanecer OPEN · DRAFT · sin merge.
- No producción sin aprobación explícita.
- No iniciar FASE I.
