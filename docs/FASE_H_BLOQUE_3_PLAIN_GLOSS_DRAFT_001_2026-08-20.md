# FASE H — Bloque 3 — Draft editorial 001 de `plain_gloss`

Fecha: 2026-08-20

Estado: **PREPARADO Y AUDITADO — NO APLICADO**.

## Objetivo

Reducir `Español pendiente` usando únicamente la glosa inglesa fuente aprobada de STEPBible/TAHOT como base semántica. Este frente no usa RV1909, contexto bíblico, frecuencia, lema hebreo ni heurísticas de raíz para decidir el significado.

## Primer subconjunto conservador

Se preparó el borrador:

`supabase/migration-drafts/20260820235900_fase_h_glosas_espanolas_plain_verbs_editorial_draft.sql`

Criterios:

- `source_gloss` inglesa exacta;
- glosas verbales explícitas `to ...`;
- `part_of_speech = 'verb'` obligatorio;
- entrada hebrea aprobada y habilitada;
- sin `display_gloss_es` autoritativa;
- sin fila previa en `biblical_hebrew_spanish_glosses`;
- `insert-only` y `ON CONFLICT DO NOTHING` si posteriormente se activa;
- ninguna escritura a Supabase durante esta preparación.

## Resultado read-only contra Supabase

El mapa editorial contiene **54 glosas inglesas distintas** y actualmente alcanzaría:

- **85 entradas léxicas**;
- **82 Strong base distintos**;
- 28 entradas con la misma glosa inglesa pero POS nulo/no verbal quedan fuera del lote;
- 0 filas existentes se sobrescriben;
- 0 filas `rejected` se reactivan.

La diferencia entre 85 entradas y 82 Strong base es esperada porque STEPBible conserva sentidos Extended Strong separados mediante `lexical_id` A/B/C. Auditoría puntual:

- `H7685A` — `to grow` → `crecer`;
- `H7685B` — `to increase` → `aumentar`;
- `H8173A` — `to smear` → `untar`;
- `H8173B` — `to delight` → `deleitar`;
- `H2686A` — `to divide` ya pertenece a otro sentido;
- `H2686B` — `to shoot` → `disparar`;
- `H5953B` — `to glean` → `espigar` mientras otros sufijos A/C/D conservan sentidos diferentes.

Por tanto, el lote se asocia a la **entrada léxica exacta**, no intenta imponer una única traducción a todo el número Strong base.

## Método editorial propuesto

Si el lote se aprueba para aplicación:

- `status = manual_approved`;
- `confidence = 98`;
- `derivation_method = manual_editorial_source_gloss_exact_v1`;
- `source_gloss_snapshot` conserva la glosa inglesa exacta;
- `provenance` registra Strong, capa editorial VIDA y que contexto/RV1909/lema hebreo no se usaron como significado.

Ejemplos del mapa:

- `to bless` → `bendecir`;
- `to conceive` → `concebir`;
- `to listen` → `escuchar`;
- `to live` → `vivir`;
- `to pray` → `orar`;
- `to rain` → `llover`;
- `to rescue` → `rescatar`;
- `to sleep` → `dormir`;
- `to stone` → `apedrear`;
- `to treasure` → `atesorar`.

## FreeDict

El pipeline experimental conserva soporte para FreeDict como señal auxiliar, pero este draft **no importa ni copia glosas de FreeDict**. La edición actual English→Spanish 2025.11.23 se distribuye como un diccionario derivado de Wiktionary con licencia ShareAlike; por tanto no se usará como fuente publicable de la capa española de VIDA sin una decisión explícita sobre compatibilidad de licencia.

La traducción de este lote es una capa editorial propia sobre la glosa inglesa fuente aprobada.

## Gate sensible antes de aplicar

Batch id propuesto:

`fase_h_es_plain_verbs_editorial_001_20260820`

Impacto máximo actual: **85 inserts**.

No modifica:

- `biblical_lexical_entries`;
- lema;
- `lexical_id`;
- Strong;
- hebreo;
- transliteración;
- `source_gloss`;
- corpus bíblico;
- RLS/grants/permisos.

Reversión exacta:

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' = 'fase_h_es_plain_verbs_editorial_001_20260820';
```

## Estado del bloque

FASE H / Bloque 3 continúa activo. Este draft no cambia todavía los contadores reales de cobertura. El objetivo de cierre sigue siendo 10,737/10,737 con español válido y 0 pendientes.
