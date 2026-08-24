# FASE H — Bloque 3 — fuentes para nombres propios en español

Fecha: 2026-08-20

Estado: **ACTIVO — fuente y pipeline reproducible definidos; no cerrar Bloque 3**.

## Problema

Después del Batch 005, la cobertura española auditada quedó en **1,948 / 10,737** entradas hebreas aprobadas. Quedan **8,789** pendientes.

Dentro de las entradas pendientes existe una familia grande de glosas TAHOT `exact_named_entity` (`Nombre»Nombre@Referencia`). Los nombres propios no deben rellenarse copiando automáticamente la grafía inglesa. Ejemplos esperados incluyen `Zechariah → Zacarías`, `Jeremiah → Jeremías`, `Joseph → José` y `Aaron → Aarón`.

## Fuente no autorizada

`BibleNLP/biblical-names-data` sigue **NO APROBADA para importación**. Aunque `names.tsv` contiene una columna RV09 técnicamente útil, el repositorio no declara una licencia inequívoca para el dataset compilado y mezcla insumos de procedencias distintas. Puede servir como referencia de investigación, no como fuente de filas de VIDA.

## Ruta aprobada de datos abiertos

### 1. STEPBible TIPNR

TIPNR está publicado como datos de STEPBible bajo **CC BY 4.0** y separa nombres propios en personas, lugares y otras entidades, conservando referencias bíblicas y formas originales.

Revisión de referencia usada por el crosswalk PTA:

`b83a3cf1224af5cf72606d86d6be1789adc69541`

### 2. Crosswalk TIPNR → Wikidata

Se verificó el repositorio público `PatristicTextArchive/tipnr_data` y el archivo:

`tipnr-persons-wikidata.tsv`

El archivo contiene columnas `TIPNR_ID` y `WIKIDATA_ID`. Ejemplo real verificado:

`Aaron_Exo.4.14 → Q51676`

Blob Git fijado para auditoría:

`abc3e21b9d08dc310066152f9b62858c4818f4eb`

El README del repositorio declara que estos datos fueron convertidos desde TIPNR y reproduce expresamente el contrato **CC BY 4.0** de STEPBible. El crosswalk se usa como evidencia de identidad, no como fuente de traducción española.

### 3. Wikidata

Las etiquetas estructuradas de Wikidata se usan como fuente de la forma española y se publican bajo **CC0 1.0**.

Para cada Q-ID se conserva:

- etiqueta inglesa;
- alias ingleses;
- etiqueta española;
- alias españoles;
- URI de entidad;
- `lastrevid` como revisión reproducible.

No se acepta coincidencia difusa. El nombre inglés de TAHOT debe coincidir exactamente, tras normalización tipográfica, con la etiqueta o un alias inglés de la misma entidad Wikidata.

## Pipeline implementado

### `scripts/hebreo/fetch_wikidata_labels.py`

- lee Q-IDs del crosswalk TIPNR → Wikidata;
- consulta `wbgetentities` de la API oficial de Wikidata;
- descarga únicamente labels/aliases EN/ES e información de revisión;
- fija `source_revision = wikidata-lastrevid:<id>`;
- etiqueta la fuente de labels como `CC0-1.0`;
- no escribe en Supabase.

### `scripts/hebreo/build_tipnr_wikidata_mapping.py`

- procesa únicamente `exact_named_entity`;
- reconstruye el `TIPNR_ID` desde `Nombre + referencia ancla`;
- cruza exactamente contra `tipnr-persons-wikidata.tsv`;
- exige coincidencia exacta del nombre inglés con label/alias Wikidata;
- solo emite fila cuando existe `spanish_label`;
- registra en la revisión el `lastrevid` de Wikidata, blob del crosswalk y commit TIPNR;
- no usa fuzzy matching;
- no usa RV1909 ni contexto bíblico como significado;
- no escribe en Supabase.

### `scripts/hebreo/proper_name_spanish_pipeline.py`

Consume el mapping final:

```text
strong_number	english_label	spanish_label	source_uri	license	source_revision
```

Una sola equivalencia española CC0 exacta puede pasar a `verified_derived` / confianza 96. Múltiples equivalencias quedan `candidate`; ausencia de evidencia queda `pending`.

## Regresiones

`tests/regression/fase-h-nombres-propios-fuentes.test.mjs` protege que:

- los adaptadores pasen self-test sin red;
- las etiquetas españolas provengan de Wikidata CC0;
- se preserve `lastrevid`;
- TIPNR/Wikidata se crucen sin fuzzy matching;
- RV1909/contexto no se usen como significado;
- estos scripts no escriban en Supabase.

## Gate antes del primer lote de nombres propios

Antes de insertar datos se debe generar y auditar el mapping completo y reportar:

1. Q-IDs TIPNR con label español;
2. Strongs cubiertos;
3. equivalencias únicas;
4. ambigüedades;
5. entradas TIPNR sin Wikidata;
6. entidades Wikidata sin label español;
7. coincidencias de nombre inglés rechazadas;
8. hash/revisión de todos los insumos;
9. SQL insert-only y reversión por `batch_id`.

Solo las equivalencias únicas y reproducibles pueden entrar al lote. Las demás continúan pendientes.

## Control de fase

- FASE H sigue activa.
- Bloque 3 sigue activo.
- PR #286 permanece OPEN · DRAFT · sin merge.
- No producción.
- No iniciar FASE I.
