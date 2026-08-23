-- FASE H · Bloque 4 — Progreso personal y práctica adaptativa
-- BORRADOR ÚNICAMENTE. NO APLICADO EN SUPABASE.
-- Requiere aprobación explícita antes de ejecutar cualquier DDL/RLS/grant.
--
-- Objetivo:
--   1) guardar sesiones de práctica privadas por usuario;
--   2) guardar respuestas individuales suficientes para calcular dominio,
--      evolución, errores recurrentes y recomendaciones sin tablas agregadas.
--
-- No crea funciones, triggers, vistas ni RPC.
-- No modifica profiles, corpus bíblico, léxico ni datos existentes.

create table public.biblical_hebrew_progress_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null,
  requested_difficulty text,
  focus_areas text[] not null default '{}'::text[],
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint biblical_hebrew_progress_sessions_mode_check
    check (mode in ('adaptive', 'difficulty')),
  constraint biblical_hebrew_progress_sessions_difficulty_check
    check (requested_difficulty is null or requested_difficulty in ('initial', 'intermediate', 'advanced')),
  constraint biblical_hebrew_progress_sessions_mode_difficulty_check
    check (
      (mode = 'adaptive')
      or (mode = 'difficulty' and requested_difficulty is not null)
    ),
  constraint biblical_hebrew_progress_sessions_status_check
    check (status in ('in_progress', 'completed', 'abandoned')),
  constraint biblical_hebrew_progress_sessions_focus_areas_check
    check (
      focus_areas <@ array[
        'alef_bet',
        'visual_recognition',
        'sofit',
        'dagesh',
        'niqqud',
        'sheva',
        'vocabulary',
        'reading',
        'rules'
      ]::text[]
    )
);

create table public.biblical_hebrew_progress_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.biblical_hebrew_progress_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question_key text not null,
  question_version integer not null default 1,
  attempt_number smallint not null default 1,
  skill text not null,
  difficulty text not null,
  response_text text,
  is_correct boolean not null,
  review_requested boolean not null default false,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint biblical_hebrew_progress_answers_question_key_check
    check (char_length(question_key) between 1 and 120),
  constraint biblical_hebrew_progress_answers_question_version_check
    check (question_version > 0),
  constraint biblical_hebrew_progress_answers_attempt_number_check
    check (attempt_number between 1 and 20),
  constraint biblical_hebrew_progress_answers_skill_check
    check (skill in (
      'alef_bet',
      'visual_recognition',
      'sofit',
      'dagesh',
      'niqqud',
      'sheva',
      'vocabulary',
      'reading',
      'rules'
    )),
  constraint biblical_hebrew_progress_answers_difficulty_check
    check (difficulty in ('initial', 'intermediate', 'advanced')),
  constraint biblical_hebrew_progress_answers_response_length_check
    check (response_text is null or char_length(response_text) <= 500),
  constraint biblical_hebrew_progress_answers_attempt_unique
    unique (session_id, question_key, attempt_number)
);

create index biblical_hebrew_progress_sessions_profile_started_idx
  on public.biblical_hebrew_progress_sessions (profile_id, started_at desc);

create index biblical_hebrew_progress_answers_session_idx
  on public.biblical_hebrew_progress_answers (session_id);

create index biblical_hebrew_progress_answers_profile_skill_answered_idx
  on public.biblical_hebrew_progress_answers (profile_id, skill, answered_at desc);

alter table public.biblical_hebrew_progress_sessions enable row level security;
alter table public.biblical_hebrew_progress_answers enable row level security;

-- Exposición mínima a Data API: anon no recibe privilegios.
revoke all on table public.biblical_hebrew_progress_sessions from public, anon;
revoke all on table public.biblical_hebrew_progress_answers from public, anon;

grant select, insert, update on table public.biblical_hebrew_progress_sessions to authenticated;
grant select, insert, update on table public.biblical_hebrew_progress_answers to authenticated;
grant all on table public.biblical_hebrew_progress_sessions to service_role;
grant all on table public.biblical_hebrew_progress_answers to service_role;

create policy "hebrew_progress_sessions_select_own_active"
on public.biblical_hebrew_progress_sessions
for select
to authenticated
using (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

create policy "hebrew_progress_sessions_insert_own_active"
on public.biblical_hebrew_progress_sessions
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

create policy "hebrew_progress_sessions_update_own_active"
on public.biblical_hebrew_progress_sessions
for update
to authenticated
using (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
)
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

create policy "hebrew_progress_answers_select_own_active"
on public.biblical_hebrew_progress_answers
for select
to authenticated
using (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.biblical_hebrew_progress_sessions s
    where s.id = session_id
      and s.profile_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

create policy "hebrew_progress_answers_insert_own_active"
on public.biblical_hebrew_progress_answers
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.biblical_hebrew_progress_sessions s
    where s.id = session_id
      and s.profile_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

create policy "hebrew_progress_answers_update_own_active"
on public.biblical_hebrew_progress_answers
for update
to authenticated
using (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.biblical_hebrew_progress_sessions s
    where s.id = session_id
      and s.profile_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
)
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1
    from public.biblical_hebrew_progress_sessions s
    where s.id = session_id
      and s.profile_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.activo = true
      and p.estado_cuenta = 'activo'
  )
);

-- ROLLBACK EXACTO (ejecutar manualmente solo si se revierte el bloque):
-- drop table if exists public.biblical_hebrew_progress_answers;
-- drop table if exists public.biblical_hebrew_progress_sessions;
