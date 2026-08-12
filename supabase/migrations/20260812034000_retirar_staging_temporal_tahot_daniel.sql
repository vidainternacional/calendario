-- FASE D — limpieza del staging temporal usado durante la validación de Daniel.
-- El importador directo TAHOT v5 quedó validado contra el artefacto CI, por lo que
-- esta superficie temporal ya no es necesaria.

drop function if exists public.clear_tahot_payload_stage(uuid);
drop function if exists public.finalize_tahot_daniel_import(uuid,jsonb,jsonb);
drop function if exists public.stage_tahot_payload_chunk(uuid,text,integer,jsonb);
drop table if exists internal.tahot_payload_stage;
