# FASE H — Bloque 3 — Lote 007 de aliases españoles de nombres propios

Fecha: 2026-08-20

Estado: **APLICADO Y AUDITADO — Bloque 3 sigue ACTIVO**.

## Alcance aprobado

El usuario aprobó aplicar el siguiente subconjunto de hasta 59 traducciones adicionales de nombres propios, siempre que conservaran el mismo criterio conservador de procedencia, ancla bíblica y reversión.

## Endurecimiento final antes de aplicar

La auditoría read-only redujo el máximo inicial a **54 entradas léxicas**.

Se exigió simultáneamente:

- la grafía fuente antes de `»` coincide con la identidad TIPNR antes de `@`;
- el alias proviene de la capa española de Wikidata;
- la revisión `lastrevid` usada en auditoría queda congelada;
- el alias es una sola forma nominal con inicial mayúscula;
- existe un único alias candidato distinto para la entrada;
- la misma grafía, conservando acentos, aparece en el versículo exacto que TIPNR usa como ancla dentro de RV1909;
- RV1909 se usa únicamente como validación de superficie y no como significado léxico contextual.

Esta guardia evita reutilizar el alias de una identidad alternativa para traducir otra forma fuente. Casos estructurados donde el nombre antes de `»` no coincide con la entidad antes de `@` permanecen pendientes para tratamiento separado.

## Incidente no destructivo durante la aplicación

La primera versión de la migración consultaba en vivo la API de Wikidata durante la ejecución en Supabase. La sentencia excedió `statement_timeout` y fue cancelada.

Auditoría inmediatamente posterior:

- filas escritas por el batch: **0**;
- no hubo aplicación parcial;
- no se modificó ninguna glosa previa.

La migración se corrigió antes de reintentar:

- se congelaron las **52 identidades fuente** ya auditadas;
- esas 52 identidades corresponden a **54 entradas léxicas** porque dos glosas fuente representan más de una entrada aprobada;
- la migración final ya no realiza ninguna llamada HTTP;
- Supabase vuelve a validar cada alias contra el ancla RV1909 local antes del `INSERT`.

## Migración aplicada

Archivo:

`supabase/migrations/20260820235000_fase_h_glosas_nombres_propios_alias_rv1909_anchor.sql`

Batch id:

`fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820`

Método:

`tipnr_wikidata_es_alias_rv1909_anchor_exact_v1`

Confianza:

`99`

Política:

- `insert-only`;
- `ON CONFLICT DO NOTHING`;
- 52 identidades fuente congeladas;
- 54 filas reales insertadas;
- no modifica `biblical_lexical_entries`;
- no modifica lema, Strong, hebreo, transliteración ni `source_gloss`;
- no toca RLS, grants ni permisos;
- no reactiva filas `rejected`;
- contexto usado como significado: **false**;
- RV1909 usado como significado: **false**;
- RV1909 usado como validación de superficie: **true**.

## Resultado real en Supabase

Después de aplicar y auditar:

- total hebreo aprobado: **10,737**;
- español listo antes del lote: **2,191**;
- filas insertadas por Batch 007: **54**;
- Strong distintos cubiertos: **26**;
- Q-ID distintos conservados en procedencia: **23**;
- español listo después del lote: **2,245**;
- español pendiente: **8,492**;
- filas antiguas `rejected`: **1,011**, sin cambios.

## Reversión exacta

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' =
  'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820';
```

## Regresión

`tests/regression/fase-h-nombres-propios-alias-batch.test.mjs` protege que:

- el mapa aplicado queda congelado y no depende de red durante la migración;
- existen exactamente 52 identidades fuente congeladas y un máximo documentado de 54 entradas;
- se exige identidad fuente/TIPNR consistente;
- se vuelve a verificar la superficie en `rv1909-ebible`;
- se conserva procedencia Wikidata/TIPNR;
- `context_used_as_meaning = false`;
- `rv1909_used_as_meaning = false`;
- la operación sigue siendo insert-only y reversible.

## Siguiente trabajo dentro del mismo Bloque 3

1. Continuar nombres propios todavía pendientes sin rebajar el criterio de identidad.
2. Resolver de forma separada los casos estructurados donde la grafía fuente y la identidad TIPNR no son la misma forma.
3. Continuar lotes conservadores de `plain_gloss` desde la glosa inglesa fuente aprobada.
4. Mantener las 1,011 filas `rejected` aisladas hasta su revisión específica.
5. No cerrar Bloque 3 hasta alcanzar **10,737/10,737** y **0 pendientes**.
