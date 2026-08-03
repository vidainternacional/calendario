-- FASE D · Bloque 5
-- Índices aditivos detectados por Supabase Performance Advisor tras aplicar el esquema vacío.

create index if not exists biblical_timeline_event_places_source_id_idx
  on public.biblical_timeline_event_places (source_id);

create index if not exists biblical_timeline_events_end_book_code_idx
  on public.biblical_timeline_events (end_book_code);
