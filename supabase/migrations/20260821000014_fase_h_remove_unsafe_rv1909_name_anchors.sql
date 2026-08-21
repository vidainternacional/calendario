-- FASE H / Bloque 3 — retirar anclajes de nombres propios inseguros.
--
-- Backup previo versionado:
-- supabase/backups/fase_h_nombres_rv1909_anchor_20260820/restore_unsafe_name_anchors.sql
--
-- Alcance aprobado: únicamente los dos batch_id siguientes.
-- No toca biblical_lexical_entries, hebreo, lema, Strong, source_gloss,
-- ocurrencias, texto RV1909, RLS ni permisos.

delete from public.biblical_hebrew_spanish_glosses
where provenance->>'batch_id' in (
  'fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820',
  'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'
);
