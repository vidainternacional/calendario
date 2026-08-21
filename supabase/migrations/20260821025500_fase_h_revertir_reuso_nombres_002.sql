-- FASE H / Bloque 3 — reversión del batch de propagación 002.
-- La auditoría posterior detectó que algunas equivalencias fuente heredadas
-- provenían de un batch estructurado inseguro. Se elimina únicamente el batch
-- recién creado para no propagar esas equivalencias.

delete from public.biblical_hebrew_spanish_glosses
where provenance->>'batch_id'='fase_h_es_reuse_verified_name_identity_002_20260820';
