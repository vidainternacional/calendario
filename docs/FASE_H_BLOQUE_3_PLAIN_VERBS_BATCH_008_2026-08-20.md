# FASE H — Bloque 3 — Lote 008 de verbos `plain_gloss`

Fecha: 2026-08-20

Estado: **APLICADO Y AUDITADO — Bloque 3 sigue ACTIVO**.

## Alcance aprobado

El usuario aprobó aplicar el primer subconjunto editorial de glosas verbales inglesas exactas dentro de `plain_gloss`.

## Criterio

El lote se limita a entradas hebreas aprobadas y habilitadas que cumplen simultáneamente:

- `source_gloss` inglés coincide exactamente con una de 54 glosas verbales editoriales;
- `part_of_speech = 'verb'`;
- no existe `display_gloss_es` directo;
- no existe todavía una fila editorial para el `lexical_entry_id`;
- la traducción se deriva únicamente de la glosa inglesa fuente aprobada;
- RV1909 no se usa como significado;
- el contexto no se usa como significado;
- el lema hebreo no se usa para inferir significado.

La escritura se realiza por `lexical_entry_id`, por lo que sentidos A/B dentro de un mismo Strong base permanecen separados. Casos auditados incluyen:

- `H7685A` — `to grow` → `crecer`;
- `H7685B` — `to increase` → `aumentar`;
- `H8173A` — `to smear` → `untar`;
- `H8173B` — `to delight` → `deleitar`.

## Migración aplicada

Archivo:

`supabase/migrations/20260821000700_fase_h_glosas_espanolas_plain_verbs_editorial.sql`

Batch id:

`fase_h_es_plain_verbs_editorial_001_20260820`

Método:

`manual_editorial_source_gloss_exact_v1`

Estado editorial:

`manual_approved`

Confianza:

`98`

Política:

- `insert-only`;
- `ON CONFLICT DO NOTHING`;
- no modifica `biblical_lexical_entries`;
- no modifica lema, Strong, hebreo, transliteración ni `source_gloss`;
- no toca RLS, grants ni permisos;
- no reactiva filas `rejected`;
- contexto usado como significado: **false**;
- RV1909 usado como significado: **false**;
- lema hebreo usado para inferir significado: **false**.

## Resultado real en Supabase

Auditoría posterior a la aplicación:

- total hebreo aprobado: **10,737**;
- español listo antes del lote: **2,245**;
- filas insertadas por Batch 008: **85**;
- Strong distintos cubiertos: **82**;
- glosas inglesas exactas cubiertas: **54**;
- español listo después del lote: **2,330**;
- español pendiente: **8,407**;
- filas antiguas `rejected`: **1,011**, sin cambios;
- entradas sin `source_gloss`: **0**.

## Reversión exacta

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' =
  'fase_h_es_plain_verbs_editorial_001_20260820';
```

## Regresión

`tests/regression/fase-h-plain-gloss-editorial-draft.test.mjs` protege ahora la migración activa y verifica:

- coincidencia exacta con `source_gloss`;
- filtro `part_of_speech = 'verb'`;
- ausencia de uso de RV1909/contexto/lema como significado;
- separación de sentidos múltiples bajo un mismo Strong base;
- operación insert-only y reversión por `batch_id`.

## Siguiente trabajo dentro del mismo Bloque 3

1. Continuar con subconjuntos `plain_gloss` nominales/adjetivales conservadores.
2. Mantener aisladas las 1,011 filas `rejected` hasta revisión específica.
3. Continuar nombres propios exactos y estructurados por separado.
4. No cerrar Bloque 3 hasta alcanzar **10,737/10,737** y **0 pendientes**.
