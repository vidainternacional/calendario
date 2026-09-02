create table if not exists public.versiculo_diario_preferencias (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  activo boolean not null default false,
  hora_local smallint not null default 7 check (hora_local between 0 and 23),
  ultima_fecha_enviada date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.versiculo_diario_preferencias enable row level security;

revoke all on public.versiculo_diario_preferencias from anon;
grant select, insert, update, delete on public.versiculo_diario_preferencias to authenticated;
grant all on public.versiculo_diario_preferencias to service_role;

drop policy if exists versiculo_diario_select_own on public.versiculo_diario_preferencias;
create policy versiculo_diario_select_own
  on public.versiculo_diario_preferencias for select
  to authenticated
  using ((select auth.uid()) = profile_id);

drop policy if exists versiculo_diario_insert_own on public.versiculo_diario_preferencias;
create policy versiculo_diario_insert_own
  on public.versiculo_diario_preferencias for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

drop policy if exists versiculo_diario_update_own on public.versiculo_diario_preferencias;
create policy versiculo_diario_update_own
  on public.versiculo_diario_preferencias for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists versiculo_diario_delete_own on public.versiculo_diario_preferencias;
create policy versiculo_diario_delete_own
  on public.versiculo_diario_preferencias for delete
  to authenticated
  using ((select auth.uid()) = profile_id);
