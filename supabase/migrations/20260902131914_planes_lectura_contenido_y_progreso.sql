create table public.planes_lectura (
  id text primary key,
  titulo text not null,
  descripcion text not null,
  duracion_dias smallint not null check (duracion_dias > 0),
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.planes_lectura_dias (
  plan_id text not null references public.planes_lectura(id) on delete cascade,
  numero_dia smallint not null check (numero_dia > 0),
  titulo text not null,
  book_code text not null,
  book_name text not null,
  chapter integer not null check (chapter > 0),
  verse_start integer,
  verse_end integer,
  referencia text not null,
  devocional text not null,
  pregunta_reflexion text not null,
  created_at timestamptz not null default now(),
  primary key (plan_id, numero_dia)
);

create table public.planes_lectura_usuario (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.planes_lectura(id) on delete cascade,
  iniciado_en timestamptz not null default now(),
  ultimo_acceso_en timestamptz not null default now(),
  completado_en timestamptz,
  primary key (profile_id, plan_id)
);

create table public.planes_lectura_dias_progreso (
  profile_id uuid not null,
  plan_id text not null,
  numero_dia smallint not null,
  completado_en timestamptz not null default now(),
  primary key (profile_id, plan_id, numero_dia),
  foreign key (profile_id, plan_id)
    references public.planes_lectura_usuario(profile_id, plan_id)
    on delete cascade,
  foreign key (plan_id, numero_dia)
    references public.planes_lectura_dias(plan_id, numero_dia)
    on delete cascade
);

create index planes_lectura_dias_progreso_plan_dia_idx
  on public.planes_lectura_dias_progreso(plan_id, numero_dia);

alter table public.planes_lectura enable row level security;
alter table public.planes_lectura_dias enable row level security;
alter table public.planes_lectura_usuario enable row level security;
alter table public.planes_lectura_dias_progreso enable row level security;

revoke all on table public.planes_lectura from anon, authenticated;
revoke all on table public.planes_lectura_dias from anon, authenticated;
revoke all on table public.planes_lectura_usuario from anon, authenticated;
revoke all on table public.planes_lectura_dias_progreso from anon, authenticated;

grant select on table public.planes_lectura to authenticated;
grant select on table public.planes_lectura_dias to authenticated;
grant select, insert, update, delete on table public.planes_lectura_usuario to authenticated;
grant select, insert, update, delete on table public.planes_lectura_dias_progreso to authenticated;
grant all on table public.planes_lectura to service_role;
grant all on table public.planes_lectura_dias to service_role;
grant all on table public.planes_lectura_usuario to service_role;
grant all on table public.planes_lectura_dias_progreso to service_role;

create policy "planes_lectura_select_publicados"
on public.planes_lectura for select
to authenticated
using (publicado = true);

create policy "planes_lectura_dias_select_publicados"
on public.planes_lectura_dias for select
to authenticated
using (
  exists (
    select 1
    from public.planes_lectura p
    where p.id = plan_id
      and p.publicado = true
  )
);

create policy "planes_lectura_usuario_select_own"
on public.planes_lectura_usuario for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "planes_lectura_usuario_insert_own"
on public.planes_lectura_usuario for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "planes_lectura_usuario_update_own"
on public.planes_lectura_usuario for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "planes_lectura_usuario_delete_own"
on public.planes_lectura_usuario for delete
to authenticated
using ((select auth.uid()) = profile_id);

create policy "planes_lectura_dias_progreso_select_own"
on public.planes_lectura_dias_progreso for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "planes_lectura_dias_progreso_insert_own"
on public.planes_lectura_dias_progreso for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "planes_lectura_dias_progreso_update_own"
on public.planes_lectura_dias_progreso for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "planes_lectura_dias_progreso_delete_own"
on public.planes_lectura_dias_progreso for delete
to authenticated
using ((select auth.uid()) = profile_id);
