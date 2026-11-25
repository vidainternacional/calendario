-- Autorizada por el usuario y aplicada en ccvida el24-11-2026.
-- Registro remoto:20261124221418 sedes_base_perfil_20261124.
-- Solo estructuras nuevas: no asigna cuentas, ministerios ni responsabilidades.
begin;
create table public.vida_sedes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  nombre text not null check (length(trim(nombre)) between 3 and 100),
  pais text not null check (pais ~ '^[A-Z]{2}$'),
  zona_horaria text not null,
  central boolean not null default false,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index vida_una_sede_central on public.vida_sedes (central) where central;
create table public.vida_sede_preferencias (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  congregacion_definida boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.vida_sede_selecciones (
  profile_id uuid not null references public.vida_sede_preferencias(profile_id) on delete cascade,
  sede_id uuid not null references public.vida_sedes(id),
  pertenece boolean not null default false,
  visible boolean not null default false,
  primary key (profile_id, sede_id)
);
create index vida_sede_selecciones_por_sede on public.vida_sede_selecciones (sede_id, profile_id);
create table public.vida_ministerio_sedes (
  ministerio_id uuid primary key references public.ministerios(id) on delete cascade,
  sede_id uuid not null references public.vida_sedes(id)
);
create index vida_ministerio_sedes_por_sede on public.vida_ministerio_sedes(sede_id);
create table public.vida_sede_responsables (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sede_id uuid not null references public.vida_sedes(id),
  responsabilidad text not null check (responsabilidad in ('pastor','administrador')),
  primary key (profile_id,sede_id,responsabilidad)
);
create index vida_sede_responsables_por_sede on public.vida_sede_responsables(sede_id);

-- Invoker: no bypass RLS ni parámetros que permitan suplantar a otra persona.
create function public.vida_sedes_cuenta_activa() returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and activo is true and estado_cuenta = 'activo');
$$;
create function public.vida_sedes_gestor_global() returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and activo is true and estado_cuenta = 'activo'
   and (rol::text = 'administrador' or es_pastor_general is true));
$$;
revoke all on function public.vida_sedes_cuenta_activa(),public.vida_sedes_gestor_global() from public,anon;
grant execute on function public.vida_sedes_cuenta_activa(),public.vida_sedes_gestor_global() to authenticated,service_role;

alter table public.vida_sedes enable row level security;
alter table public.vida_sede_preferencias enable row level security;
alter table public.vida_sede_selecciones enable row level security;
alter table public.vida_ministerio_sedes enable row level security;
alter table public.vida_sede_responsables enable row level security;
revoke all on public.vida_sedes,public.vida_sede_preferencias,public.vida_sede_selecciones,public.vida_ministerio_sedes,public.vida_sede_responsables from public,anon,authenticated;
grant select,insert,update on public.vida_sedes,public.vida_sede_preferencias,public.vida_sede_selecciones,public.vida_ministerio_sedes,public.vida_sede_responsables to authenticated;
grant all on public.vida_sedes,public.vida_sede_preferencias,public.vida_sede_selecciones,public.vida_ministerio_sedes,public.vida_sede_responsables to service_role;

