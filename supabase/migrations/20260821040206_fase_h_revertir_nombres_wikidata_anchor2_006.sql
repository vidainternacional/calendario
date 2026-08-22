-- FASE H / Bloque 3 — reversión exacta del lote 006 de nombres propios.
-- El lote v3 permitió una equivalencia española errónea en Haran»Haran (Taré),
-- causada por co-ocurrencia del nombre de otra entidad en la misma referencia.
-- Se elimina íntegramente el batch 006 para no conservar ninguna fila dudosa.
-- No modifica biblical_lexical_entries ni ningún dato fuente.

delete from public.biblical_hebrew_spanish_glosses
where provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_006_20260820';
