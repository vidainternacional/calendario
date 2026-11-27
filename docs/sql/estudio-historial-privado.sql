-- Historial privado autorizado por el propietario el 27-11-2026 tras evaluación de espacio.
-- Tabla nueva; no modifica caché antiguo, notas, usuarios, roles o políticas existentes.
begin;

create table public.estudio_historial_privado (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  consulta text not null check (char_length(consulta) between 1 and 500),
  consulta_key text not null check (consulta_key ~ '^[a-f0-9]{64}$'),
  version text not null check (char_length(version) between 1 and 80),
  tipo text not null check (tipo in ('study', 'concordance', 'place')),
  resultado jsonb not null check (jsonb_typeof(resultado) = 'object' and octet_length(resultado::text) <= 524288),
  created_at timestamptz not null default now(),
  unique (profile_id, consulta_key, version)
);

create index estudio_historial_privado_recientes
  on public.estudio_historial_privado (profile_id, created_at desc, id desc);

alter table public.estudio_historial_privado enable row level security;
revoke all on public.estudio_historial_privado from public, anon, authenticated;
grant select, insert, update, delete on public.estudio_historial_privado to authenticated;

create policy estudio_historial_leer_propio on public.estudio_historial_privado
  for select to authenticated
  using (profile_id = (select auth.uid()) and public.cuenta_activa());
create policy estudio_historial_guardar_propio on public.estudio_historial_privado
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and public.cuenta_activa());
create policy estudio_historial_actualizar_propio on public.estudio_historial_privado
  for update to authenticated
  using (profile_id = (select auth.uid()) and public.cuenta_activa())
  with check (profile_id = (select auth.uid()) and public.cuenta_activa());
create policy estudio_historial_eliminar_propio on public.estudio_historial_privado
  for delete to authenticated
  using (profile_id = (select auth.uid()) and public.cuenta_activa());

commit;
