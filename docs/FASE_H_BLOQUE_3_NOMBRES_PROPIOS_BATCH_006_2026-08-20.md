# FASE H — Bloque 3 — Lote 006 de nombres propios

Fecha: 2026-08-20

Estado: **APLICADO Y AUDITADO — Bloque 3 sigue ACTIVO**.

## Motivo del endurecimiento previo a la aplicación

El borrador inicial TIPNR → Wikidata produjo 575 filas insertables, pero la auditoría previa detectó que un mismo nombre inglés puede corresponder a homónimos bíblicos o a etiquetas de Wikidata con desambiguadores editoriales. Por tanto, el Q-ID por sí solo no se consideró suficiente para publicar una forma española.

Se añadió una segunda evidencia obligatoria:

- la identidad TIPNR debe seguir siendo exacta;
- la etiqueta/alias inglés de Wikidata debe seguir coincidiendo exactamente;
- la etiqueta española completa de Wikidata debe aparecer en la referencia exacta usada por TIPNR dentro de RV1909;
- RV1909 se usa únicamente para validar la superficie española, **no** como significado léxico ni como traducción inferida por contexto.

Ejemplos auditados antes de escribir:

- `Aaron»Aaron@Exo.4.14-Heb` → `Aarón`: pasa la validación y fue insertado;
- `Azariah»Azariah@1Ch.2.38-` → Wikidata proponía una entidad cuya etiqueta española era `Uzías`: no aparece como superficie correspondiente en el ancla y quedó fuera;
- `Amon»Amon@1Ki.22.26-2Ch` → etiqueta de Wikidata con desambiguación adicional: quedó fuera;
- `Asaph»Asaph@Neh.2.8` → etiqueta de Wikidata con descriptor de otra entidad: quedó fuera.

## Migración aplicada

Archivo versionado:

`supabase/migrations/20260820233030_fase_h_glosas_nombres_propios_wikidata_rv1909_anchor.sql`

Batch id:

`fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820`

Método:

`tipnr_wikidata_rv1909_anchor_exact_v1`

Confianza:

`99`

Política:

- `insert-only`;
- `ON CONFLICT DO NOTHING`;
- no modifica `biblical_lexical_entries`;
- no toca lema, Strong, hebreo, transliteración ni `source_gloss`;
- no toca RLS, grants ni permisos;
- no reactiva filas `rejected`;
- contexto usado como significado: **false**;
- RV1909 usado como significado: **false**;
- RV1909 usado como validación de superficie: **true**.

## Fuente congelada

Candidatos generados desde:

- STEPBible TIPNR — CC BY 4.0 — commit `b83a3cf1224af5cf72606d86d6be1789adc69541`;
- crosswalk `PatristicTextArchive/tipnr_data` — blob `abc3e21b9d08dc310066152f9b62858c4818f4eb`;
- Wikidata structured data — CC0 1.0 — `lastrevid` fijado por entidad;
- draft congelado en commit `78d7d9a5ed2aa5766b0c3145887eb9c97700fae8`;
- SHA-256 del draft: `e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6`;
- RV1909 fuente `rv1909-ebible`, aprobada y habilitada.

## Resultado real en Supabase

Auditoría posterior a la aplicación:

- total hebreo aprobado: **10,737**;
- español listo antes del lote: **1,948**;
- filas insertadas por este lote: **243**;
- español listo después del lote: **2,191**;
- español pendiente: **8,546**;
- filas antiguas `rejected`: **1,011**, sin cambios.

De las 575 candidatas inicialmente insertables:

- **243** pasaron la validación exacta contra el ancla RV1909;
- **332** quedaron fuera para revisión posterior;
- no se rellenó ninguna de las 332 por aproximación, fuzzy matching o castellanización automática.

## Reversión exacta

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' =
  'fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820';
```

## Regresión

`tests/regression/fase-h-nombres-propios-draft.test.mjs` protege ahora que:

- el lote exige el SHA congelado;
- usa `rv1909-ebible` como validación;
- exige coincidencia española exacta en el versículo ancla;
- conserva `rv1909_used_as_meaning = false`;
- conserva `context_used_as_meaning = false`;
- sigue siendo insert-only y reversible.

## Siguiente trabajo dentro del mismo Bloque 3

1. Resolver de forma conservadora las 332 candidatas descartadas, aprovechando aliases españoles de Wikidata únicamente cuando puedan verificarse en el mismo ancla RV1909.
2. Continuar cobertura de nombres TIPNR sin etiqueta española fiable.
3. Continuar glosas `plain_gloss` desde la glosa inglesa fuente aprobada.
4. Mantener separadas las 1,011 filas antiguas `rejected` hasta una revisión específica.
5. No cerrar Bloque 3 hasta alcanzar 10,737/10,737 y 0 pendientes.
