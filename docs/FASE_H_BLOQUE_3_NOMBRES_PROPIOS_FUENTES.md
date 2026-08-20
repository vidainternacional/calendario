# FASE H — Bloque 3 — fuentes para nombres propios en español

Fecha: 2026-08-20

Estado: **ACTIVO — investigación de fuente y pipeline listos; no cerrar Bloque 3**.

## Problema

Tras los lotes 001–004, la cobertura española quedó en **1,909 / 10,737** entradas hebreas aprobadas. Quedan **8,828** pendientes. Dentro de las entradas sin fila editorial española se mantienen **3,649** glosas TAHOT clasificadas como `exact_named_entity` (`Nombre»Nombre@Referencia`).

Los nombres propios no deben rellenarse copiando automáticamente la grafía inglesa. Ejemplos esperados de equivalencia canónica en español incluyen `Zechariah → Zacarías`, `Jeremiah → Jeremías` y `Joseph → José`.

## Fuente candidata descartada por ahora

`BibleNLP/biblical-names-data` es técnicamente muy útil porque alinea nombres bíblicos y contiene una columna RV09 en español, pero el repositorio no declara licencia en su metadata de GitHub (`license: null`) y no contiene un archivo LICENSE en la raíz. Por ello **no se autoriza importar su TSV a VIDA** mientras la licencia de reutilización del dataset no quede explícitamente demostrada.

Puede utilizarse únicamente como pista de investigación, no como fuente de datos importable.

## Fuente candidata preferente

Wikidata es prometedora porque:

- sus datos estructurados se publican bajo **CC0**;
- existe la propiedad **Strong's number (P11416)** para lexemas hebreos/griegos;
- algunos lexemas enlazan sus sentidos a entidades que disponen de etiqueta en español;
- el enlace por Strong permite evitar heurísticas basadas en quitar prefijos o adivinar raíces.

La ruta deseada es obtener un export reproducible con estas columnas:

```text
strong_number	english_label	spanish_label	source_uri	license	source_revision
```

La importación no se hará directamente desde una respuesta de IA. La respuesta de IA puede ayudar a localizar/documentar la fuente o a construir la consulta, pero el dataset final debe provenir de una fuente machine-readable verificable y con licencia comprobable.

## Pipeline preparado

`scripts/hebreo/proper_name_spanish_pipeline.py`:

- solo procesa `exact_named_entity`;
- exige Strong + etiqueta inglesa coincidentes;
- exige fuente con licencia CC0 o dominio público;
- una sola equivalencia española licenciada → `verified_derived` / confianza 96;
- varias equivalencias → `candidate`;
- sin equivalencia o licencia insuficiente → `pending`;
- no usa RV1909/co-ocurrencia como significado;
- no escribe en Supabase;
- conserva fuente, revisión, licencia, Strong y referencia ancla en `provenance`.

## Gate

No aplicar un lote de nombres propios hasta obtener un mapping reproducible y legalmente reutilizable. Antes de escribir Supabase se auditarán:

1. número de Strong cubiertos;
2. nombres con una sola equivalencia española;
3. nombres ambiguos;
4. nombres sin cobertura;
5. procedencia/licencia/revisión de todas las filas;
6. reversión por `batch_id` igual que en los lotes anteriores.

FASE H y Bloque 3 permanecen activos. PR #286 debe seguir OPEN · DRAFT · sin merge. No iniciar FASE I.