create policy vida_sedes_lectura on public.vida_sedes for select to authenticated using ((activa and (select public.vida_sedes_cuenta_activa())) or (select public.vida_sedes_gestor_global()));
create policy vida_sedes_crear on public.vida_sedes for insert to authenticated with check ((select public.vida_sedes_gestor_global()));
create policy vida_sedes_actualizar on public.vida_sedes for update to authenticated using ((select public.vida_sedes_gestor_global())) with check ((select public.vida_sedes_gestor_global()));
create policy vida_preferencias_propias on public.vida_sede_preferencias for select to authenticated using (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()));
create policy vida_preferencias_crear on public.vida_sede_preferencias for insert to authenticated with check (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()));
create policy vida_preferencias_actualizar on public.vida_sede_preferencias for update to authenticated using (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa())) with check (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()));
create policy vida_selecciones_propias on public.vida_sede_selecciones for select to authenticated using (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()));
create policy vida_selecciones_crear on public.vida_sede_selecciones for insert to authenticated with check (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()) and exists(select 1 from public.vida_sedes s where s.id = sede_id and s.activa));
create policy vida_selecciones_actualizar on public.vida_sede_selecciones for update to authenticated using (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa())) with check (profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa()) and exists(select 1 from public.vida_sedes s where s.id = sede_id and (s.activa or (not pertenece and not visible))));
create policy vida_ministerio_sedes_lectura on public.vida_ministerio_sedes for select to authenticated using ((select public.vida_sedes_cuenta_activa()));
create policy vida_ministerio_sedes_crear on public.vida_ministerio_sedes for insert to authenticated with check ((select public.vida_sedes_gestor_global()));
create policy vida_ministerio_sedes_actualizar on public.vida_ministerio_sedes for update to authenticated using ((select public.vida_sedes_gestor_global())) with check ((select public.vida_sedes_gestor_global()));
create policy vida_responsables_lectura on public.vida_sede_responsables for select to authenticated using ((profile_id = (select auth.uid()) and (select public.vida_sedes_cuenta_activa())) or (select public.vida_sedes_gestor_global()));
create policy vida_responsables_crear on public.vida_sede_responsables for insert to authenticated with check ((select public.vida_sedes_gestor_global()));
create policy vida_responsables_actualizar on public.vida_sede_responsables for update to authenticated using ((select public.vida_sedes_gestor_global())) with check ((select public.vida_sedes_gestor_global()));

create function public.vida_guardar_mis_sedes(p_congregacion uuid[] default null, p_visibles uuid[] default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
 if v_user is null or not public.vida_sedes_cuenta_activa() then raise exception 'Cuenta no autorizada' using errcode = '42501'; end if;
 if p_congregacion is null and p_visibles is null then raise exception 'Selección vacía'; end if;
 if coalesce(cardinality(p_congregacion),0) > 100 or coalesce(cardinality(p_visibles),0) > 100 then raise exception 'Demasiadas sedes'; end if;
 if p_visibles is not null and cardinality(p_visibles) = 0 then raise exception 'Mantén al menos una sede visible'; end if;
 if exists(select 1 from unnest(coalesce(p_congregacion,'{}'::uuid[]) || coalesce(p_visibles,'{}'::uuid[])) x(id)
   where id is null or not exists(select 1 from public.vida_sedes s where s.id=x.id and s.activa)) then raise exception 'Sede no disponible'; end if;
 insert into public.vida_sede_preferencias(profile_id) values(v_user) on conflict(profile_id) do nothing;
 -- Serializa guardados del mismo dueño sin pisar el otro tipo de preferencia.
 perform 1 from public.vida_sede_preferencias where profile_id=v_user for update;
 if p_congregacion is not null then
   update public.vida_sede_selecciones set pertenece=false where profile_id=v_user and pertenece;
   foreach v_id in array p_congregacion loop
     insert into public.vida_sede_selecciones(profile_id,sede_id,pertenece) values(v_user,v_id,true)
     on conflict(profile_id,sede_id) do update set pertenece=true;
   end loop;
   update public.vida_sede_preferencias set congregacion_definida=true where profile_id=v_user;
 end if;
 if p_visibles is not null then
   update public.vida_sede_selecciones set visible=false where profile_id=v_user and visible;
   foreach v_id in array p_visibles loop
     insert into public.vida_sede_selecciones(profile_id,sede_id,visible) values(v_user,v_id,true)
     on conflict(profile_id,sede_id) do update set visible=true;
   end loop;
 end if;
 update public.vida_sede_preferencias set updated_at=now() where profile_id=v_user;
end;
$$;
revoke all on function public.vida_guardar_mis_sedes(uuid[],uuid[]) from public,anon;
grant execute on function public.vida_guardar_mis_sedes(uuid[],uuid[]) to authenticated;
insert into public.vida_sedes(id,slug,nombre,pais,zona_horaria,central) values
 ('61000000-0000-4000-8000-000000000001','santa-ana','VIDA Santa Ana','SV','America/El_Salvador',true),
 ('61000000-0000-4000-8000-000000000002','chalchuapa','VIDA Chalchuapa','SV','America/El_Salvador',false);
commit;
