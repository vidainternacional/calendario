-- Responsabilidades especiales ministeriales.
-- Se mantienen separadas del liderazgo y de la membresía del ministerio.

create table if not exists public.ministerio_responsabilidades (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text null,
  activo boolean not null default true,
  creado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ministerio_id, codigo)
);

create table if not exists public.ministerio_responsabilidad_asignaciones (
  id uuid primary key default gen_random_uuid(),
  responsabilidad_id uuid not null references public.ministerio_responsabilidades(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  asignado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (responsabilidad_id, profile_id)
);

create index if not exists ministerio_responsabilidades_ministerio_idx
  on public.ministerio_responsabilidades (ministerio_id, activo);
create index if not exists ministerio_responsabilidad_asignaciones_profile_idx
  on public.ministerio_responsabilidad_asignaciones (profile_id);

alter table public.ministerio_responsabilidades enable row level security;
alter table public.ministerio_responsabilidad_asignaciones enable row level security;

drop policy if exists "responsabilidades_read_authenticated" on public.ministerio_responsabilidades;
create policy "responsabilidades_read_authenticated"
on public.ministerio_responsabilidades for select
to authenticated
using (activo = true or public.es_admin_o_pastor());

drop policy if exists "responsabilidades_manage_admin" on public.ministerio_responsabilidades;
create policy "responsabilidades_manage_admin"
on public.ministerio_responsabilidades for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol = 'administrador'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol = 'administrador'
  )
);

drop policy if exists "responsabilidad_asignaciones_read_authorized" on public.ministerio_responsabilidad_asignaciones;
create policy "responsabilidad_asignaciones_read_authorized"
on public.ministerio_responsabilidad_asignaciones for select
to authenticated
using (
  profile_id = auth.uid()
  or public.es_admin_o_pastor()
  or exists (
    select 1
    from public.ministerio_responsabilidades r
    where r.id = responsabilidad_id
      and public.lidera(r.ministerio_id)
  )
);

drop policy if exists "responsabilidad_asignaciones_manage_admin" on public.ministerio_responsabilidad_asignaciones;
create policy "responsabilidad_asignaciones_manage_admin"
on public.ministerio_responsabilidad_asignaciones for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol = 'administrador'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol = 'administrador'
  )
);

grant select on public.ministerio_responsabilidades to authenticated;
grant select, insert, update, delete on public.ministerio_responsabilidad_asignaciones to authenticated;

insert into public.ministerio_responsabilidades (ministerio_id, codigo, nombre, descripcion)
select
  m.id,
  'paleta_colores',
  'Gestión de paleta de colores',
  'Autoriza a publicar y mantener la paleta de colores de Alabanza para cada servicio, sin convertir a la persona en líder del ministerio.'
from public.ministerios m
where lower(m.nombre) like '%alabanza%'
on conflict (ministerio_id, codigo) do update
set nombre = excluded.nombre,
    descripcion = excluded.descripcion,
    activo = true,
    updated_at = now();
