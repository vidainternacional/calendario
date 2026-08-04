create or replace function public.is_solidarity_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and coalesce(p.estado_cuenta, 'activo') = 'activo'
      and (
        p.rol::text in ('pastor', 'administrador')
        or coalesce(p.es_pastor_general, false) = true
      )
  );
$$;

revoke all on function public.is_solidarity_manager() from public, anon;
grant execute on function public.is_solidarity_manager() to authenticated, service_role;

create table if not exists public.solicitudes_ayuda_solidaria (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hogar_personas smallint not null default 1 check (hogar_personas between 1 and 30),
  urgencia text not null default 'normal' check (urgencia in ('normal', 'prioritaria', 'urgente')),
  necesidad text not null check (char_length(trim(necesidad)) between 10 and 3000),
  telefono text check (telefono is null or char_length(telefono) <= 40),
  contacto_preferido text not null default 'aplicacion' check (contacto_preferido in ('aplicacion', 'telefono', 'whatsapp')),
  estado text not null default 'enviada' check (estado in ('enviada', 'revisando', 'aprobada', 'programada', 'entregada', 'rechazada', 'cancelada')),
  respuesta text check (respuesta is null or char_length(respuesta) <= 2000),
  revisado_por uuid references public.profiles(id) on delete set null,
  revisado_at timestamptz,
  entregado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aportes_ayuda_solidaria (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('alimentos', 'monetario', 'voluntariado', 'otro')),
  monto numeric(12,2) check (monto is null or monto > 0),
  moneda text not null default 'USD' check (char_length(moneda) between 3 and 6),
  detalle text not null check (char_length(trim(detalle)) between 5 and 2000),
  telefono text check (telefono is null or char_length(telefono) <= 40),
  anonimo boolean not null default false,
  estado text not null default 'ofrecido' check (estado in ('ofrecido', 'contactando', 'recibido', 'asignado', 'completado', 'cancelado')),
  respuesta text check (respuesta is null or char_length(respuesta) <= 2000),
  revisado_por uuid references public.profiles(id) on delete set null,
  revisado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((tipo = 'monetario' and monto is not null) or tipo <> 'monetario')
);

create index if not exists solicitudes_ayuda_solidaria_profile_created_idx
  on public.solicitudes_ayuda_solidaria(profile_id, created_at desc);
create index if not exists solicitudes_ayuda_solidaria_estado_created_idx
  on public.solicitudes_ayuda_solidaria(estado, created_at desc);
create index if not exists aportes_ayuda_solidaria_profile_created_idx
  on public.aportes_ayuda_solidaria(profile_id, created_at desc);
create index if not exists aportes_ayuda_solidaria_estado_created_idx
  on public.aportes_ayuda_solidaria(estado, created_at desc);

alter table public.solicitudes_ayuda_solidaria enable row level security;
alter table public.aportes_ayuda_solidaria enable row level security;

create policy "solidarity requests own or managers read"
on public.solicitudes_ayuda_solidaria
for select
to authenticated
using (profile_id = auth.uid() or public.is_solidarity_manager());

create policy "solidarity requests own insert"
on public.solicitudes_ayuda_solidaria
for insert
to authenticated
with check (profile_id = auth.uid());

create policy "solidarity requests managers update"
on public.solicitudes_ayuda_solidaria
for update
to authenticated
using (public.is_solidarity_manager())
with check (public.is_solidarity_manager());

create policy "solidarity contributions own or managers read"
on public.aportes_ayuda_solidaria
for select
to authenticated
using (profile_id = auth.uid() or public.is_solidarity_manager());

create policy "solidarity contributions own insert"
on public.aportes_ayuda_solidaria
for insert
to authenticated
with check (profile_id = auth.uid());

create policy "solidarity contributions managers update"
on public.aportes_ayuda_solidaria
for update
to authenticated
using (public.is_solidarity_manager())
with check (public.is_solidarity_manager());

create trigger touch_solicitudes_ayuda_solidaria_updated_at
before update on public.solicitudes_ayuda_solidaria
for each row execute function public.touch_pilot_updated_at();

create trigger touch_aportes_ayuda_solidaria_updated_at
before update on public.aportes_ayuda_solidaria
for each row execute function public.touch_pilot_updated_at();

grant select, insert, update on public.solicitudes_ayuda_solidaria to authenticated;
grant select, insert, update on public.aportes_ayuda_solidaria to authenticated;
