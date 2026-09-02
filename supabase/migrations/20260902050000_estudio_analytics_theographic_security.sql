-- VIDA Internacional — analíticas de Estudio, secuencia narrativa Theographic y cierre de backup FASE H
-- Aprobado explícitamente por el usuario el 2026-09-01.
--
-- Reversión:
-- 1) Analíticas: dejar de registrar eventos y DROP TABLE public.estudio_analytics_events CASCADE.
-- 2) Theographic: volver enabled=false en sus eventos y referencias.
-- 3) Backup FASE H: DISABLE ROW LEVEL SECURITY y restaurar grants solo si una recuperación lo exige.

create table if not exists public.estudio_analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_type text not null check (event_type in ('query', 'section')),
  query_kind text,
  query_text text,
  resolved_reference text,
  resolved_book text,
  resolved_topic text,
  result_status text,
  section_key text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists estudio_analytics_events_occurred_at_idx
  on public.estudio_analytics_events (occurred_at desc);
create index if not exists estudio_analytics_events_reference_idx
  on public.estudio_analytics_events (resolved_reference)
  where resolved_reference is not null;
create index if not exists estudio_analytics_events_book_idx
  on public.estudio_analytics_events (resolved_book)
  where resolved_book is not null;
create index if not exists estudio_analytics_events_topic_idx
  on public.estudio_analytics_events (resolved_topic)
  where resolved_topic is not null;
create index if not exists estudio_analytics_events_section_idx
  on public.estudio_analytics_events (section_key)
  where section_key is not null;

alter table public.estudio_analytics_events enable row level security;

revoke all on table public.estudio_analytics_events from anon, authenticated;
grant insert on table public.estudio_analytics_events to authenticated;

create policy "Usuarios activos registran analitica anonima de estudio"
  on public.estudio_analytics_events
  for insert
  to authenticated
  with check (public.cuenta_activa());

comment on table public.estudio_analytics_events is
  'Telemetría anónima del Centro de Estudio. No almacena profile_id, notas personales ni contenido del cuaderno.';

-- Cerrar la tabla de respaldo histórica sin borrar sus 195 filas.
alter table public._fase_h_backup_reuse_structured_identity_001_20260820 enable row level security;
revoke all on table public._fase_h_backup_reuse_structured_identity_001_20260820 from anon, authenticated;

-- Activar únicamente el corpus narrativo Theographic previamente aprobado y auditado.
do $$
declare
  v_source_id uuid;
  v_events integer;
  v_refs integer;
begin
  select id
    into v_source_id
    from public.biblical_sources
   where provider_ref = 'theographic-bible-metadata-events'
     and review_status = 'approved'
   limit 1;

  if v_source_id is null then
    raise exception 'No se encontró la fuente Theographic aprobada';
  end if;

  select count(*) into v_events
    from public.biblical_timeline_events
   where source_id = v_source_id
     and review_status = 'approved';

  select count(*) into v_refs
    from public.biblical_timeline_event_references
   where source_id = v_source_id
     and review_status = 'approved';

  if v_events <> 450 then
    raise exception 'Conteo inesperado de eventos Theographic: %, se esperaban 450', v_events;
  end if;

  if v_refs <> 17570 then
    raise exception 'Conteo inesperado de referencias Theographic: %, se esperaban 17570', v_refs;
  end if;

  update public.biblical_timeline_events
     set enabled = true,
         updated_at = now()
   where source_id = v_source_id
     and review_status = 'approved';

  update public.biblical_timeline_event_references
     set enabled = true,
         updated_at = now()
   where source_id = v_source_id
     and review_status = 'approved';
end
$$;
